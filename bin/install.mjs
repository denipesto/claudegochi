#!/usr/bin/env node
// cc-statusline installer. Wires (or removes) the statusLine entry in
// ~/.claude/settings.json. Uses absolute node + script paths (PATH-proof),
// backs up settings.json, and leaves the rest of the config untouched.
//
//   node bin/install.mjs                     # install
//   node bin/install.mjs --uninstall          # remove
//   node bin/install.mjs --mode tamagotchi    # set config.json mode
//   node bin/install.mjs --lang ru            # set config.json language

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── styling ─────────────────────────────────────────────────────────
const color = process.stdout.isTTY && !process.env.NO_COLOR;
const x = (c) => (s) => (color ? `\x1b[${c}m${s}\x1b[0m` : s);
const grn = x("38;5;78"), grnB = x("38;5;120"), dim = x("38;5;244"), bold = x("1"),
      cyan = x("38;5;80"), red = x("38;5;203"), white = x("97"), track = x("38;5;238");
const GRAD = [29, 35, 41, 78, 84]; // green→mint, for the progress bar
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const vis = (s) => s.replace(/\x1b\[[0-9;]*m/g, "").length;

function box(lines) {
  const w = Math.max(...lines.map(vis));
  const top = dim("╭" + "─".repeat(w + 2) + "╮");
  const bot = dim("╰" + "─".repeat(w + 2) + "╯");
  const body = lines.map((l) => dim("│ ") + l + " ".repeat(w - vis(l)) + dim(" │"));
  return [top, ...body, bot].join("\n");
}

// smooth gradient progress bar
function progBar(pct, w = 26) {
  const fill = (pct / 100) * w;
  let s = "";
  for (let i = 0; i < w; i++) {
    const g = GRAD[Math.min(GRAD.length - 1, Math.floor((i / w) * GRAD.length))];
    if (i < Math.floor(fill)) s += x(`38;5;${g}`)("█");
    else if (i < fill) s += x(`38;5;${g}`)("▌");
    else s += track("░");
  }
  return s;
}
async function progress(pct, label) {
  if (color) process.stdout.write(`\r\x1b[K  ${cyan("installing")}  ${progBar(pct)}  ${String(pct).padStart(3)}%  ${dim(label)}`);
  else process.stdout.write(`  [${String(pct).padStart(3)}%] ${label}\n`);
}

// preview of the live sprite (illustrative sample state)
function previewSprite() {
  const ratio = 0.28, sat = 1 - ratio, pct = Math.round(ratio * 100);
  const hearts = red("♥".repeat(4)) + dim("♡");
  const meter = grn("█".repeat(Math.round(sat * 10))) + track("░".repeat(10 - Math.round(sat * 10)));
  return [
    grnB(" /\\_/\\"),
    grnB("( ^_^ )") + "   " + hearts + "  " + meter + " " + dim(pct + "%"),
    grnB(" > ω < ") + "   " + dim("full & happy"),
  ];
}

// ── args / paths ────────────────────────────────────────────────────
const args = process.argv.slice(2);
const uninstall = args.includes("--uninstall");
const arg = (f) => (args.indexOf(f) !== -1 ? args[args.indexOf(f) + 1] : null);
const wantMode = arg("--mode");
const wantLang = arg("--lang");

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(repoRoot, "src", "statusline.mjs").replace(/\\/g, "/");
const nodePath = process.execPath.replace(/\\/g, "/");
const settingsPath = path.join(os.homedir(), ".claude", "settings.json");
const configPath = path.join(repoRoot, "config.json");
const short = (p) => p.replace(os.homedir(), "~").replace(/\\/g, "/");

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

async function run() {
  console.log("");
  console.log("  " + bold(cyan("cc-statusline")) + dim("  ·  status line for Claude Code"));
  console.log("");

  const settings = loadJson(settingsPath, {});
  let bak = null;

  // ── uninstall ──
  if (uninstall) {
    if (fs.existsSync(settingsPath)) { bak = settingsPath + ".bak"; fs.copyFileSync(settingsPath, bak); }
    delete settings.statusLine;
    saveJson(settingsPath, settings);
    console.log(box([
      red(" /\\_/\\"),
      red("( ; _ ;)") + "   " + white("uninstalled — bye!"),
      red(" >   < "), "",
      `${dim("settings")}  ${short(settingsPath)}`,
      bak ? `${dim("backup  ")}  ${short(bak)}` : "",
    ].filter(Boolean)));
    console.log("");
    return;
  }

  // ── install (paced steps with a progress bar) ──
  const steps = [
    ["locating config…", () => {}],
    ["backing up settings…", () => { if (fs.existsSync(settingsPath)) { bak = settingsPath + ".bak"; fs.copyFileSync(settingsPath, bak); } }],
    ["writing status line…", () => {
      const cfg = loadJson(configPath, {});
      const ri = Number.isInteger(cfg.refreshInterval) && cfg.refreshInterval >= 1 ? cfg.refreshInterval : 2;
      settings.statusLine = { type: "command", command: `"${nodePath}" "${scriptPath}"`, padding: 0, refreshInterval: ri };
      saveJson(settingsPath, settings);
    }],
    ["applying preferences…", () => {
      if (wantMode || wantLang) {
        const cfg = loadJson(configPath, {});
        if (wantMode) cfg.mode = wantMode;
        if (wantLang) cfg.lang = wantLang;
        saveJson(configPath, cfg);
      }
    }],
    ["verifying…", () => {
      const v = loadJson(settingsPath, {});
      if (!v.statusLine) throw new Error("verification failed: statusLine missing after write");
    }],
  ];

  for (let i = 0; i < steps.length; i++) {
    steps[i][1]();
    await progress(Math.round(((i + 1) / steps.length) * 100), steps[i][0]);
    await sleep(150);
  }
  if (color) process.stdout.write("\r\x1b[K");
  console.log("");

  // live preview
  console.log("  " + dim("this is what you'll see:"));
  for (const l of previewSprite()) console.log("    " + l);
  console.log("");

  const cfgLine = [wantMode && `mode → ${wantMode}`, wantLang && `lang → ${wantLang}`].filter(Boolean).join("   ");
  console.log(box([
    `${grn("✓")} ${white(bold("cc-statusline is ready!"))}`,
    `${dim("settings")}  ${short(settingsPath)}`,
    `${dim("script  ")}  ${short(scriptPath)}`,
    bak ? `${dim("backup  ")}  ${short(bak)}` : "",
    cfgLine ? `${dim("config  ")}  ${cfgLine}` : "",
  ].filter(Boolean)));
  console.log("");
  console.log("  " + grn("→") + " " + bold("Restart Claude Code") + dim(" (close & reopen the terminal) to apply."));
  const removeCmd = process.platform === "win32"
    ? "irm https://raw.githubusercontent.com/denipesto/cc-statusline/main/uninstall.ps1 | iex"
    : "curl -fsSL https://raw.githubusercontent.com/denipesto/cc-statusline/main/uninstall.sh | sh";
  console.log("  " + dim("remove anytime:  ") + cyan(removeCmd));
  console.log("");
}

run().catch((e) => { console.error("  " + red("✗ " + e.message)); process.exit(1); });
