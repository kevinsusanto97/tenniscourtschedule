// Shared by index.html and admin.html: turns the pasted schedule text into days and time slots.
var MONTHS = { JANUARI:0, JANUARY:0, FEBRUARI:1, FEBRUARY:1, MARET:2, MARCH:2, APRIL:3, MEI:4, MAY:4, JUNI:5, JUNE:5, JULI:6, JULY:6, AGUSTUS:7, AUGUST:7, SEPTEMBER:8, OKTOBER:9, OCTOBER:9, NOVEMBER:10, DESEMBER:11, DECEMBER:11 };
var DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function pad(n) { return String(n).padStart(2, "0"); }

// Returns { days, warnings }. Lines before the first day header (like a heading) are ignored.
function parseSchedule(text) {
  var days = [], warnings = [], cur = null;
  var dayRe = /^(SENIN|SELASA|RABU|KAMIS|JUM'?AT|SABTU|MINGGU|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)\s*,?\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i;
  var timeRe = /(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/;
  text.split(/\r?\n/).forEach(function (raw, i) {
    var line = raw.trim(); if (!line) return;
    var d = line.match(dayRe);
    if (d) {
      var m = MONTHS[d[3].toUpperCase()];
      if (m === undefined) { warnings.push("Line " + (i + 1) + ": unknown month \"" + d[3] + "\""); cur = null; return; }
      cur = { date: new Date(+d[4], m, +d[2]), slots: [] };
      if (DAY_NAMES[cur.date.getDay()].slice(0, 3).toUpperCase() !== englishDay(d[1]))
        warnings.push("Line " + (i + 1) + ": " + d[2] + " " + d[3] + " " + d[4] + " is a " + DAY_NAMES[cur.date.getDay()] + ", not " + d[1]);
      days.push(cur); return;
    }
    var t = line.match(timeRe);
    if (t) {
      if (!cur) { if (days.length) warnings.push("Line " + (i + 1) + ": time without a valid day above it"); else warnings.push("Line " + (i + 1) + ": time before the first day line"); return; }
      var s = { start: +t[1] + +t[2] / 60, end: +t[3] + +t[4] / 60, label: pad(t[1]) + ":" + t[2], endLabel: pad(t[3]) + ":" + t[4] };
      if (s.end <= s.start) { warnings.push("Line " + (i + 1) + ": end time is not after start time (" + line + ")"); return; }
      cur.slots.push(s); return;
    }
    if (days.length) warnings.push("Line " + (i + 1) + ": not recognised (\"" + line + "\")");
  });
  days.forEach(function (d) { d.slots.sort(function (a, b) { return a.start - b.start; }); });
  return { days: days, warnings: warnings };
}

function englishDay(name) {
  var map = { SENIN:"MON", SELASA:"TUE", RABU:"WED", KAMIS:"THU", JUMAT:"FRI", "JUM'AT":"FRI", SABTU:"SAT", MINGGU:"SUN" };
  var n = name.toUpperCase();
  return map[n] || n.slice(0, 3);
}
