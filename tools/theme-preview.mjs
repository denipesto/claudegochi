// Renders a warm/cool/mono comparison SVG of the status line. -> C:/tmp/themes.svg
import fs from "node:fs";
import { THEMES } from "../src/colors.mjs";

function hex(n) {
  if (n >= 232) { const v = 8 + (n - 232) * 10; const h = v.toString(16).padStart(2, "0"); return `#${h}${h}${h}`; }
  const c = [0, 95, 135, 175, 215, 255];
  n -= 16; const r = Math.floor(n / 36), g = Math.floor((n % 36) / 6), b = n % 6;
  const h = (x) => c[x].toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

const FILL = 0.65, N = 10, full = FILL * N;
function bar(grad, x, y) {
  let s = "";
  for (let i = 0; i < N; i++) {
    const col = i < Math.floor(full) || (i === Math.floor(full) && full % 1 > 0.08)
      ? hex(grad[Math.min(grad.length - 1, Math.floor((i / N) * grad.length))]) : "#20262f";
    const w = i === Math.floor(full) && full % 1 > 0.08 ? 7 : 13;
    s += `<rect x="${x + i * 15}" y="${y}" width="${w}" height="17" rx="2" fill="${col}"/>`;
  }
  return s;
}

const rows = ["warm", "cool", "mono"].map((name, idx) => {
  const th = THEMES[name];
  const mid = hex(th.mid), low = hex(th.low);
  const oy = 18 + idx * 116;
  return `
  <text x="24" y="${oy + 64}" font-size="11" fill="#5d6675" letter-spacing="1.5">${name.toUpperCase()}</text>
  <g font-family="'DejaVu Sans Mono','Cascadia Mono',monospace" font-size="20">
    <text x="92" y="${oy + 22}" fill="${mid}" xml:space="preserve"> /\\_/\\</text>
    <text x="210" y="${oy + 22}" fill="#fff" font-weight="bold">claudegochi</text>
    <text x="372" y="${oy + 22}" fill="#6b7480">Lv.4 cat</text>
    <text x="92" y="${oy + 55}" fill="${mid}" xml:space="preserve">( o_o )</text>
    <text x="210" y="${oy + 55}" fill="#6b7480">ctx</text>
    ${bar(th.grad, 252, oy + 41)}
    <text x="410" y="${oy + 55}" fill="${mid}">65%</text>
    <text x="452" y="${oy + 55}" fill="#6b7480" xml:space="preserve">· 70k left</text>
    <text x="92" y="${oy + 88}" fill="${mid}" xml:space="preserve"> &gt; ~ &lt;</text>
    <text x="210" y="${oy + 88}" fill="${mid}">getting peckish…</text>
  </g>
  ${idx < 2 ? `<line x1="24" y1="${oy + 104}" x2="616" y2="${oy + 104}" stroke="#1b212b"/>` : ""}`;
}).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="${18 + 3 * 116}" viewBox="0 0 640 ${18 + 3 * 116}">
<rect width="640" height="${18 + 3 * 116}" rx="12" fill="#0c0f16"/>${rows}
</svg>`;
fs.writeFileSync("C:/tmp/themes.svg", svg);
console.log("wrote C:/tmp/themes.svg");
