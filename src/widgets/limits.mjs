// Usage-limits widget: Claude.ai (Pro/Max) 5-hour + weekly rate-limit windows,
// as dot-meters with the reset time. Two lines (current / weekly).
// Add to normal mode:  { "mode": "normal", "widgets": ["limits"] }
// Hidden automatically when rate_limits is absent (e.g. API-key usage).

import { c256, dim, THEMES } from "../colors.mjs";

const MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function levelColor(pct, theme) {
  return pct >= 85 ? theme.high : pct >= 60 ? theme.mid : theme.low;
}

function dots(pct, theme) {
  const n = Math.max(0, Math.min(10, Math.round(pct / 10)));
  return c256(levelColor(pct, theme))("●".repeat(n)) + dim("○".repeat(10 - n));
}

function fmtReset(epoch, now) {
  if (!epoch) return "";
  const d = new Date(epoch * 1000);
  let h = d.getHours();
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  const time = `${h}:${String(d.getMinutes()).padStart(2, "0")}${ap}`;
  const sameDay = d.toDateString() === new Date(now).toDateString();
  return sameDay ? time : `${MON[d.getMonth()]} ${d.getDate()}, ${time}`;
}

export default {
  name: "limits",
  render(data, ctx) {
    const rl = data.rate_limits;
    if (!rl || (!rl.five_hour && !rl.seven_day)) return null;
    const theme = THEMES[ctx.config?.petTheme] || THEMES.warm;
    const now = ctx.now ?? Date.now();

    const row = (label, w) => {
      if (!w) return null;
      const pct = Math.round(w.used_percentage || 0);
      return `${dim(label.padEnd(7))} ${dots(pct, theme)} ${c256(levelColor(pct, theme))(`${pct}%`)}  ${dim("↻ " + fmtReset(w.resets_at, now))}`;
    };

    return [row("current", rl.five_hour), row("weekly", rl.seven_day)].filter(Boolean).join("\n");
  },
};
