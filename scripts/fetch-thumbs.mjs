// Bulk thumbnail fetcher: Bing image results -> download -> normalize to .jpg via PIL.
// Usage: node scripts/fetch-thumbs.mjs [--limit N]
// Skips games that already have public/assets/games/thumbs/<id>.jpg
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const THUMB_DIR = path.join(ROOT, "public", "assets", "games", "thumbs");
const CATALOG = path.join(ROOT, "src", "pages", "casinoGames.ts");

const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
];
const pickUA = () => UAS[Math.floor(Math.random() * UAS.length)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseCatalog() {
  const src = fs.readFileSync(CATALOG, "utf8");
  const re = /G\("([^"]+)",\s*"((?:[^"\\]|\\.)*)",\s*"([^"]+)",\s*"((?:[^"\\]|\\.)*)"/g;
  const games = [];
  let m;
  while ((m = re.exec(src))) {
    games.push({ id: m[1], name: m[2], cat: m[3], provider: m[4] });
  }
  return games;
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": pickUA(), "Accept-Language": "en-US,en;q=0.9" },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(t);
  }
}

async function fetchBuffer(url, referer) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": pickUA(), Referer: referer || "https://www.bing.com/", Accept: "image/*" },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 1200000) throw new Error("too large");
    return { buf, ct };
  } finally {
    clearTimeout(t);
  }
}

function kindOf(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

function toJpg(srcPath, destPath) {
  execFileSync(
    "python3",
    [
      "-c",
      "import sys; from PIL import Image; im = Image.open(sys.argv[1]).convert('RGB'); im.thumbnail((800, 600)); im.save(sys.argv[2], 'JPEG', quality=82)",
      srcPath,
      destPath,
    ],
    { stdio: "pipe" }
  );
}

async function searchCandidates(game) {
  const q = encodeURIComponent(`${game.name} ${game.provider} ${game.cat === "Slots" ? "slot" : game.cat} game`);
  const html = await fetchText(`https://www.bing.com/images/search?q=${q}&form=HDRSC2`);
  const urls = [];
  const re = /murl&quot;:&quot;(https?:\/\/[^&]+?)&quot;/g;
  let m;
  while ((m = re.exec(html)) && urls.length < 8) {
    try {
      const u = decodeURIComponent(m[1]);
      if (/\.(svg|gif)(\?|$)/i.test(u)) continue;
      if (urls.includes(u)) continue;
      urls.push(u);
    } catch { /* bad encoding */ }
  }
  return urls;
}

async function fetchOne(game) {
  const dest = path.join(THUMB_DIR, `${game.id}.jpg`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 4000) return "skip";
  let candidates;
  try {
    candidates = await searchCandidates(game);
  } catch (e) {
    return `search-fail:${e.message}`;
  }
  if (!candidates.length) return "no-results";
  for (const url of candidates.slice(0, 5)) {
    try {
      const { buf } = await fetchBuffer(url);
      if (buf.length < 8000) continue;
      const kind = kindOf(buf);
      if (!kind) continue;
      const tmp = path.join("/tmp", `thumb-${game.id}.${kind}`);
      fs.writeFileSync(tmp, buf);
      try {
        if (kind === "jpg") {
          // re-encode anyway to cap size/dimensions
          toJpg(tmp, dest);
        } else {
          toJpg(tmp, dest);
        }
        fs.unlinkSync(tmp);
        if (fs.statSync(dest).size < 4000) {
          fs.unlinkSync(dest);
          continue;
        }
        return "ok";
      } catch {
        try { fs.unlinkSync(tmp); } catch {}
        continue;
      }
    } catch {
      continue;
    }
    await sleep(250);
  }
  return "download-fail";
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
  const games = parseCatalog();
  const missing = games.filter((g) => {
    const p = path.join(THUMB_DIR, `${g.id}.jpg`);
    return !(fs.existsSync(p) && fs.statSync(p).size > 4000);
  });
  console.log(`catalog=${games.length} missing=${missing.length} limit=${limit === Infinity ? "none" : limit}`);
  const queue = missing.slice(0, limit);
  const stats = {};
  const WORKERS = 4;
  let idx = 0;
  async function worker(n) {
    while (idx < queue.length) {
      const game = queue[idx++];
      const res = await fetchOne(game);
      stats[res] = (stats[res] || 0) + 1;
      const done = Object.values(stats).reduce((a, b) => a + b, 0);
      if (done % 25 === 0 || res.startsWith("search-fail")) {
        console.log(`[${done}/${queue.length}] w${n} ${game.id} -> ${res} ${JSON.stringify(stats)}`);
      }
      await sleep(700 + Math.random() * 600);
    }
  }
  await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i)));
  console.log("DONE", JSON.stringify(stats));
  const stillMissing = games.filter((g) => {
    const p = path.join(THUMB_DIR, `${g.id}.jpg`);
    return !(fs.existsSync(p) && fs.statSync(p).size > 4000);
  });
  fs.writeFileSync(path.join(__dirname, "still-missing.json"), JSON.stringify(stillMissing.map((g) => g.id)));
  console.log(`still missing: ${stillMissing.length}`);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
