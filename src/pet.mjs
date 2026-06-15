// Persistent claudegochi state: XP / levels / evolution stages / streaks, and
// event detection (feeding via /compact, new commits, daily streak). One global
// pet lives across all projects in ~/.cc-statusline-pet.json.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

const STATE = path.join(os.homedir(), ".cc-statusline-pet.json");

const DEFAULT = {
  xp: 0, bornDay: null, lastDay: null, streak: 0, feeds: 0,
  commits: null, lastGitCheck: 0, lastCtx: null, session: null,
  flashType: null, flashUntil: 0,
};

function load() {
  try { return { ...DEFAULT, ...JSON.parse(fs.readFileSync(STATE, "utf8").replace(/^﻿/, "")) }; }
  catch { return { ...DEFAULT }; }
}
function save(st) { try { fs.writeFileSync(STATE, JSON.stringify(st)); } catch {} }

// gentle curve: Lv = floor(sqrt(xp/40)) -> Lv1@40, Lv2@160, Lv3@360, Lv4@640…
export const levelOf = (xp) => Math.floor(Math.sqrt(Math.max(0, xp) / 40));
export const xpForLevel = (l) => 40 * l * l;
export function stageOf(level) {
  if (level < 1) return "egg";
  if (level < 3) return "kitten";
  if (level < 7) return "cat";
  return "elder";
}

const today = () => new Date().toISOString().slice(0, 10);
const dayDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

function gitCommitCount(dir) {
  try {
    const out = execSync("git rev-list --count HEAD", { cwd: dir, stdio: ["ignore", "pipe", "ignore"], timeout: 800 });
    return parseInt(out.toString().trim(), 10) || 0;
  } catch { return null; }
}

// sig: { ctxTokens, sessionId, dir, reactGit }
export function tick(data, sig, opts = {}) {
  const persist = opts.persist !== false;
  const now = Date.now();
  const st = persist ? load() : { ...DEFAULT };
  const prevLevel = levelOf(st.xp);
  let gain = 0;
  const events = [];
  const t = today();

  // born / daily streak
  if (!st.bornDay) st.bornDay = t;
  if (st.lastDay !== t) {
    st.streak = st.lastDay && dayDiff(st.lastDay, t) === 1 ? st.streak + 1 : 1;
    st.lastDay = t;
    gain += 15; events.push("newday");
  }

  // new session: don't mistake the context reset for a feeding
  const newSession = sig.sessionId && sig.sessionId !== st.session;
  if (newSession) { st.session = sig.sessionId; st.lastCtx = sig.ctxTokens ?? null; }

  // feeding: a big context drop within the same session = /compact
  if (!newSession && st.lastCtx != null && sig.ctxTokens != null && sig.ctxTokens < st.lastCtx - 15000) {
    st.feeds++; gain += 6; events.push("fed");
  }
  if (sig.ctxTokens != null) st.lastCtx = sig.ctxTokens;

  // commits (throttled to ~10s so we don't spawn git on every tick)
  if (sig.reactGit && sig.dir && now - st.lastGitCheck > 10000) {
    st.lastGitCheck = now;
    const c = gitCommitCount(sig.dir);
    if (c != null) {
      if (st.commits != null && c > st.commits) { gain += 10 * (c - st.commits); events.push("commit"); }
      st.commits = c;
    }
  }

  st.xp += gain;
  const level = levelOf(st.xp);
  if (level > prevLevel) events.push("levelup");

  // short-lived reaction flash (highest-priority event wins)
  const flash = ["levelup", "commit", "fed", "newday"].find((e) => events.includes(e));
  if (flash) { st.flashType = flash; st.flashUntil = now + 6000; }
  const activeFlash = st.flashType && now < st.flashUntil ? st.flashType : null;

  if (persist) save(st);

  return {
    xp: st.xp, gain, level, stage: stageOf(level), streak: st.streak, feeds: st.feeds,
    xpInto: st.xp - xpForLevel(level),
    xpNeed: Math.max(1, xpForLevel(level + 1) - xpForLevel(level)),
    events, flash: activeFlash, ageDays: st.bornDay ? dayDiff(st.bornDay, t) : 0,
  };
}
