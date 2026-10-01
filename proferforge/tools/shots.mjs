// QA screenshots + OG image for the Pro Fer Forgé site (Playwright; chromium is preinstalled).
//   node proferforge/tools/shots.mjs [outDir] [og]
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(import.meta.url);
let pw; try { pw = require("playwright"); } catch { pw = require(join(execSync("npm root -g").toString().trim(), "playwright")); }
const DIST = new URL("../dist/", import.meta.url).pathname;
const OUT = process.argv[2] || "proferforge/shots";
mkdirSync(OUT, { recursive: true });
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/json", ".xml": "application/xml", ".txt": "text/plain" };
const srv = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split("?")[0]));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
  if (!existsSync(p)) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); res.end(readFileSync(p));
}).listen(4174);
const browser = await pw.chromium.launch();
if (process.argv[3] === "og") {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto("http://localhost:4174/");
  await page.setContent(`<style>@font-face{font-family:B;font-weight:700;src:url(http://localhost:4174/assets/fonts/barlow-700.woff2)}@font-face{font-family:I;src:url(http://localhost:4174/assets/fonts/inter-latin.woff2)}body{margin:0;width:1200px;height:630px;background:radial-gradient(90% 120% at 85% 10%,#2a3270,#0E1226 60%,#0B0E20);color:#fff;font-family:I;position:relative;overflow:hidden}
.a{position:absolute;right:-160px;top:-40px;width:820px;opacity:.5}h1{font:700 84px/0.98 B;text-transform:uppercase;margin:0;max-width:760px}.w{position:absolute;left:80px;top:78px}.l{font:600 22px I;letter-spacing:.2em;color:#F09A55;text-transform:uppercase;margin-bottom:26px}.s{font-size:27px;color:#E7E9F4;margin-top:24px;max-width:820px}.b{position:absolute;left:80px;bottom:60px;font:600 26px I;display:flex;gap:40px}.b span:first-child{background:#E0873F;color:#0B0E20;padding:14px 28px;border-radius:99px}</style>
<svg class="a" viewBox="0 0 600 600" fill="none" stroke="#4A4F7A" stroke-width="2.2">${Array.from({length:18},(_, i)=>`<g transform="rotate(${i*20} 300 300)"><path d="M306 296h210c8 0 8 8 0 8H306z" opacity="${(0.25+i*0.04).toFixed(2)}"/></g>`).join("")}<circle cx="300" cy="300" r="212"/><circle cx="300" cy="300" r="14" stroke-width="3"/></svg>
<div class="w"><div class="l">Pro Fer Forgé · Montréal</div><h1>Peinture et restauration de fer forgé</h1><div class="s">Escaliers, balcons et garde-corps pour copropriétés et immeubles.</div></div><div class="b"><span>Soumission gratuite</span><span style="padding:14px 0">(438) 815-7232</span></div>`);
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
  mkdirSync(new URL("../src/assets/", import.meta.url).pathname, { recursive: true });
  await page.screenshot({ path: new URL("../src/assets/og.jpg", import.meta.url).pathname, type: "jpeg", quality: 84 });
  console.log("og.jpg written"); await browser.close(); srv.close(); process.exit(0);
}
const shot = async (path, file, vp, opts = {}) => {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  if (!opts.cookie) await page.addInitScript(() => localStorage.setItem("pf-consent", "no"));
  const errors = []; page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("http://localhost:4174" + path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  if (opts.full) { // scroll through so reveal/pinned effects settle, then force-reveal for a full-page capture
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); document.querySelectorAll(".rv").forEach((e) => e.classList.add("in")); });
  }
  if (opts.before) await opts.before(page);
  await page.waitForTimeout(opts.wait || 700);
  await page.screenshot({ path: join(OUT, file), fullPage: !!opts.full });
  if (errors.length) console.log(path, "ERRORS:", errors);
  await page.close();
};
const D = { width: 1440, height: 900 }, M = { width: 390, height: 844 };
await shot("/", "home-desktop-fold.png", D);
await shot("/", "home-cookie-mobile.png", M, { cookie: true });
await shot("/", "home-desktop-full.png", D, { full: true });
await shot("/", "home-mobile-fold.png", M);
await shot("/", "home-mobile-full.png", M, { full: true });
await shot("/", "home-process-desktop.png", D, { before: async (p) => { const y = await p.evaluate(() => { const r = document.querySelector("[data-process]"); return r.offsetTop + r.offsetHeight * 0.5; }); await p.evaluate((y) => scrollTo(0, y), y); }, wait: 1200 });
await shot("/en/", "home-en-desktop-fold.png", D);
for (const [slug, name] of [["peinture-fer-forge-montreal/", "paint"], ["restauration-soudure-fer-forge-montreal/", "weld"], ["contact-devis/", "contact"], ["realisations/", "work"], ["a-propos/", "about"], ["faq/", "faq"]]) await shot("/" + slug, `${name}-desktop-full.png`, D, { full: true });
await shot("/contact-devis/", "contact-mobile-full.png", M, { full: true });
await shot("/en/contact-quote/", "contact-en-mobile-fold.png", M);
await shot("/", "menu-open-mobile.png", M, { before: async (p) => { await p.click(".burger"); } });
await browser.close(); srv.close();
console.log("shots →", OUT);
