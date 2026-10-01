// Post-build checks: internal links, hreflang pairs, JSON-LD, headings, titles/descriptions, size budget.
//   node proferforge/tools/check.mjs
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
const DIST = new URL("../dist/", import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk(DIST), pages = files.filter((f) => f.endsWith(".html"));
const problems = []; const bad = (f, m) => problems.push(`${f.replace(DIST, "")}: ${m}`);
const exists = (u) => { const p = join(DIST, u.split("#")[0].split("?")[0]); return existsSync(p) && (statSync(p).isFile() || existsSync(join(p, "index.html"))); };
const titles = new Map(), descs = new Map();
for (const f of pages) {
  const h = readFileSync(f, "utf8"), is404 = f.endsWith("404.html");
  const title = (h.match(/<title>(.*?)<\/title>/) || [])[1] || "", desc = (h.match(/name="description" content="(.*?)"/) || [])[1] || "";
  if (!title || title.length > 70) bad(f, `title length ${title.length}`);
  if (!is404 && (desc.length < 70 || desc.length > 170)) bad(f, `description length ${desc.length}`);
  if (!is404) { (titles.get(title) || titles.set(title, []).get(title)).push(f); (descs.get(desc) || descs.set(desc, []).get(desc)).push(f); }
  if ((h.match(/<h1[ >]/g) || []).length !== 1) bad(f, "needs exactly one h1");
  const lv = [...h.matchAll(/<h([1-6])[ >]/g)].map((m) => +m[1]); lv.forEach((l, i) => { if (i && l - lv[i - 1] > 1 && !(lv[i - 1] === 1 && l === 2)) bad(f, `heading jump h${lv[i - 1]}→h${l}`); });
  for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { bad(f, "invalid JSON-LD"); } }
  for (const m of h.matchAll(/(?:href|src)="(\/[^"]*)"/g)) if (!exists(m[1])) bad(f, `broken internal reference ${m[1]}`);
  for (const m of h.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)) bad(f, "img without alt");
  if (!is404) { const alts = [...h.matchAll(/hreflang="(fr-CA|en-CA|x-default)" href="https:\/\/proferforge\.ca([^"]*)"/g)]; if (alts.length < 3) bad(f, "missing hreflang"); for (const a of alts) if (!exists(a[2])) bad(f, `hreflang target missing ${a[2]}`); if (/<a[^>]*href="#"/.test(h)) bad(f, 'dead "#" link'); }
  if (/href="tel:/.test(h) === false && !is404) bad(f, "no tel: link");
}
for (const [t, fs] of titles) if (fs.length > 1) bad(fs[0], `duplicate title shared with ${fs.length - 1} page(s)`);
for (const [t, fs] of descs) if (fs.length > 1) bad(fs[0], `duplicate description shared with ${fs.length - 1} page(s)`);
const budget = { ".html": 90e3, ".css": 40e3, ".js": 30e3 };
for (const f of files) { const ext = f.slice(f.lastIndexOf(".")); const lim = budget[ext]; if (lim && statSync(f).size > lim) bad(f, `over budget: ${(statSync(f).size / 1e3).toFixed(1)} KB`); if ([".png", ".jpg", ".jpeg", ".webp", ".mp4"].includes(ext) && statSync(f).size > (ext === ".mp4" ? 5e6 : 250e3)) bad(f, `asset too heavy: ${(statSync(f).size / 1e3).toFixed(0)} KB`); }
const kb = (e) => (files.filter((f) => f.endsWith(e)).reduce((n, f) => n + statSync(f).size, 0) / 1e3).toFixed(1);
console.log(`${pages.length} pages · html ${kb(".html")} KB total · css ${kb(".css")} KB · js ${kb(".js")} KB`);
if (problems.length) { console.log("PROBLEMS:\n" + problems.map((p) => " - " + p).join("\n")); process.exit(1); }
console.log("All checks passed.");
