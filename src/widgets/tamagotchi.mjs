// 🐱 claudegochi — a persistent, evolving tamagotchi for the status line.
// Needs: hunger (context), energy (session length). Grows in levels/stages,
// reacts to feeding (/compact), commits and daily streaks, and animates at ~1fps
// (blink, sleepy z). Compact: 3 lines (sprite + name/level + needs + status/xp).
//
// config.json: { "mode":"tamagotchi", "petName":"claudegochi", "petStyle":"sprite",
//                "petNameProject":false, "petReactGit":true }

import { red, gray, bold, dim, brightGreen, brightYellow, brightRed, cyan, meter } from "../colors.mjs";
import { contextState } from "../tokens.mjs";
import { tick, xpForLevel } from "../pet.mjs";

const colorFor = (r) => (r >= 0.85 ? brightRed : r >= 0.6 ? brightYellow : brightGreen);

function petName(data, config) {
  if (config?.petNameProject) {
    const p = data.workspace?.project_dir || data.workspace?.current_dir || "";
    const parts = p.replace(/[\\/]+$/, "").split(/[\\/]/);
    if (parts[parts.length - 1]) return parts[parts.length - 1];
  }
  return config?.petName || "claudegochi";
}

// 3-line sprite per evolution stage; eyes (3 chars) + mouth (1) come from mood.
function sprite(stage, eyes, mouth) {
  switch (stage) {
    case "egg":    return [" .-=-.", `( ${eyes} )`, " `-_-'"];
    case "kitten": return [" /\\,/\\", `(=${eyes}=)`, ` > ${mouth} <`];
    case "elder":  return [" /\\_/\\", `[ ${eyes} ]`, ` > ${mouth} <`];
    default:       return [" /\\_/\\", `( ${eyes} )`, ` > ${mouth} <`]; // cat
  }
}

// pick mood: flash reactions > hunger > tiredness/night > happiness
function mood(ratio, energy, hour, flash) {
  if (flash === "levelup") return { eyes: "★_★", mouth: "▽", key: "levelup", paint: brightGreen };
  if (flash === "commit")  return { eyes: "^_^", mouth: "▽", key: "commit", paint: brightGreen };
  if (flash === "fed")     return { eyes: "^_^", mouth: "u", key: "fed", paint: brightGreen };
  if (flash === "newday")  return { eyes: "^_^", mouth: "w", key: "newday", paint: brightGreen };

  const night = hour >= 23 || hour < 6;
  if (ratio >= 0.9)  return { eyes: "x_x", mouth: "!", key: "starving", paint: brightRed };
  if (ratio >= 0.78) return { eyes: ";_;", mouth: "~", key: "hungry", paint: brightYellow };
  if (energy < 0.22) return { eyes: "-_-", mouth: "z", key: "tired", paint: gray };
  if (night && ratio < 0.7) return { eyes: "-_-", mouth: "z", key: "sleepy", paint: gray };
  if (ratio >= 0.6)  return { eyes: "o_o", mouth: "~", key: "peckish", paint: brightYellow };
  if (ratio < 0.25 && energy > 0.5) return { eyes: "^‿^", mouth: "w", key: "ecstatic", paint: brightGreen };
  if (ratio < 0.45)  return { eyes: "^_^", mouth: "w", key: "content", paint: brightGreen };
  return { eyes: "o_o", mouth: "u", key: "ok", paint: brightGreen };
}

function hearts(sat) {
  const n = Math.max(0, Math.min(5, Math.round(sat * 5)));
  return red("♥".repeat(n)) + gray("♡".repeat(5 - n));
}

export default {
  name: "tamagotchi",
  render(data, ctx) {
    const s = contextState(data, ctx.config);
    if (!s) return null;

    const t = ctx.t || ((k) => k.split(".").pop());
    const tr = (k, vars) => {
      let str = t(`tamagotchi.${k}`);
      if (vars) for (const [a, b] of Object.entries(vars)) str = str.replace(`{${a}}`, b);
      return str;
    };

    const cfg = ctx.config || {};
    const now = ctx.now ?? Date.now();
    const frame = Math.floor(now / 1000);

    // pet state + events (ctx.petState lets tests inject a fixed state)
    const pet = ctx.petState || tick(data, {
      ctxTokens: s.used,
      sessionId: data.session_id,
      dir: data.workspace?.current_dir || ctx.cwd,
      reactGit: cfg.petReactGit !== false,
    }, { persist: !ctx.preview });

    // needs
    const ratio = s.ratio;
    const sat = 1 - ratio;
    const durMs = data.cost?.total_duration_ms || 0;
    const energy = Math.max(0, Math.min(1, 1 - durMs / (3 * 3600 * 1000)));
    const hour = (ctx.now != null ? new Date(ctx.now) : new Date()).getHours();

    const m = mood(ratio, energy, hour, pet.flash);
    const paint = m.paint;

    // animation (~1fps): blink, and a sleepy z cycle
    const animate = cfg.petAnimate !== false;
    let eyes = m.eyes;
    if (animate && frame % 5 === 0 && !["x_x", "★_★"].includes(eyes)) eyes = "-_-";
    const drowsy = m.key === "tired" || m.key === "sleepy";

    // status phrase (+ flash xp/level, + cycling z when drowsy)
    let say;
    if (m.key === "fed" || m.key === "commit") say = tr(m.key, { xp: pet.gain });
    else if (m.key === "levelup") say = tr("levelup", { lvl: pet.level });
    else say = tr(m.key);
    if (animate && drowsy) say += " " + ["z", "Z", "ᶻ"][frame % 3];

    // compact one-liner
    if (cfg.petStyle === "compact") {
      const name = petName(data, cfg);
      return [
        paint(`( ${eyes} )`), bold(name), dim(`Lv.${pet.level}`),
        hearts(sat), dim("·"), dim(say),
      ].join(" ");
    }

    // 3-line sprite
    const [l0, l1, l2] = sprite(pet.stage, eyes, m.mouth);
    const w = Math.max(l0.length, l1.length, l2.length);
    const cat = [l0, l1, l2].map((l) => paint(l.padEnd(w)));

    const name = petName(data, cfg);
    const stageWord = tr(`stage.${pet.stage}`);
    const energyBar = brightYellow(meter(energy, 4));
    const streak = pet.streak > 1 ? "  " + brightRed(`♦${pet.streak}d`) : "";
    const xpBar = cyan(meter(pet.xpInto / pet.xpNeed, 6));

    return [
      `${cat[0]}   ${bold(name)}  ${dim(`Lv.${pet.level} ${stageWord}`)}`,
      `${cat[1]}   ${hearts(sat)}  ${dim("⚡")}${energyBar}${streak}`,
      `${cat[2]}   ${dim(say)}   ${dim("xp")} ${xpBar}`,
    ].join("\n");
  },
};
