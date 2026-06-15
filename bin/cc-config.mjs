#!/usr/bin/env node
// cc-statusline config editor.
//   node bin/cc-config.mjs                 -> interactive TUI (arrow keys + Enter)
//                                             in a real terminal; no LLM, no tokens
//   node bin/cc-config.mjs show            -> print current settings
//   node bin/cc-config.mjs <key> <value>   -> set one value (with validation)
//   node bin/cc-config.mjs theme cool      -> friendly aliases
//
// Config is re-read on every status-line render, so changes apply live
// (only refreshInterval needs a Claude Code restart).

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, "config.json");

const ALIAS = { theme: "petTheme", style: "petStyle", name: "petName", project: "petNameProject", animate: "petAnimate", git: "petReactGit" };

const ENUM = (...vals) => (v) => (vals.includes(v) ? { value: v } : { error: `expected one of: ${vals.join(", ")}` });
const BOOL = (v) => (["true", "false", "on", "off", "1", "0"].includes(String(v).toLowerCase())
  ? { value: ["true", "on", "1"].includes(String(v).toLowerCase()) } : { error: "expected true/false" });
const STR = (v) => ({ value: String(v) });
const NUMORNULL = (v) => (v === "null" || v === "auto" ? { value: null } : Number.isFinite(+v) ? { value: +v } : { error: "expected a number or 'auto'" });
const INT1 = (v) => (Number.isInteger(+v) && +v >= 1 ? { value: +v } : { error: "expected an integer ≥ 1" });

function detectLocales() {
  try { return fs.readdirSync(path.join(root, "locales")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")); }
  catch { return []; }
}
const LANGS = detectLocales();

const KEYS = {
  mode: ENUM("normal", "tamagotchi"),
  petTheme: ENUM("warm", "cool", "mono"),
  petStyle: ENUM("sprite", "compact"),
  petName: STR,
  petNameProject: BOOL,
  lang: LANGS.length ? ENUM(...LANGS) : STR,
  petReactGit: BOOL,
  petAnimate: BOOL,
  contextWindow: NUMORNULL,
  refreshInterval: INT1,
};
// fixed options for the TUI (null = free text input via the key's validator)
const OPTS = {
  mode: ["normal", "tamagotchi"],
  petTheme: ["warm", "cool", "mono"],
  petStyle: ["sprite", "compact"],
  petNameProject: [true, false],
  lang: LANGS.length ? LANGS : null,
  petReactGit: [true, false],
  petAnimate: [true, false],
  petName: null,
  contextWindow: null,
  refreshInterval: null,
};
const ORDER = ["mode", "petTheme", "petStyle", "petName", "petNameProject", "lang", "petReactGit", "petAnimate", "contextWindow", "refreshInterval"];

function load() {
  try { return JSON.parse(fs.readFileSync(configPath, "utf8").replace(/^﻿/, "")); }
  catch (e) { if (e.code === "ENOENT") return {}; throw new Error(`config.json is invalid JSON: ${e.message}`); }
}
function save(cfg) { fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2) + "\n"); }

// ── colors ──────────────────────────────────────────────────────────
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const x = (c) => (s) => (useColor ? `\x1b[${c}m${s}\x1b[0m` : s);
const grn = x("38;5;114"), dim = x("2"), bold = x("1"), cyan = x("38;5;80"), inv = x("7");

// ── non-interactive: show / set ─────────────────────────────────────
function show(cfg) {
  console.log(bold("cc-statusline settings") + dim("  (" + configPath.replace(/\\/g, "/") + ")"));
  for (const k of ORDER) console.log("  " + k.padEnd(16) + grn(JSON.stringify(cfg[k] ?? null)));
  console.log(dim("\nset:  node cc-config.mjs <key> <value>   ·   keys: " + ORDER.join(", ")));
  console.log(dim("aliases: theme, style, name, project, git, animate"));
}
function applyArgs(args) {
  const [rawKey, ...rest] = args;
  const cfg = load();
  if (rawKey === "show" || rawKey === "list") return show(cfg);
  const key = ALIAS[rawKey] || rawKey;
  if (!(key in KEYS)) { console.error(`✗ unknown setting "${rawKey}".`); show(cfg); process.exit(1); }
  if (!rest.length) { console.error(`✗ no value. usage: node cc-config.mjs ${rawKey} <value>`); process.exit(1); }
  const res = KEYS[key](rest.join(" "));
  if (res.error) { console.error(`✗ ${rawKey}: ${res.error}`); process.exit(1); }
  const old = cfg[key]; cfg[key] = res.value; save(cfg);
  console.log(grn("✓") + ` ${key}: ${dim(JSON.stringify(old ?? null))} → ${bold(JSON.stringify(res.value))}`);
  console.log(dim(key === "refreshInterval" ? "  (restart Claude Code for this to take effect)" : "  applies on the next status-line render"));
}

// ── interactive TUI ─────────────────────────────────────────────────
const W = (s) => process.stdout.write(s);
const clear = () => W("\x1b[2J\x1b[H");
function nextKey() {
  return new Promise((res) => {
    const h = (str, key) => { process.stdin.removeListener("keypress", h); res(key || { name: str }); };
    process.stdin.on("keypress", h);
  });
}
function drawMain(cfg, idx, note) {
  clear();
  W(bold(cyan(" claudegochi")) + dim("  ·  cc-statusline settings") + "\n\n");
  ORDER.forEach((k, i) => {
    const val = grn(JSON.stringify(cfg[k] ?? null));
    const row = " " + k.padEnd(16) + val + " ";
    W(i === idx ? cyan("❯") + inv(row) + "\n" : "  " + row + "\n");
  });
  W("\n" + dim(" ↑/↓ move · Enter edit · q quit") + (note ? "   " + grn(note) : "") + "\n");
}
function drawSub(key, opts, sidx, cur) {
  clear();
  W(bold(cyan(" " + key)) + dim("  ·  current: ") + grn(JSON.stringify(cur ?? null)) + "\n\n");
  opts.forEach((o, i) => {
    const label = " " + JSON.stringify(o) + (o === cur ? dim("  (current)") : "") + " ";
    W(i === sidx ? cyan("❯") + inv(" " + JSON.stringify(o) + " ") + (o === cur ? dim(" current") : "") + "\n" : "   " + label + "\n");
  });
  W("\n" + dim(" ↑/↓ move · Enter set · Esc back") + "\n");
}
async function editEnum(cfg, key) {
  const opts = OPTS[key];
  let sidx = Math.max(0, opts.findIndex((o) => o === cfg[key]));
  for (;;) {
    drawSub(key, opts, sidx, cfg[key]);
    const k = await nextKey();
    if (k.name === "up") sidx = (sidx - 1 + opts.length) % opts.length;
    else if (k.name === "down") sidx = (sidx + 1) % opts.length;
    else if (k.name === "escape" || k.name === "q" || (k.ctrl && k.name === "c")) return null;
    else if (k.name === "return") { cfg[key] = opts[sidx]; save(cfg); return `${key} → ${JSON.stringify(opts[sidx])}`; }
  }
}
async function editText(cfg, key) {
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  W("\x1b[?25h"); clear();
  W(bold(" " + key) + dim("   current: ") + grn(JSON.stringify(cfg[key] ?? null)) + "\n");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = await new Promise((r) => rl.question(dim(" new value (blank = keep): "), r));
  rl.close();
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  W("\x1b[?25l");
  if (ans.trim() === "") return null;
  const res = KEYS[key](ans.trim());
  if (res.error) return `✗ ${res.error}`;
  cfg[key] = res.value; save(cfg);
  return `${key} → ${JSON.stringify(res.value)}`;
}
async function tui() {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  W("\x1b[?25l");
  const cleanup = () => { if (process.stdin.isTTY) process.stdin.setRawMode(false); W("\x1b[?25h\n"); };
  let idx = 0, note = "";
  for (;;) {
    const cfg = load();
    drawMain(cfg, idx, note); note = "";
    const k = await nextKey();
    if (k.name === "up") idx = (idx - 1 + ORDER.length) % ORDER.length;
    else if (k.name === "down") idx = (idx + 1) % ORDER.length;
    else if (k.name === "q" || k.name === "escape" || (k.ctrl && k.name === "c")) break;
    else if (k.name === "return") {
      const key = ORDER[idx];
      const r = OPTS[key] ? await editEnum(cfg, key) : await editText(cfg, key);
      if (r) note = "✓ " + r;
    }
  }
  cleanup();
  process.exit(0);
}

// ── entry ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length) applyArgs(args);
else if (process.stdin.isTTY && process.stdout.isTTY) tui();
else show(load());
