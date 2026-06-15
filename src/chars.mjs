// Pet characters. Each is a 3-line sprite renderer (eyes, mouth) => [l0, l1, l2].
// Eyes are 3 chars (e.g. "^_^"), mouth is 1 char (e.g. "w"). Pick with petChar.
// The egg (Lv.0) is universal — see EGG below.

export const EGG = (e) => [" .---.", `( ${e} )`, " `---'"];

export const CHARS = {
  cat:     (e, m) => [" /\\_/\\",   `( ${e} )`,   ` > ${m} <`],
  dog:     (e, m) => [" /\\__/\\",  `( ${e} )`,   ` (_${m}_)`],
  bunny:   (e, m) => ["  (\\_/)",   ` ( ${e} )`,  ` (\")_(\")`],
  bear:    (e, m) => [" (o)_(o)",   `( ${e} )`,   `  \\${m}/`],
  fox:     (e, m) => [" |\\__/|",   `( ${e} )`,   ` \\>${m}</`],
  frog:    (e, m) => ["  _____",    `(o ${e} o)`, `  \\_${m}_/`],
  robot:   (e, m) => [" ,[___],",   `{ ${e} }`,   ` |o-${m}-o|`],
  dragon:  (e, m) => [" /=\\_/=\\", `( ${e} )`,   ` ~>${m}<~`],
  panda:   (e, m) => [" (q)_(p)",   `( ${e} )`,   `  \\${m}/`],
  penguin: (e, m) => ["   __",      `<( ${e} )>`, `  /^${m}^\\`],
};

export const CHAR_NAMES = Object.keys(CHARS);
