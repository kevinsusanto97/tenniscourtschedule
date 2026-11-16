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

Setup (already done for this project):

1. Supabase → **SQL Editor** → run `supabase/votes.sql`. It creates the table and lets members read, add and remove votes.
2. `api/votes.js` holds the Project URL and the publishable key. Both are public by design; access comes from the policies in step 1. To use a different project, change them there or set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (or a secret key in `SUPABASE_SERVICE_ROLE_KEY`) in Vercel.

There are no accounts: anyone with the link can vote under any name, so it suits a club group, not a public page.

## Vercel settings

Framework Preset `Other`, no build command. The root `vercel.json` serves the site from `docs/`, so Root Directory can stay at the repo root.
