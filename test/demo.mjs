// Visual demo of claudegochi v2: stages, needs, moods, flashes, animation.
// Run: node test/demo.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import tama from "../src/widgets/tamagotchi.mjs";
import { makeT } from "../src/i18n.mjs";
import { stageOf, levelOf, xpForLevel } from "../src/pet.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fix = (n) => path.join(here, `fix-${n}.jsonl`);
const t = makeT("en");

// build a fake pet state at a given level (+ optional flash/streak)
function pet(level, { flash = null, streak = 1, gain = 0 } = {}) {
  const xp = xpForLevel(level) + 5;
  return {
    xp, gain, level, stage: stageOf(level), streak, feeds: 0,
    xpInto: xp - xpForLevel(level), xpNeed: Math.max(1, xpForLevel(level + 1) - xpForLevel(level)),
    events: [], flash, ageDays: streak,
  };
}

// daytime, aligned so frame%5==0 at DAY5 (open eyes at +2s, blink at +0s)
const DAY5 = Math.floor(new Date(2026, 5, 15, 14, 30, 0).getTime() / 5000) * 5000;
const OPEN = DAY5 + 2000;

function show(label, fixN, petState, { dur = 0, now = OPEN } = {}) {
  const data = {
    model: { id: "claude-opus-4-8" },
    workspace: { project_dir: "C:/dev/cc-statusline" },
    transcript_path: fix(fixN),
    cost: { total_duration_ms: dur },
    session_id: "demo",
  };
  const ctx = { config: { contextWindow: 200000, petName: "claudegochi", petStyle: "sprite", petReactGit: false }, t, now, petState, preview: true };
  console.log(`\n── ${label} ──`);
  console.log(tama.render(data, ctx));
}

console.log("══════ stages (hunger ~25%) ══════");
show("egg  (Lv.0)", 25, pet(0));
show("kitten (Lv.2)", 25, pet(2));
show("cat  (Lv.4)", 25, pet(4));
show("elder (Lv.8)", 25, pet(8));

console.log("\n══════ needs / moods (cat) ══════");
show("content 25%", 25, pet(4));
show("peckish 65%", 65, pet(4));
show("hungry 82%", 82, pet(4));
show("starving 96%", 96, pet(4));
show("tired (4h session)", 25, pet(4), { dur: 4 * 3600 * 1000 });

console.log("\n══════ event flashes ══════");
show("fed  /compact", 25, pet(4, { flash: "fed", gain: 6 }));
show("commit", 25, pet(5, { flash: "commit", gain: 10 }));
show("LEVEL UP", 25, pet(5, { flash: "levelup" }));
show("streak", 25, pet(4, { streak: 7 }));

console.log("\n══════ animation (blink at +0s, open otherwise) ══════");
for (const k of [0, 1, 2, 3]) show(`+${k}s`, 25, pet(4), { now: DAY5 + k * 1000 });

console.log("");
