// English-for-standups widget. Rotates a useful word/phrase with IPA + RU,
// so you passively pick up meeting English during Zoom syncs.
// Add to normal mode:  { "mode": "normal", "widgets": ["vocab"] }
// Pool lives in src/data/vocab.json — extend or regenerate it freely.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dim, c256, THEMES } from "../colors.mjs";

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "vocab.json");
let POOL = [];
try { POOL = JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, "")); } catch {}

export default {
  name: "vocab",
  render(data, ctx) {
    if (!POOL.length) return null;
    const now = ctx.now ?? Date.now();
    const every = Math.max(1, ctx.config?.vocabEvery || 60) * 1000;
    const e = POOL[Math.floor(now / every) % POOL.length];
    const accent = c256((THEMES[ctx.config?.petTheme] || THEMES.warm).low);
    return accent("🗣 " + e.en) + " " + dim(e.ipa) + dim(" · " + e.ru);
  },
};
