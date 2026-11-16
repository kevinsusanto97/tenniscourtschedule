// Votes per schedule slot, stored in Upstash Redis (connected through Vercel Storage).
//   GET    /api/votes                  -> { votes: { "2026-11-16_10:00": ["Andi", "Budi"] } }
//   POST   /api/votes { slot, name }   -> { slot, names }
//   DELETE /api/votes { slot, name }   -> { slot, names }
// Redis keys: "v:slots" (set of slot ids that have votes) and "v:<slot>" (set of names).

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SLOT_RE = /^\d{4}-\d{2}-\d{2}_\d{2}:\d{2}$/;
const MAX_NAMES = 40;

// Local development without Redis keeps votes in memory.
const memory = new Map();

async function redis(commands) {
  if (!URL_ || !TOKEN) {
    return commands.map(([cmd, key, member]) => {
      const set = memory.get(key) || new Set();
      if (cmd === "SMEMBERS") return { result: [...set] };
      if (cmd === "SADD") { const had = set.has(member); set.add(member); memory.set(key, set); return { result: had ? 0 : 1 }; }
      if (cmd === "SREM") { const had = set.delete(member); if (!set.size) memory.delete(key); return { result: had ? 1 : 0 }; }
      if (cmd === "SCARD") return { result: set.size };
      throw new Error("Unsupported command " + cmd);
    });
  }
  const r = await fetch(URL_.replace(/\/$/, "") + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error("Redis " + r.status);
  return r.json();
}

function cleanName(raw) {
  return String(raw || "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
}

async function namesFor(slot) {
  const [res] = await redis([["SMEMBERS", "v:" + slot]]);
  return (res.result || []).sort((a, b) => a.localeCompare(b));
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (process.env.VERCEL && (!URL_ || !TOKEN)) {
    return res.status(503).json({ error: "Voting isn't set up yet." });
  }
  try {
    if (req.method === "GET") {
      const [slots] = await redis([["SMEMBERS", "v:slots"]]);
      const ids = (slots.result || []).filter((s) => SLOT_RE.test(s));
      const out = {};
      if (ids.length) {
        const sets = await redis(ids.map((id) => ["SMEMBERS", "v:" + id]));
        ids.forEach((id, i) => {
          const names = sets[i].result || [];
          if (names.length) out[id] = names.sort((a, b) => a.localeCompare(b));
        });
      }
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

    const current = await namesFor(slot);
    const match = current.find((n) => n.toLowerCase() === name.toLowerCase());

    if (req.method === "POST") {
      if (match) return res.status(200).json({ slot, names: current });
      if (current.length >= MAX_NAMES) return res.status(409).json({ error: "This time already has " + MAX_NAMES + " votes." });
      await redis([["SADD", "v:" + slot, name], ["SADD", "v:slots", slot]]);
    } else {
      if (!match) return res.status(200).json({ slot, names: current });
      await redis([["SREM", "v:" + slot, match]]);
      const [count] = await redis([["SCARD", "v:" + slot]]);
      if (!count.result) await redis([["SREM", "v:slots", slot]]);
    }
    return res.status(200).json({ slot, names: await namesFor(slot) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Couldn't save the vote. Try again." });
  }
};
