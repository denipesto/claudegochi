// Config: defaults + optional override from <projectRoot>/config.json.
// Keeps the statusline "modules + config" — enable/reorder widgets without code edits.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const defaultConfig = {
  // "normal" = render the widgets list; "tamagotchi" = render the pet instead
  mode: "normal",
  // widget names to render, in order (see REGISTRY in statusline.mjs)
  widgets: ["context"],
  // separator between widgets
  separator: " │ ",
  // null = auto-detect (200k, or 1M for [1m] models); or set an explicit number
  contextWindow: null,
  // tamagotchi mode: pet name
  petName: "claudegochi",
};

export function loadConfig() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const file = path.join(root, "config.json");
  try {
    const text = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
    const user = JSON.parse(text);
    return { ...defaultConfig, ...user };
  } catch {
    return defaultConfig;
  }
}
