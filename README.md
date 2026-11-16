# Tennis Court Schedule

A mobile-friendly page that shows which tennis court hours are free, by day and across the week. Hosted on Vercel from the `docs/` folder.

## Update the schedule

1. Open `/admin` on the site, paste the new schedule and check it. Problems (typos, wrong day names) are listed there. **Preview on site** shows how it will look.
2. Tap **Copy text**, then **Open schedule.txt on GitHub**.
3. In the GitHub editor, select everything, paste and tap **Commit changes**. Vercel redeploys in about a minute.

Format of `docs/schedule.txt`:

```
SENIN, 16 NOVEMBER 2026
06:00 - 07:00
07:00 - 08:00
```

Listed hours show as **free**; hours not listed show as booked. Indonesian or English day and month names both work.

## Files

- `docs/index.html`: the schedule page members see
- `docs/admin.html`: paste-and-check page for the committee
- `docs/schedule.txt`: the schedule data
- `docs/schedule.js`: reads the schedule text (shared by both pages)
- `api/votes.js`: stores and returns votes (Vercel function, Supabase)
- `supabase/votes.sql`: creates the votes table

## Votes

Members tap **Vote** on a time and enter their name. Everyone sees who voted on each time and in the **Voted times** list. Votes are stored in the Supabase table `votes`.

One-time setup:

1. Supabase → **SQL Editor** → run `supabase/votes.sql`.
2. Vercel → project **Settings → Environment Variables**, add for Production (and Preview if you use it):
   - `SUPABASE_URL`: Supabase **Project Settings → Data API** → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase **Project Settings → API Keys** → the `service_role` key (or a new secret key, `sb_secret_…`)
3. Redeploy.

The key stays on the server (`api/votes.js`); the page never sees it. Until it's set, the page shows "Voting isn't available right now" and everything else keeps working.

There are no accounts: anyone with the link can vote under any name, so it suits a club group, not a public page.

## Vercel settings

Framework Preset `Other`, no build command. The root `vercel.json` serves the site from `docs/`, so Root Directory can stay at the repo root.
