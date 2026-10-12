// Generate branded SVG tiles for games without a downloaded thumbnail,
// then patch casinoGames.ts so those games use ext: "svg".
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const THUMB_DIR = path.join(ROOT, "public", "assets", "games", "thumbs");
const CATALOG = path.join(ROOT, "src", "pages", "casinoGames.ts");

const PALETTES = [
  ["#3b0764", "#0ea5e9"], ["#7c2d12", "#f59e0b"], ["#064e3b", "#34d399"],
  ["#701a75", "#e879f9"], ["#7f1d1d", "#f97316"], ["#1e3a8a", "#38bdf8"],
  ["#422006", "#eab308"], ["#0c4a6e", "#22d3ee"], ["#4a044e", "#fb7185"],
  ["#14532d", "#a3e635"], ["#111827", "#6366f1"], ["#831843", "#f472b6"],
];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31 + s.charCodeAt(i)) >>> 0);
  return h;
}
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function shortName(name) {
  // wrap into up to 2 lines
  const words = name.split(" ");
  if (name.length <= 16) return [name];
  let l1 = "", l2 = "";
  for (const w of words) {
    if ((l1 + " " + w).trim().length <= 16 && !l2) l1 = (l1 + " " + w).trim();
    else l2 = (l2 + " " + w).trim();
  }
  if (l2.length > 18) l2 = l2.slice(0, 17) + "…";
  return l2 ? [l1, l2] : [l1];
}

function tile(game) {
  const [c1, c2] = PALETTES[hash(game.id) % PALETTES.length];
  const lines = shortName(game.name);
  const cy = lines.length > 1 ? 228 : 238;
  const texts = lines.map((l, i) =>
    `<text x="200" y="${cy + i * 30}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="27" font-weight="900" fill="#ffffff" stroke="rgba(0,0,0,.45)" stroke-width="4" paint-order="stroke">${esc(l.toUpperCase())}</text>`
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>` +
    `<radialGradient id="r" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="#ffffff" stop-opacity=".28"/><stop offset=".55" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="400" height="300" fill="url(#g)"/><rect width="400" height="300" fill="url(#r)"/>` +
    `<circle cx="52" cy="46" r="64" fill="#ffffff" opacity=".08"/><circle cx="360" cy="262" r="84" fill="#000000" opacity=".12"/>` +
    `<circle cx="200" cy="118" r="62" fill="#000000" opacity=".28"/><circle cx="200" cy="118" r="56" fill="#ffffff" opacity=".14"/>` +
    `<text x="200" y="142" text-anchor="middle" font-size="64">${esc(game.icon)}</text>` +
    texts +
    `<text x="200" y="278" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="13" font-weight="700" letter-spacing="2" fill="#ffffff" opacity=".75">${esc(game.provider.toUpperCase())}</text>` +
    `</svg>`;
}

function parseCatalog() {
  const src = fs.readFileSync(CATALOG, "utf8");
  const re = /G\("([^"]+)",\s*"((?:[^"\\]|\\.)*)",\s*"([^"]+)",\s*"((?:[^"\\]|\\.)*)",\s*"((?:[^"\\]|\\.)*)"/g;
  const games = [];
  let m;
  while ((m = re.exec(src))) games.push({ id: m[1], name: m[2], provider: m[4], icon: m[5] });
  return games;
}

const missing = JSON.parse(fs.readFileSync(path.join(__dirname, "still-missing.json"), "utf8"));
const byId = new Map(parseCatalog().map((g) => [g.id, g]));
let made = 0;
for (const id of missing) {
  const dest = path.join(THUMB_DIR, `${id}.jpg`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 4000) continue;
  const game = byId.get(id);
  if (!game) { console.log(`unknown id ${id}`); continue; }
  fs.writeFileSync(path.join(THUMB_DIR, `${id}.svg`), tile(game));
  made++;
}
console.log(`svg tiles written: ${made}`);

// patch catalog ext for svg games
let src = fs.readFileSync(CATALOG, "utf8");
const lines = src.split("\n");
let patched = 0;
for (let i = 0; i < lines.length; i++) {
  const lm = lines[i].match(/^  G\("([^"]+)",/);
  if (!lm) continue;
  const id = lm[1];
  if (!fs.existsSync(path.join(THUMB_DIR, `${id}.svg`))) continue;
  if (/ext:\s*"svg"/.test(lines[i])) continue;
  if (/\{\s*[^}]*\}\s*\),$/.test(lines[i])) {
    lines[i] = lines[i].replace(/(\{\s*[^}]*?)(\s*\}\s*\),)$/, "$1, ext: \"svg\"$2");
    patched++;
  } else if (/\),$/.test(lines[i])) {
    lines[i] = lines[i].replace(/,\s*([\d.]+\s*)\),$/, ", $1, { ext: \"svg\" }),");
    patched++;
  }
}
fs.writeFileSync(CATALOG, lines.join("\n"));
console.log(`catalog patched: ${patched}`);
