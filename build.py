"""Build a standalone docs/index.html from index.html (the artifact page) for free static hosts."""
from pathlib import Path

here = Path(__file__).parent
src = (here / "index.html").read_text(encoding="utf-8")
head, body = src.split("<!--\n  SCHEDULE DATA", 1)
head = head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="See which tennis court hours are free today and this week.">
<meta property="og:title" content="Tennis Court Schedule">
<meta property="og:description" content="See which tennis court hours are free today and this week.">
<meta name="theme-color" content="#143d31">
{head}<style>body {{ margin: 0; }} [hidden] {{ display: none !important; }}</style>
</head>
<body>
<!--
  SCHEDULE DATA{body}
</body>
</html>
"""
out = here / "docs" / "index.html"
out.parent.mkdir(exist_ok=True)
out.write_text(page, encoding="utf-8")
print("wrote", out)
