// Votes per schedule slot, stored in the Supabase table public.votes (see supabase/votes.sql).
//   GET    /api/votes                  -> { votes: { "2026-11-16_10:00": ["Andi", "Budi"] } }
//   POST   /api/votes { slot, name }   -> { slot, names }
//   DELETE /api/votes { slot, name }   -> { slot, names }
// Uses the service role key on the server only; the table has RLS on and no public policies.

const SB_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
const SLOT_RE = /^\d{4}-\d{2}-\d{2}_\d{2}:\d{2}$/;
const MAX_NAMES = 40;
const KEEP_DAYS = 14; // GET returns votes from two weeks back onwards

async function sb(path, options = {}) {
  const r = await fetch(SB_URL + "/rest/v1/" + path, {
    ...options,
    headers: {
      apikey: SB_KEY,
      // Legacy service_role keys are JWTs and go in Authorization too; new sb_secret_ keys only need apikey.
      ...(SB_KEY.startsWith("eyJ") ? { Authorization: "Bearer " + SB_KEY } : {}),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    const err = new Error("Supabase " + r.status + " " + (body.message || ""));
    err.code = body.code;
    throw err;
  }
  return r.status === 204 ? null : r.json().catch(() => null);
}

// Local development without Supabase keeps votes in memory.
const memory = [];
const store = SB_URL && SB_KEY ? {
  list: (since) => sb("votes?select=slot,name&slot=gte." + encodeURIComponent(since) + "&order=slot,name"),
  names: async (slot) => (await sb("votes?select=name&slot=eq." + encodeURIComponent(slot))).map((r) => r.name),
  add: (slot, name) => sb("votes", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ slot, name }) })
    .catch((e) => { if (e.code !== "23505") throw e; }), // already voted (unique slot + name)
  remove: (slot, name) => sb("votes?slot=eq." + encodeURIComponent(slot) + "&name=eq." + encodeURIComponent(name), { method: "DELETE" }),
} : {
  list: async (since) => memory.filter((r) => r.slot >= since),
  names: async (slot) => memory.filter((r) => r.slot === slot).map((r) => r.name),
  add: async (slot, name) => { memory.push({ slot, name }); },
  remove: async (slot, name) => { const i = memory.findIndex((r) => r.slot === slot && r.name === name); if (i >= 0) memory.splice(i, 1); },
};

function cleanName(raw) {
  return String(raw || "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
}
const byName = (a, b) => a.localeCompare(b);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (process.env.VERCEL && !(SB_URL && SB_KEY)) {
    return res.status(503).json({ error: "Voting isn't set up yet." });
  }
  try {
    if (req.method === "GET") {
      const since = new Date(Date.now() - KEEP_DAYS * 864e5).toISOString().slice(0, 10);
      const out = {};
      (await store.list(since)).forEach((r) => { (out[r.slot] = out[r.slot] || []).push(r.name); });
      Object.values(out).forEach((names) => names.sort(byName));
      return res.status(200).json({ votes: out });
    }

    if (req.method !== "POST" && req.method !== "DELETE") {
      res.setHeader("Allow", "GET, POST, DELETE");
      return res.status(405).json({ error: "Method not allowed." });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const slot = String(body.slot || "");
    const name = cleanName(body.name);
    if (!SLOT_RE.test(slot)) return res.status(400).json({ error: "Unknown time slot." });
    if (!name) return res.status(400).json({ error: "Enter your name." });

    const current = await store.names(slot);
    const match = current.find((n) => n.toLowerCase() === name.toLowerCase());

    if (req.method === "POST" && !match) {
      if (current.length >= MAX_NAMES) return res.status(409).json({ error: "This time already has " + MAX_NAMES + " votes." });
      await store.add(slot, name);
    } else if (req.method === "DELETE" && match) {
      await store.remove(slot, match);
    }
    return res.status(200).json({ slot, names: (await store.names(slot)).sort(byName) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Couldn't save the vote. Try again." });
  }
};
