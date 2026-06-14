// 🐣 Tamagotchi mode — an ASCII pet whose mood reflects the session.
// Driver = context fullness (his "hunger"): the fuller the context, the hungrier
// he gets, until he begs you to feed him with /compact. Late at night he sleeps.
// Satiety meter + hearts = how much free context ("life") is left.
//
// Claude Code statusLine renders each output line as its own row, so the default
// "sprite" style draws a 3-line cat. Set petStyle:"compact" for a single line.
//
// config.json:  { "mode": "tamagotchi", "petName": "claudegochi", "petStyle": "sprite" }

import { meter, red, gray, bold, dim, brightGreen, brightYellow, brightRed } from "../colors.mjs";
import { contextState } from "../tokens.mjs";

function colorFor(ratio) {
  if (ratio >= 0.85) return brightRed;
  if (ratio >= 0.6) return brightYellow;
  return brightGreen;
}

function hearts(satiety) {
  const n = Math.max(0, Math.min(5, Math.round(satiety * 5)));
  return red("♥".repeat(n)) + gray("♡".repeat(5 - n));
}

// Pick a mood. Priority: starving > hungry > sleepy(night) > content > ok.
// eyes/mouth keep a fixed width so the sprite stays aligned.
function mood(ratio, hour) {
  const night = hour >= 23 || hour < 6;
  if (ratio >= 0.9) return { eyes: "x_x", mouth: "!", emoji: "🙀", say: "ПОКОРМИ! /compact" };
  if (ratio >= 0.75) return { eyes: ";_;", mouth: "~", emoji: "😿", say: "урчит животик…" };
  if (night) return { eyes: "-_-", mouth: "z", emoji: "😴", say: "поздно, спатки? zZ" };
  if (ratio < 0.5) return { eyes: "^_^", mouth: "ω", emoji: "😺", say: "сыт и доволен" };
  return { eyes: "o_o", mouth: "‿", emoji: "😸", say: "бодрячком" };
}

function spriteView({ name, m, paint, heartsStr, meterStr, pct }) {
  // cat sprite, padded to a fixed column, then the info panel on the right
  const raw = [" /\\_/\\", `( ${m.eyes} )`, ` > ${m.mouth} <`];
  const w = Math.max(...raw.map((r) => r.length));
  const cat = raw.map((r) => paint(r.padEnd(w)));
  return [
    `${cat[0]}   ${bold(name)}`,
    `${cat[1]}   ${heartsStr}  ${meterStr} ${pct}%`,
    `${cat[2]}   ${dim(m.say)}`,
  ].join("\n");
}

function compactView({ name, m, paint, heartsStr, meterStr, pct }) {
  return [m.emoji, bold(name), " ", heartsStr, paint(meterStr), dim(`${m.say} · ctx ${pct}%`)].join(" ");
}

export default {
  name: "tamagotchi",
  render(data, ctx) {
    const s = contextState(data, ctx.config);
    if (!s) return null;

    const m = mood(s.ratio, new Date().getHours());
    const paint = colorFor(s.ratio);
    const satiety = 1 - s.ratio;
    const view = {
      name: ctx.config?.petName || "claudegochi",
      m,
      paint,
      heartsStr: hearts(satiety),
      meterStr: paint(meter(satiety, 10)),
      pct: Math.round(s.ratio * 100),
    };

    return ctx.config?.petStyle === "compact" ? compactView(view) : spriteView(view);
  },
};
