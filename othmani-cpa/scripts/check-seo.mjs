/**
 * Vérifie les pages générées (.next/server/app) : title < 60, description < 155, un seul H1, canonical,
 * hreflang fr-CA/en-CA, lang, alt sur chaque image, JSON-LD valide, titles et descriptions uniques.
 * Usage : npm run build && npm run check
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../.next/server/app/", import.meta.url).pathname;
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) { if (!["api"].includes(f)) walk(p); }
    else if (f.endsWith(".html") && !/^_|^404/.test(f)) files.push(p);
  }
})(root);

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const titles = new Map(), descs = new Map();
let errors = 0;
const err = (f, m) => { errors++; console.log(`✗ ${f}: ${m}`); };

for (const file of files.sort()) {
  const rel = ("/" + file.slice(root.length).replace(/\.html$/, "/")).replace(/^\/index\/$/, "/").replace(/^\/en\/$/, "/en/");
  const html = readFileSync(file, "utf8");
  if (/<meta name="robots" content="noindex/.test(html)) { console.log(`– ${rel.padEnd(30)} (noindex, ignorée)`); continue; }
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  const lang = html.match(/<html lang="([^"]+)"/)?.[1];
  if (!title) err(rel, "title manquant"); else if (title.length >= 60) err(rel, `title trop long (${title.length}) : ${title}`);
  if (!desc) err(rel, "description manquante"); else if (desc.length >= 155) err(rel, `description trop longue (${desc.length})`);
  if (h1s !== 1) err(rel, `${h1s} balises H1`);
  if (!/<link rel="canonical"/.test(html)) err(rel, "canonical manquant");
  if (!/hrefLang="fr-CA"/i.test(html) || !/hrefLang="en-CA"/i.test(html)) err(rel, "hreflang manquant");
  if (lang !== (rel.startsWith("/en/") ? "en-CA" : "fr-CA")) err(rel, `lang incorrect (${lang})`);
  for (const img of html.match(/<img\b[^>]*>/g) || []) if (!/\salt="[^"]+"/.test(img)) err(rel, `image sans alt : ${img.slice(0, 80)}`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { err(rel, "JSON-LD invalide"); }
  }
  const types = [...html.matchAll(/"@type":(\[[^\]]*\]|"[^"]+")/g)].map((m) => m[1]).filter((t) => /AccountingService|FAQPage|BreadcrumbList|Person/.test(t));
  if (titles.has(title)) err(rel, `title en double avec ${titles.get(title)}`); titles.set(title, rel);
  if (descs.has(desc)) err(rel, `description en double avec ${descs.get(desc)}`); descs.set(desc, rel);
  console.log(`✓ ${rel.padEnd(30)} ${String(title.length).padStart(2)}/${String(desc.length).padStart(3)}  ${[...new Set(types)].join(" ")}`);
}
console.log(`\n${files.length} pages vérifiées, ${errors} erreur(s).`);
process.exit(errors ? 1 : 0);
