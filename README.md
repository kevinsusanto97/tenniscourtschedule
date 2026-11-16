# Tennis Court Schedule

A mobile-friendly page that shows which tennis court hours are free, by day and across the week.

## Update the schedule

1. Open `index.html` and replace the text inside `<script type="text/plain" id="schedule-text">` with the new schedule. Format:

   ```
   SENIN, 16 NOVEMBER 2026
   06:00 - 07:00
   07:00 - 08:00
   ```

   Listed hours are shown as **free**; hours not listed are shown as booked. Indonesian or English day and month names both work.

2. Rebuild the hosted page:

   ```bash
   python3 build.py
   ```

3. Commit and push. GitHub Pages serves `docs/index.html`.

## Hosting on GitHub Pages

Repository **Settings → Pages → Build and deployment**: Source *Deploy from a branch*, branch `main`, folder `/docs`.
# tenniscourtschedule
