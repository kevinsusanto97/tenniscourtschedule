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

## Vercel settings

Root Directory `docs`, Framework Preset `Other`, no build command.
