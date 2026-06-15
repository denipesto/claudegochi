// Quote-of-the-day widget. Standalone — add it to the `widgets` list in
// normal mode:  { "mode": "normal", "widgets": ["context", "quote"] }
// Short, attributed craft/building aphorisms; rotates once per day.

import { dim, c256 } from "../colors.mjs";

const QUOTES = [
  '"Make it work, make it right." — Beck',
  '"Simplicity is the soul of efficiency."',
  '"Done is better than perfect."',
  '"Less, but better." — Rams',
  '"Talk is cheap. Show me the code." — Linus',
  '"Real artists ship." — Jobs',
  '"The only way to go fast is to go well."',
  '"First solve the problem, then code."',
  '"Code is read more than it is written."',
  '"Slow is smooth, smooth is fast."',
  '"Make the change easy, then change."',
  '"Perfection: nothing left to remove."',
  '"Weeks of coding save hours of planning."',
  '"Premature optimization is the root of all evil." — Knuth',
  '"Programs must be written for people to read."',
];

export default {
  name: "quote",
  render(data, ctx) {
    const now = ctx.now ?? Date.now();
    const q = QUOTES[Math.floor(now / 86400000) % QUOTES.length];
    return c256(80)("✦ ") + dim(q);
  },
};
