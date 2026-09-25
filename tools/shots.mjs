// Renders the OG image and QA screenshots with Playwright (chromium is preinstalled).
//   node tools/shots.mjs [outDir] [og-only]
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { join, extname } from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = require(join(execSync("npm root -g").toString().trim(), "playwright")); }
const { chromium } = pw;
const DIST = new URL("../site/dist/", import.meta.url).pathname;
const OUT = process.argv[2] || "shots";
mkdirSync(OUT, { recursive: true });
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const srv = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split("?")[0]));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
  if (!existsSync(p)) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" });
  res.end(readFileSync(p));
}).listen(4173);
const browser = await chromium.launch();
// Chromium here may not trust the egress proxy's CA; fetch Google Fonts through curl (which does) instead.
const fontCache = new Map();
const viaCurl = async (route) => {
  const u = route.request().url();
  if (!fontCache.has(u)) fontCache.set(u, execSync(`curl -sS -A "Mozilla/5.0 Chrome/120" "${u}"`, { maxBuffer: 20e6 }));
  await route.fulfill({ body: fontCache.get(u), contentType: u.includes("googleapis") ? "text/css" : "font/woff2", headers: { "access-control-allow-origin": "*" } });
};
const newPage = async (o) => { const pg = await browser.newPage(o); await pg.route(/fonts\.(googleapis|gstatic)\.com/, viaCurl); return pg; };
const shot = async (path, file, vp, opts = {}) => {
  const page = await newPage({ viewport: vp, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:4173" + path, { waitUntil: "networkidle" }).catch(() => {});
  if (opts.before) await opts.before(page);
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(opts.wait || 600);
  await page.screenshot({ path: join(OUT, file), fullPage: !!opts.full });
  if (errors.length) console.log(path, "JS errors:", errors);
  await page.close();
};
// OG image 1200×630
const og = await newPage({ viewport: { width: 1200, height: 630 } });
await og.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Fraunces:ital,opsz,wght,SOFT@1,9..144,800,80&family=Inter:wght@600&display=swap" rel="stylesheet"></head><body style="margin:0;width:1200px;height:630px;background:#F6EEDF;display:flex;align-items:center;justify-content:space-between;padding:0 90px;box-sizing:border-box;font-family:Inter">
<div><div style="font:italic 800 150px Fraunces;color:#B8472A;line-height:1">Miam's</div><div style="letter-spacing:.3em;font-weight:600;color:#26301F;font-size:26px;margin:14px 0 30px">RESTO CAFÉ · MONTRÉAL</div><div style="font:600 64px Caveat;color:#26301F">Ici, on dit miam.</div></div>
<div style="width:330px;height:330px;border-radius:50%;background:radial-gradient(circle at 40% 38%,#f2b85a 0,#E9A23B 34%,#B8472A 72%);box-shadow:0 0 0 22px rgba(233,162,59,.18)"></div></body></html>`, { waitUntil: "networkidle" }).catch(() => {});
await og.evaluate(() => document.fonts.ready); await og.waitForTimeout(800);
await og.screenshot({ path: join(OUT, "og.png") });
if (process.argv[3] !== "og-only") {
  await shot("/fr/", "home-fr-desktop.png", { width: 1366, height: 900 }, { full: true });
  await shot("/en/", "home-en-mobile.png", { width: 390, height: 844 }, { full: true });
  await shot("/fr/menu/", "menu-fr-mobile.png", { width: 390, height: 844 });
  await shot("/en/menu/", "menu-en-filter-vegan.png", { width: 390, height: 844 }, { before: (p) => p.click('[data-diet="vegan"]') });
  await shot("/fr/menu/", "menu-fr-desktop.png", { width: 1366, height: 900 }, { full: true });
  await shot("/fr/traiteur/", "catering-fr.png", { width: 1366, height: 900 }, { full: true });
  for (const dp of ["matin", "midi", "aprem", "soir"]) await shot(`/screens/board.html?screen=main&daypart=${dp}`, `board-${dp}.png`, { width: 1920, height: 1080 }, { wait: 1500 });
  await shot("/screens/board.html?screen=promo&daypart=soir", "board-promo.png", { width: 1920, height: 1080 }, { wait: 1500 });
}
await browser.close();
srv.close();
