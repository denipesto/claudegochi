// ⭐ MVP widget: how much of the context window is used + how much is left.

import { bar, colorByRatio, fmtTokens } from "../colors.mjs";
import { contextState } from "../tokens.mjs";

export default {
  name: "context",
  render(data, ctx) {
    const s = contextState(data, ctx.config);
    if (!s) return null;
    const pct = Math.round(s.ratio * 100);
    const text = `ctx ${bar(s.ratio, 10)} ${pct}% · ${fmtTokens(s.left)} left`;
    return colorByRatio(s.ratio, text);
  },
};
