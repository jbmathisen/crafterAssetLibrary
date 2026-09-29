#!/usr/bin/env node
// Bakes every source SVG (palette keys) into a plain, coloured SVG next to it in svg/. Zero dependencies (CC0).
//   node scripts/bake-flat.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const tokens = JSON.parse(fs.readFileSync(path.join(root, "tokens/felt-craft.json"), "utf8"));
const roleColors = { ...tokens.roles, paper: tokens.paper };
const darken = (hex, k) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - k)).toString(16).padStart(2, "0")).join("");

function bake(src, colors) {
  const col = (k) => colors[k] ?? "#8A7A6A";
  let out = src
    .replace(/<g id="(cast|anchors)">[\s\S]*?<\/g>\s*/g, "")
    .replace(/<g id="(fill|shade|line|face)">([\s\S]*?)<\/g>/g, (_, group, body) => {
      const paths = body.replace(/<path\b([^>]*)\/>/g, (m, attrs) => {
        const get = (n) => (attrs.match(new RegExp(`${n}="([^"]*)"`)) ?? [])[1];
        const d = get("d"), c = col(get("data-color") ?? "ink"), wv = Number(get("data-w") ?? 1);
        if (group === "line" || get("data-stroke") === "1") {
          const dash = get("data-stitch") === "running" ? ' stroke-dasharray="3 2.5"' : get("data-stitch") === "cross" ? ' stroke-dasharray="1.5 2"' : "";
          return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${(wv * (get("data-stitch") === "twine" ? 2 : 1.2)).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
        }
        const op = get("data-material") === "cellophane" ? ' fill-opacity="0.6"' : group === "shade" ? ' fill-opacity="0.5"' : "";
        return `<path d="${d}" fill="${c}" stroke="${darken(c, 0.12)}" stroke-width="0.6"${op}/>`;
      });
      return `<g id="${group}">${paths}</g>`;
    });
  return out.replace(/\s+data-[a-z-]+="[^"]*"/g, "");
}

function run(dir, colorsFor) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { n += run(p, colorsFor); continue; }
    if (!f.endsWith(".svg") || p.includes(`${path.sep}svg${path.sep}`)) continue;
    const outDir = path.basename(dir) === "source" ? path.join(path.dirname(dir), "svg") : path.join(dir, "svg");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, f), bake(fs.readFileSync(p, "utf8"), colorsFor(p)));
    n++;
  }
  return n;
}

let n = 0;
for (const role of fs.readdirSync(path.join(root, "characters"))) {
  const c = JSON.parse(fs.readFileSync(path.join(root, "characters", role, "character.json"), "utf8"));
  n += run(path.join(root, "characters", role, "source"), () => c.palette);
}
n += run(path.join(root, "items", "source"), () => roleColors);
n += run(path.join(root, "scenes"), () => roleColors);
console.log(`baked ${n} flat SVGs`);
