// ANSI helpers + small formatters. No deps — keep render fast.

export const ansi = (code) => (s) => `\x1b[${code}m${s}\x1b[0m`;
export const dim = ansi(2);
export const bold = ansi(1);
export const red = ansi(31);
export const green = ansi(32);
export const yellow = ansi(33);
export const cyan = ansi(36);
export const gray = ansi(90);
export const brightRed = ansi(91);
export const brightGreen = ansi(92);
export const brightYellow = ansi(93);

// Color a string by a 0..1 ratio: green (ok) → yellow (watch) → red (urgent).
export function colorByRatio(r, s) {
  if (r >= 0.85) return red(s);
  if (r >= 0.6) return yellow(s);
  return green(s);
}

// Unicode block progress bar, e.g. ▓▓▓▓▓▓░░░░
export function bar(ratio, width = 10) {
  const r = Math.max(0, Math.min(ratio, 1));
  const filled = Math.round(r * width);
  return "▓".repeat(filled) + "░".repeat(Math.max(width - filled, 0));
}

// Solid segmented meter, e.g. ████████░░ — for the tamagotchi satiety/health bar.
export function meter(fill, width = 8) {
  const r = Math.max(0, Math.min(fill, 1));
  const filled = Math.round(r * width);
  return "█".repeat(filled) + "░".repeat(Math.max(width - filled, 0));
}

// Clean solid bar: filled cells via paintFn, empty cells as a dim dark track
// (no ░ hatch). e.g. solidBar(0.4, 8, green) -> green ███ + dark █████
const trackDim = ansi("38;5;237");
export function solidBar(fill, width, paintFn) {
  const r = Math.max(0, Math.min(fill, 1));
  const f = Math.round(r * width);
  return paintFn("█".repeat(f)) + trackDim("█".repeat(Math.max(width - f, 0)));
}

// color by 256-code number
export const c256 = (n) => ansi(`38;5;${n}`);

// Palette themes: low (ok) / mid (warn) / high (danger) tones + a 7-stop
// gradient for the context bar. Switch via config.petTheme.
export const THEMES = {
  warm: { low: 114, mid: 179, high: 203, grad: [78, 114, 149, 179, 215, 209, 203] },
  cool: { low: 80, mid: 75, high: 170, grad: [37, 44, 80, 75, 69, 104, 170] },
  mono: { low: 250, mid: 245, high: 231, grad: [238, 241, 244, 247, 250, 252, 255] },
};

// Gradient bar: filled cells shade along `palette` (low→high), with a sub-cell
// partial last block; empty cells are a dim dark track.
const EIGHTHS = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉"];
export function gradientBar(fill, width = 10, palette = THEMES.warm.grad) {
  const r = Math.max(0, Math.min(fill, 1));
  const full = r * width;
  const whole = Math.floor(full);
  const frac = full - whole;
  let out = "";
  for (let i = 0; i < width; i++) {
    const col = palette[Math.min(palette.length - 1, Math.floor((i / width) * palette.length))];
    if (i < whole) out += ansi(`38;5;${col}`)("█");
    else if (i === whole && frac > 0.08) out += ansi(`38;5;${col}`)(EIGHTHS[Math.min(7, Math.max(1, Math.round(frac * 8)))]);
    else out += trackDim("█");
  }
  return out;
}

// Compact token formatting: 940 → "940", 72000 → "72k", 1240000 → "1.2M"
export function fmtTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return Math.round(n / 1000) + "k";
  return String(n);
}
