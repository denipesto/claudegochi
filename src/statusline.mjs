#!/usr/bin/env node
// cc-statusline entrypoint. Reads Claude Code's status JSON on stdin,
// renders the enabled widgets (config order), prints ONE line to stdout.
// Each widget is isolated: a throwing/slow widget never kills the line.

import { loadConfig } from "./config.mjs";
import { makeT } from "./i18n.mjs";
import { dim } from "./colors.mjs";
import context from "./widgets/context.mjs";
import tamagotchi from "./widgets/tamagotchi.mjs";
import quote from "./widgets/quote.mjs";

// widget name -> module. Add new widgets here as they land.
const REGISTRY = {
  context,
  tamagotchi,
  quote,
};

async function readStdin() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

async function main() {
  const data = await readStdin();
  const config = loadConfig();
  const t = makeT(config.lang || "en");
  const ctx = { config, t, cwd: data.workspace?.current_dir || process.cwd() };

  // mode toggle: "tamagotchi" renders the pet instead of the normal widget list.
  const widgetList = config.mode === "tamagotchi" ? ["tamagotchi"] : config.widgets;

  const parts = [];
  for (const name of widgetList) {
    const widget = REGISTRY[name];
    if (!widget) continue;
    try {
      const out = await widget.render(data, ctx);
      if (out) parts.push(out);
    } catch {
      // a single widget failing must not break the whole status line
    }
  }

  process.stdout.write(parts.join(dim(config.separator)));
}

main();
