#!/usr/bin/env node
// UserPromptSubmit hook: intercepts prompts that start with "ccg" and runs the
// cc-statusline config editor LOCALLY — no model turn, no tokens. Exit code 2
// blocks the prompt from reaching Claude and shows our output to the user.
//
// Type "ccg" alone to see settings, or "ccg theme cool" to change one.
// Any other prompt passes straight through (exit 0).

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), "cc-config.mjs");

let raw = "";
try { for await (const chunk of process.stdin) raw += chunk; } catch {}
let prompt = "";
try { prompt = (JSON.parse(raw || "{}").prompt || "").toString(); } catch { process.exit(0); }

const m = prompt.match(/^\s*ccg\b[ \t]*([\s\S]*)$/i);
if (!m) process.exit(0); // not our command — let the prompt reach Claude

const argv = m[1].trim() ? m[1].trim().split(/\s+/) : [];
const r = spawnSync(process.execPath, [cli, ...argv], { encoding: "utf8" });
// stderr is the channel shown to the user when a UserPromptSubmit hook exits 2
process.stderr.write("\n" + (r.stdout || "") + (r.stderr || "") + "\n");
process.exit(2);
