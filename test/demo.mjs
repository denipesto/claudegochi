// Visual demo: render the tamagotchi in every mood, using synthetic fixtures.
// Run: node test/demo.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import tama from "../src/widgets/tamagotchi.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fix = (n) => path.join(here, `fix-${n}.jsonl`);

// force a given local hour so we can show both day & night moods deterministically
function at(hour, fn) {
  const orig = Date.prototype.getHours;
  Date.prototype.getHours = () => hour;
  try { return fn(); } finally { Date.prototype.getHours = orig; }
}

const cases = [
  ["content (25%, day)", fix(25), 14, "sprite"],
  ["ok (65%, day)", fix(65), 14, "sprite"],
  ["hungry (82%)", fix(82), 14, "sprite"],
  ["starving (96%)", fix(96), 14, "sprite"],
  ["sleepy (25%, 02:00)", fix(25), 2, "sprite"],
  ["compact line (82%)", fix(82), 14, "compact"],
];

for (const [label, transcript, hour, petStyle] of cases) {
  const data = { model: { id: "claude-opus-4-8" }, transcript_path: transcript };
  const ctx = { config: { contextWindow: 200000, petName: "claudegochi", petStyle } };
  const out = at(hour, () => tama.render(data, ctx));
  console.log(`\n── ${label} ──`);
  console.log(out);
}
console.log("");
