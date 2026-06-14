#!/usr/bin/env node
// cc-statusline installer. Wires (or removes) the statusLine entry in
// ~/.claude/settings.json. Uses absolute node + script paths (PATH-proof),
// backs up settings.json, and leaves the rest of the config untouched.
//
//   node bin/install.mjs              # install
//   node bin/install.mjs --uninstall  # remove
//   node bin/install.mjs --mode tamagotchi   # also set config.json mode

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const uninstall = args.includes("--uninstall");
const modeIdx = args.indexOf("--mode");
const wantMode = modeIdx !== -1 ? args[modeIdx + 1] : null;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(repoRoot, "src", "statusline.mjs").replace(/\\/g, "/");
const nodePath = process.execPath.replace(/\\/g, "/");
const settingsPath = path.join(os.homedir(), ".claude", "settings.json");
const configPath = path.join(repoRoot, "config.json");

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, ""));
  } catch (e) {
    if (e.code === "ENOENT") return fallback;
    throw new Error(`${file} is not valid JSON: ${e.message}`);
  }
}

function saveJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
}

const settings = loadJson(settingsPath, {});

// backup existing settings before touching them
let bak = null;
if (fs.existsSync(settingsPath)) {
  bak = settingsPath + ".bak";
  fs.copyFileSync(settingsPath, bak);
}

if (uninstall) {
  delete settings.statusLine;
  saveJson(settingsPath, settings);
  console.log("✓ statusLine removed from", settingsPath);
} else {
  settings.statusLine = {
    type: "command",
    command: `"${nodePath}" "${scriptPath}"`,
    padding: 0,
  };
  saveJson(settingsPath, settings);
  console.log("✓ cc-statusline installed");
  console.log("  settings:", settingsPath);
  console.log("  command :", settings.statusLine.command);

  if (wantMode) {
    const cfg = loadJson(configPath, {});
    cfg.mode = wantMode;
    saveJson(configPath, cfg);
    console.log("  mode    :", wantMode, "(config.json)");
  }
}

if (bak) console.log("  backup  :", bak);
console.log("\nRestart Claude Code (close & reopen the terminal) to apply.");
