// Shared context-token logic: used by the `context` and `tamagotchi` widgets.

import fs from "node:fs";

// Default window 200k; 1M for [1m]-suffixed models. config.contextWindow overrides.
export function detectWindow(data, config) {
  if (config?.contextWindow) return config.contextWindow;
  const id = `${data.model?.id || ""} ${data.model?.display_name || ""}`;
  if (/\[?1m\]?|1[\s,]?000[\s,]?000/i.test(id)) return 1_000_000;
  return 200_000;
}

// Walk the transcript from the END, return the first MAIN-chain usage we hit.
// Skips sub-agent entries (isSidechain) — they have their own context.
export function currentContextTokens(transcriptPath) {
  let raw;
  try {
    raw = fs.readFileSync(transcriptPath, "utf8");
  } catch {
    return null;
  }
  const lines = raw.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    if (obj.isSidechain) continue;
    const u = obj.message?.usage;
    if (!u) continue;
    const used =
      (u.input_tokens || 0) +
      (u.cache_creation_input_tokens || 0) +
      (u.cache_read_input_tokens || 0) +
      (u.output_tokens || 0);
    if (used > 0) return used;
  }
  return null;
}

// Convenience: returns { used, window, ratio, left } or null.
export function contextState(data, config) {
  const path = data.transcript_path;
  if (!path) return null;
  const used = currentContextTokens(path);
  if (used == null) return null;
  const window = detectWindow(data, config);
  const ratio = Math.min(used / window, 1);
  return { used, window, ratio, left: Math.max(window - used, 0) };
}
