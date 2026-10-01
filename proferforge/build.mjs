// Static site generator for Pro Fer Forgé (no dependencies).
//   node proferforge/build.mjs   → writes proferforge/dist/
// Env (all optional): PF_FORM_ENDPOINT, PF_GA_ID, PF_TURNSTILE_KEY
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { BIZ, ENV, BUILD_DATE } from "./src/config.mjs";
import { UI, PAGES, STRUCTURES, PROCESS, WELD_STRUCTURES, REVIEWS, FAQ, GUIDES, COPY, PRIVACY } from "./src/content.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, "src");
const DIST = join(here, "dist");
const LANGS = ["fr", "en"];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const pg = (key) => PAGES.find((p) => p.key === key);
const path = (key, lang) => "/" + pg(key)[lang];
const abs = (p) => BIZ.url + p;
const t = (lang) => UI[lang];
const addr = `${BIZ.street}, ${BIZ.city} (${BIZ.region}) ${BIZ.postal}`;
const ct = (v) => (v && typeof v === "object" ? v : null);
const hash = (s) => createHash("sha1").update(s).digest("hex").slice(0, 8);
const fmtRating = (lang) => (lang === "fr" ? String(BIZ.rating.value.toFixed(1)).replace(".", ",") : BIZ.rating.value.toFixed(1));

rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, "assets"), { recursive: true });

// ---------- Static assets (hashed css/js) ----------
const css = readFileSync(join(SRC, "styles.css"), "utf8");
const js = readFileSync(join(SRC, "site.js"), "utf8");
const CSS_FILE = `styles.${hash(css)}.css`;
const JS_FILE = `site.${hash(js)}.js`;
writeFileSync(join(DIST, "assets", CSS_FILE), css);
writeFileSync(join(DIST, "assets", JS_FILE), js);
const copyDir = (from, to) => {
  if (!existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  for (const f of readdirSync(from)) {
    const p = join(from, f);
    statSync(p).isDirectory() ? copyDir(p, join(to, f)) : copyFileSync(p, join(to, f));
  }
};
copyDir(join(SRC, "assets"), join(DIST, "assets"));
const HAS_VIDEO = existsSync(join(SRC, "assets/video/hero.mp4"));
const HAS_POSTER = existsSync(join(SRC, "assets/img/hero-poster.jpg"));
const IMG_DIM = { hero: [1344, 752], "hero-sm": [800, 448], spiral: [760, 1009], welding: [1344, 752], street: [1280, 716], before: [672, 752], after: [672, 752] };
const hasImg = (n) => existsSync(join(SRC, `assets/img/${n}.webp`));
const ALT = {
  hero: { fr: "Façade de brique à Montréal au crépuscule avec escalier en colimaçon et balcons en fer forgé noirs", en: "Brick façade in Montréal at dusk with a black wrought-iron spiral staircase and balconies" },
  spiral: { fr: "Escalier en colimaçon en fer forgé vu d’en bas, avec rampe ouvragée et mur de brique", en: "Wrought-iron spiral staircase seen from below, with an ornate railing and brick wall" },
  welding: { fr: "Soudeur masqué restaurant un garde-corps en fer forgé, étincelles", en: "Masked welder restoring a wrought-iron railing, sparks flying" },
  street: { fr: "Rue montréalaise bordée d’immeubles de brique avec escaliers extérieurs en fer forgé", en: "Montréal street lined with brick buildings and wrought-iron exterior stairs" },
  before: { fr: "Garde-corps en fer forgé rouillé et écaillé", en: "Rusted, flaking wrought-iron railing" },
  after: { fr: "Garde-corps en fer forgé restauré et repeint", en: "Restored, freshly painted wrought-iron railing" },
};
const photo = (n, lang, cls = "", { eager = false, decorative = false } = {}) => `<img class="${cls}" src="/assets/img/${n}.webp" alt="${decorative ? "" : esc(ALT[n][lang])}" width="${IMG_DIM[n][0]}" height="${IMG_DIM[n][1]}" ${eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}>`;
const HAS_OG = existsSync(join(SRC, "assets/og.jpg"));

// ---------- SVG building blocks ----------
const logo = (cls = "") => `<svg class="logo ${cls}" viewBox="0 0 270 92" role="img" aria-label="Pro Fer Forgé, peinture et restauration" fill="currentColor"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M32 14C62 18 68 40 38 44C12 48 8 66 32 70"/><path d="M33 24h20M33 34h22M33 44h18M33 54h20M33 64h14" stroke-width="2.2"/><path d="M30 80c-14 8-26-2-19-11 4-5 12-3 10 3" /></g><rect x="29" y="12" width="4" height="68" rx="1"/><path d="M31 0l5 11h-10z"/><text x="97" y="36" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="40" textLength="72" lengthAdjust="spacingAndGlyphs">PRO</text><rect x="86" y="42" width="168" height="3"/><text x="86" y="74" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="40" textLength="168" lengthAdjust="spacingAndGlyphs">FER FORGÉ</text><text x="86" y="89" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="8.4" letter-spacing="2" textLength="168" lengthAdjust="spacing">PEINTURE ET RESTAURATION</text></svg>`;
const INLINE_JS = `document.documentElement.classList.add("js")`;
const INLINE_HASH = createHash("sha256").update(INLINE_JS).digest("base64");
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#151A38"/><g fill="none" stroke="#D9803F" stroke-width="4" stroke-linecap="round"><path d="M30 16c16 3 18 14 4 17-14 3-16 14-4 17"/></g><rect x="28" y="12" width="3.5" height="40" fill="#fff"/><path d="M29.7 6l4 8h-8z" fill="#fff"/></svg>`;

function spiralArt() {
  const treads = Array.from({ length: 18 }, (_, i) => {
    const a = i * 20;
    return `<g transform="rotate(${a} 300 300)"><path d="M306 296h210c8 0 8 8 0 8H306z" opacity="${(0.25 + i * 0.04).toFixed(2)}"/></g>`;
  }).join("");
  return `<svg class="spiral" viewBox="0 0 600 600" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2.2">${treads}<circle cx="300" cy="300" r="14" stroke-width="3"/><circle cx="300" cy="300" r="212" opacity=".55"/><circle cx="300" cy="300" r="236" opacity=".28"/><path d="M300 300m0 0c60-4 120 20 160 70" opacity=".6"/></g></svg>`;
}
function embers() {
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return `<div class="embers" aria-hidden="true">${Array.from({ length: 16 }, () => `<i style="left:${(rnd() * 100).toFixed(1)}%;animation-delay:${(rnd() * 9).toFixed(1)}s;animation-duration:${(7 + rnd() * 8).toFixed(1)}s;--s:${(2 + rnd() * 3.5).toFixed(1)}px"></i>`).join("")}</div>`;
}
function railing(state) {
  const rust = state === "rust";
  const iron = rust ? "#7B4326" : "#12152E";
  const hi = rust ? "#B8662F" : "#4B5090";
  const wall = rust ? "#CFC8BB" : "#D9D3C7";
  const posts = Array.from({ length: 10 }, (_, i) => 60 + i * 52);
  const spots = rust ? Array.from({ length: 46 }, (_, i) => { const x = 40 + ((i * 97) % 520), y = 40 + ((i * 53) % 280); return `<circle cx="${x}" cy="${y}" r="${(2 + (i % 4)).toFixed(1)}" fill="${i % 3 ? "#A55A28" : "#5E3119"}" opacity=".85"/>`; }).join("") : "";
  const flakes = rust ? Array.from({ length: 16 }, (_, i) => { const x = 50 + ((i * 131) % 500), y = 60 + ((i * 71) % 230); return `<path d="M${x} ${y}l9-3 4 7-8 4z" fill="#8E8A82" opacity=".7"/>`; }).join("") : `<g stroke="#fff" stroke-opacity=".22" stroke-width="1.6">${posts.map((x) => `<path d="M${x - 2.5} 70v230"/>`).join("")}<path d="M32 62h536M32 296h536"/></g>`;
  const scrolls = posts.slice(0, -1).map((x) => `<path d="M${x} 300c0-60 26-60 26-90s-26-30-26 0M${x + 52} 300c0-60-26-60-26-90s26-30 26 0" fill="none" stroke="${iron}" stroke-width="6" stroke-linecap="round"/>`).join("");
  return `<svg viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${rust ? "Garde-corps rouillé" : "Garde-corps repeint"}"><rect width="600" height="360" fill="${wall}"/><g opacity=".35" stroke="#9C9486" stroke-width="2">${Array.from({ length: 9 }, (_, r) => `<path d="M0 ${r * 40}h600"/>`).join("")}</g><rect x="28" y="52" width="544" height="14" rx="3" fill="${iron}"/><rect x="28" y="290" width="544" height="16" rx="3" fill="${iron}"/>${posts.map((x) => `<rect x="${x - 3.5}" y="62" width="7" height="232" fill="${iron}"/><circle cx="${x}" cy="48" r="8" fill="${iron}"/>`).join("")}${scrolls}<g stroke="${hi}" stroke-width="1.5" opacity=".6">${posts.map((x) => `<path d="M${x - 1.5} 66v224"/>`).join("")}</g>${spots}${flakes}<rect x="0" y="318" width="600" height="42" fill="#000" opacity=".12"/></svg>`;
}
function beforeAfter(lang, label) {
  const real = hasImg("before") && hasImg("after");
  const aft = real ? photo("after", lang) : railing("clean"), bef = real ? photo("before", lang) : railing("rust");
  return `<figure class="ba${real ? " ba-photo" : ""}" data-ba style="--pos:50%"><div class="ba-layer ba-after">${aft}</div><div class="ba-layer ba-before">${bef}</div><span class="ba-tag ba-tag-b">${t(lang).before}</span><span class="ba-tag ba-tag-a">${t(lang).after}</span><span class="ba-ribbon">${t(lang).illustration}</span><span class="ba-handle" aria-hidden="true"><i></i></span><input type="range" min="0" max="100" value="50" aria-label="${esc(label)}"><figcaption class="ba-hint">${t(lang).sliderHint}</figcaption></figure>`;
}
const ICONS = {
  shield: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  scrape: '<path d="M4 20l8-8"/><path d="M12 12l6-6 2 2-6 6z"/><path d="M5 5l3 3M9 3l2 2M3 9l2 2"/>',
  grind: '<circle cx="9" cy="12" r="4"/><path d="M13 12h7M16 8l3-3M16 16l3 3M5 5l2 2M5 19l2-2"/>',
  drop: '<path d="M12 3s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11z"/><path d="M9 15a3 3 0 003 3"/>',
  roller: '<rect x="3" y="4" width="14" height="6" rx="1"/><path d="M17 7h3v6H11v4"/><rect x="9" y="17" width="4" height="4" rx="1"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  pin: '<path d="M12 21s7-6 7-12a7 7 0 00-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  wrench: '<path d="M14 6a4 4 0 005 5l-9 9a2.5 2.5 0 01-4-4l9-9z"/>',
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',
  brush: '<path d="M18 3l3 3-9 9-3-3z"/><path d="M9 12c-3 0-5 2-5 5 0 2-1 3-1 3s4 1 6-1c2-1 3-3 3-5"/>',
};
const icon = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const stepIcons = ["shield", "scrape", "grind", "drop", "roller"];

// ---------- Components ----------
const nbsp = (s) => s;
const link = (key, lang, text, cls = "", extra = "") => `<a href="${path(key, lang)}"${cls ? ` class="${cls}"` : ""}${extra}>${text}</a>`;
const tel = (cls = "", label) => `<a class="${cls}" href="tel:${BIZ.phone}" data-event="click_call">${label || BIZ.phoneDisplay}</a>`;
const btn = (href, text, kind = "primary", extra = "") => `<a class="btn btn-${kind}" href="${href}"${extra}><span>${text}</span>${icon("arrow", "btn-ic")}</a>`;

function header(lang, key) {
  const u = t(lang), n = u.nav, other = lang === "fr" ? "en" : "fr";
  const cur = (k) => (k === key || (key === "g1" || key === "g2" ? k === "guides" : false) ? ' aria-current="page"' : "");
  return `<header class="hdr" data-hdr><div class="wrap hdr-in"><a class="brand" href="${path("home", lang)}" aria-label="${BIZ.name}">${logo()}</a>
<nav class="nav" id="nav" aria-label="${lang === "fr" ? "Navigation principale" : "Main navigation"}"><ul>
<li>${link("home", lang, n.home, "", cur("home"))}</li>
<li class="has-sub"><button class="sub-btn" aria-expanded="false" aria-haspopup="true">${n.services}<svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button><ul class="sub">
<li>${link("paint", lang, n.paint, "", cur("paint"))}</li><li>${link("weld", lang, n.weld, "", cur("weld"))}</li></ul></li>
<li>${link("work", lang, n.work, "", cur("work"))}</li><li>${link("about", lang, n.about, "", cur("about"))}</li><li>${link("areas", lang, n.areas, "", cur("areas"))}</li><li>${link("faq", lang, n.faq, "", cur("faq"))}</li>
<li class="nav-cta-m">${btn(path("contact", lang), u.quoteLong, "primary", ' data-event="click_quote"')}</li><li class="nav-tel-m">${icon("phone")}${tel("", BIZ.phoneDisplay)}</li></ul></nav>
<div class="hdr-act"><a class="lang" href="${path(key, other)}" hreflang="${other}" lang="${other}" data-lang-switch>${u.langShort}</a>${tel("hdr-tel", `${icon("phone")}<span>${BIZ.phoneDisplay}</span>`)}${btn(path("contact", lang), u.quote, "primary", ' data-event="click_quote"')}<button class="burger" aria-controls="nav" aria-expanded="false" aria-label="${u.menu}"><span></span><span></span></button></div></div></header>`;
}
function footer(lang) {
  const u = t(lang), n = u.nav;
  const social = Object.entries(BIZ.social).filter(([, v]) => v).map(([k, v]) => `<li><a href="${v}" rel="noopener me" target="_blank">${k[0].toUpperCase() + k.slice(1)}</a></li>`).join("");
  const rbq = BIZ.rbq ? `<p class="lic">RBQ ${esc(BIZ.rbq)}</p>` : "";
  return `<footer class="ftr"><div class="wrap ftr-grid"><div class="ftr-brand">${logo("logo-w")}<p>${COPY[lang].homeSchemaDesc}</p>${rbq}</div>
<div><h2 class="ftr-h">${u.footerServices}</h2><ul>${["paint", "weld", "work", "areas"].map((k) => `<li>${link(k, lang, n[k])}</li>`).join("")}</ul></div>
<div><h2 class="ftr-h">${u.footerLinks}</h2><ul>${["home", "about", "faq", "guides", "contact"].map((k) => `<li>${link(k, lang, n[k])}</li>`).join("")}</ul></div>
<div><h2 class="ftr-h">${u.footerContact}</h2><address><p>${icon("phone")}${tel("", BIZ.phoneDisplay)}</p><p>${icon("mail")}<a href="mailto:${BIZ.email}" data-event="click_email">${BIZ.email}</a></p><p>${icon("pin")}<a href="${BIZ.mapsUrl}" rel="noopener" target="_blank" data-event="click_directions">${esc(addr)}</a></p></address>${social ? `<ul class="soc">${social}</ul>` : ""}</div></div>
<div class="wrap ftr-base"><p>© ${new Date(BUILD_DATE).getFullYear()} ${BIZ.name}. ${u.rights}</p><p>${link("privacy", lang, u.privacy)} · <button type="button" class="linkbtn" data-cookie-manage>${u.cookies}</button></p></div></footer>`;
}
function stickyBar(lang) {
  const u = t(lang);
  return `<div class="mbar" role="region" aria-label="${lang === "fr" ? "Actions rapides" : "Quick actions"}">${tel("mbar-a mbar-call", `${icon("phone")}<span>${u.call}</span>`)}<a class="mbar-a mbar-quote" href="${path("contact", lang)}" data-event="click_quote">${icon("brush")}<span>${u.quote}</span></a></div>`;
}
function cookieBanner(lang) {
  const u = t(lang);
  return `<div class="cookie" id="cookie" role="dialog" aria-modal="false" aria-labelledby="ck-t" hidden><p id="ck-t">${u.cookieText} <a href="${path("privacy", lang)}">${u.cookieMore}</a></p><div class="cookie-b"><button type="button" class="btn btn-ghost-d" data-consent="no"><span>${u.cookieRefuse}</span></button><button type="button" class="btn btn-primary" data-consent="yes"><span>${u.cookieAccept}</span></button></div></div>`;
}

function trustStrip(lang) {
  const u = t(lang);
  const items = [`<div class="trust-i"><span class="trust-n" data-count="${BIZ.rating.value}" data-dec="1">${fmtRating(lang)}</span><span class="stars" aria-hidden="true">${"★".repeat(5)}</span><span class="trust-l">${u.ratingLabel}</span></div>`,
    `<div class="trust-i"><span class="trust-n" data-count="${BIZ.rating.count}" data-dec="0">${BIZ.rating.count}</span><span class="trust-l">${u.reviews}</span></div>`];
  if (BIZ.rbq) items.push(`<div class="trust-i"><span class="trust-n trust-t">RBQ</span><span class="trust-l">${esc(BIZ.rbq)}</span></div>`);
  if (ct(BIZ.insurance)) items.push(`<div class="trust-i"><span class="trust-n trust-t">${icon("shield")}</span><span class="trust-l">${esc(BIZ.insurance[lang])}</span></div>`);
  if (BIZ.founded) items.push(`<div class="trust-i"><span class="trust-n" data-count="${new Date(BUILD_DATE).getFullYear() - BIZ.founded}" data-dec="0">${new Date(BUILD_DATE).getFullYear() - BIZ.founded}</span><span class="trust-l">${lang === "fr" ? "ans d’expérience" : "years of experience"}</span></div>`);
  items.push(`<div class="trust-i trust-link"><a href="${BIZ.mapsUrl}" rel="noopener" target="_blank">${u.seeReviews}</a></div>`);
  return `<section class="trust rv" aria-label="${lang === "fr" ? "Preuves de confiance" : "Trust signals"}"><div class="wrap trust-in">${items.join("")}</div></section>`;
}
function reviews(lang, heading) {
  return `<section class="sec reviews" id="avis"><div class="wrap"><h2 class="h2 rv">${heading}</h2><div class="rev-track" data-carousel tabindex="0" role="region" aria-label="${heading}">${REVIEWS.map((r) => `<figure class="rev rv"><div class="stars" aria-label="5/5">${"★".repeat(5)}</div><blockquote>${esc(r[lang])}</blockquote><figcaption>${esc(r.n)}</figcaption></figure>`).join("")}</div><div class="rev-ctl"><button type="button" class="rev-b" data-dir="-1" aria-label="${lang === "fr" ? "Précédent" : "Previous"}">${icon("arrow", "flip")}</button><button type="button" class="rev-b" data-dir="1" aria-label="${lang === "fr" ? "Suivant" : "Next"}">${icon("arrow")}</button><a class="rev-all" href="${BIZ.mapsUrl}" rel="noopener" target="_blank">${t(lang).seeReviews}</a></div></div></section>`;
}
function faqBlock(lang, items) {
  return `<div class="faq">${items.map((f, i) => `<details class="faq-i rv"${i === 0 ? " open" : ""}><summary>${esc(f.q[lang])}</summary><p>${esc(f.a[lang])}</p></details>`).join("")}</div>`;
}
function ctaBand(lang, heading, sub) {
  const c = COPY[lang];
  return `<section class="cta"><div class="cta-bg" aria-hidden="true">${spiralArt()}</div><div class="wrap cta-in"><h2 class="h2 rv">${heading}</h2>${sub ? `<p class="rv">${sub}</p>` : ""}<div class="cta-b rv">${btn(path("contact", lang), c.ctaFoot, "primary", ' data-event="click_quote"')}${tel("btn btn-ghost", `${icon("phone", "btn-ic")}<span>${BIZ.phoneDisplay}</span>`)}</div><p class="cta-n rv">${c.contact.min.replace("{min}", BIZ.minimumProject[lang])}</p></div></section>`;
}
function areaChips(lang) {
  return `<ul class="chips">${BIZ.areas.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`;
}
function breadcrumbs(lang, key, label) {
  return `<nav class="crumbs" aria-label="${lang === "fr" ? "Fil d’Ariane" : "Breadcrumb"}"><ol><li><a href="${path("home", lang)}">${t(lang).breadcrumbHome}</a></li>${key === "g1" || key === "g2" ? `<li><a href="${path("guides", lang)}">${t(lang).nav.guides}</a></li>` : ""}<li aria-current="page">${esc(label)}</li></ol></nav>`;
}
function pageHead(lang, key, h1, lead, label, img) {
  const bg = img && hasImg(img) ? `${photo(img, lang, "phead-img", { decorative: true, eager: true })}<div class="phead-shade"></div>` : spiralArt();
  return `<section class="phead${img && hasImg(img) ? " has-img" : ""}"><div class="phead-bg" aria-hidden="true">${bg}${embers()}</div><div class="wrap phead-in">${breadcrumbs(lang, key, label || h1)}<h1 class="rv">${h1}</h1>${lead ? `<p class="lead rv">${lead}</p>` : ""}</div></section>`;
}

// ---------- Schema ----------
function businessNode(lang) {
  const node = {
    "@type": ["HomeAndConstructionBusiness", "LocalBusiness"], "@id": abs("/#business"), name: BIZ.name, url: abs("/"), telephone: BIZ.phone, email: BIZ.email,
    image: abs("/assets/og.jpg"), logo: abs("/assets/logo.svg"), description: COPY[lang].homeSchemaDesc, priceRange: "$$",
    address: { "@type": "PostalAddress", streetAddress: BIZ.street, addressLocality: BIZ.city, addressRegion: BIZ.region, postalCode: BIZ.postal, addressCountry: BIZ.country },
    geo: { "@type": "GeoCoordinates", latitude: BIZ.geo.lat, longitude: BIZ.geo.lng },
    areaServed: [{ "@type": "City", name: "Montréal" }, ...BIZ.areas.map((a) => ({ "@type": "AdministrativeArea", name: a }))],
    knowsLanguage: ["fr", "en"],
    hasOfferCatalog: { "@type": "OfferCatalog", name: lang === "fr" ? "Services de fer forgé" : "Wrought iron services", itemListElement: ["paint", "weld"].map((k) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: COPY[lang][k].h1, url: abs(path(k, lang)) } })) },
    aggregateRating: { "@type": "AggregateRating", ratingValue: BIZ.rating.value, reviewCount: BIZ.rating.count, bestRating: 5 },
  };
  if (BIZ.hours) node.openingHoursSpecification = BIZ.hours.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes }));
  const sameAs = [...Object.values(BIZ.social).filter(Boolean)];
  if (sameAs.length) node.sameAs = sameAs;
  if (BIZ.founded) node.foundingDate = String(BIZ.founded);
  return node;
}
function schemaGraph(lang, key, title, extra = []) {
  const crumbs = key === "home" ? [] : [{ n: t(lang).breadcrumbHome, u: path("home", lang) }, ...(key === "g1" || key === "g2" ? [{ n: t(lang).nav.guides, u: path("guides", lang) }] : []), { n: title, u: path(key, lang) }];
  const graph = [
    { "@type": "WebSite", "@id": abs("/#website"), url: abs("/"), name: BIZ.name, inLanguage: ["fr-CA", "en-CA"], publisher: { "@id": abs("/#business") } },
    businessNode(lang),
    { "@type": "WebPage", "@id": abs(path(key, lang)) + "#page", url: abs(path(key, lang)), name: title, inLanguage: lang === "fr" ? "fr-CA" : "en-CA", isPartOf: { "@id": abs("/#website") }, about: { "@id": abs("/#business") } },
    ...extra,
  ];
  if (crumbs.length) graph.push({ "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.n, item: abs(c.u) })) });
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>`;
}
const faqSchema = (lang, items) => ({ "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q[lang], acceptedAnswer: { "@type": "Answer", text: f.a[lang] } })) });
const serviceSchema = (lang, k) => ({ "@type": "Service", name: COPY[lang][k].h1, serviceType: COPY[lang][k].h1, provider: { "@id": abs("/#business") }, areaServed: { "@type": "City", name: "Montréal" }, url: abs(path(k, lang)), description: COPY[lang][k].desc });

// ---------- Page shell ----------
function shell({ lang, key, title, desc, body, extraSchema = [], noindex = false, bodyClass = "" }) {
  const other = lang === "fr" ? "en" : "fr";
  const canonical = abs(path(key, lang));
  const og = abs("/assets/og.jpg");
  return `<!doctype html>
<html lang="${lang === "fr" ? "fr-CA" : "en-CA"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="${lang === "fr" ? "fr-CA" : "en-CA"}" href="${canonical}"><link rel="alternate" hreflang="${other === "fr" ? "fr-CA" : "en-CA"}" href="${abs(path(key, other))}"><link rel="alternate" hreflang="x-default" href="${abs(path(key, "fr"))}">
${noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
<meta name="theme-color" content="#0E1226"><meta name="format-detection" content="telephone=no">
<meta property="og:type" content="website"><meta property="og:site_name" content="${BIZ.name}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}"><meta property="og:locale" content="${lang === "fr" ? "fr_CA" : "en_CA"}"><meta property="og:locale:alternate" content="${other === "fr" ? "fr_CA" : "en_CA"}">
<meta property="og:image" content="${og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="manifest" href="/manifest.webmanifest">
<link rel="preload" href="/assets/fonts/barlow-700.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/${CSS_FILE}">
<script>${INLINE_JS}</script>
${schemaGraph(lang, key, title, extraSchema)}
</head><body class="${bodyClass}" data-lang="${lang}" data-ga="${esc(ENV.gaId)}" data-endpoint="${esc(ENV.formEndpoint)}" data-turnstile="${esc(ENV.turnstileKey)}">
<a class="skip" href="#main">${t(lang).skip}</a><div class="progress" aria-hidden="true"><i></i></div>
${header(lang, key)}
<main id="main">${body}</main>
${footer(lang)}${stickyBar(lang)}${cookieBanner(lang)}
<script src="/assets/${JS_FILE}" defer></script></body></html>`;
}

// ---------- Pages ----------
function homePage(lang) {
  const c = COPY[lang].home, u = t(lang);
  const poster = HAS_POSTER ? "/assets/img/hero-poster.jpg" : hasImg("hero") ? "/assets/img/hero.webp" : "";
  const videoSrc = HAS_VIDEO ? "/assets/video/hero.mp4" : ENV.heroVideoUrl;
  const video = videoSrc ? `<video class="hero-video" muted loop playsinline preload="none" ${poster ? `poster="${poster}"` : ""} data-mp4="${esc(videoSrc)}"${HAS_VIDEO && existsSync(join(SRC, "assets/video/hero.webm")) ? ' data-webm="/assets/video/hero.webm"' : ""} aria-hidden="true"></video>` : "";
  const heroImg = hasImg("hero");
  const hero = `<section class="hero${heroImg ? " has-img" : ""}" data-hero><div class="hero-media" aria-hidden="true">${heroImg ? photo("hero", lang, "hero-img", { eager: true, decorative: true }) : ""}${video}<div class="hero-art" data-parallax="0.18">${spiralArt()}</div>${embers()}</div><div class="hero-shade" aria-hidden="true"></div><div class="wrap hero-in"><p class="eyebrow rv">${c.eyebrow}</p><h1 class="hero-h rv">${c.h1}</h1><p class="hero-sub rv">${c.sub}</p><div class="hero-cta rv">${btn(path("contact", lang), u.quoteLong, "primary", ' data-event="click_quote"')}${tel("btn btn-ghost", `${icon("phone", "btn-ic")}<span>${u.callNow} ${BIZ.phoneDisplay}</span>`)}</div><p class="hero-note rv">${c.note}</p></div><a class="scroll-cue" href="#intro" aria-label="${u.scroll}"><span></span></a></section>`;
  const intro = `<section class="sec intro" id="intro"><div class="wrap narrow"><h2 class="h2 rv">${c.intro[0]}</h2><p class="lead rv">${c.intro[1]}</p></div></section>`;
  const services = `<section class="sec svc"><div class="wrap"><h2 class="h2 rv">${c.servicesH}</h2><div class="svc-grid">${c.svc.map((s, i) => `<a class="svc-card rv" href="${path(s.k, lang)}"><div class="svc-art${hasImg(i ? "welding" : "spiral") ? " has-img" : ""}" aria-hidden="true">${hasImg(i ? "welding" : "spiral") ? photo(i ? "welding" : "spiral", lang, "svc-img", { decorative: true }) : ""}${i ? icon("wrench", "svc-ic") : icon("brush", "svc-ic")}<div class="svc-glow"></div></div><h3>${s.t}</h3><p>${s.d}</p><span class="more">${lang === "fr" ? "En savoir plus" : "Learn more"} ${icon("arrow")}</span></a>`).join("")}</div></div></section>`;
  const structs = `<section class="sec structs"><div class="wrap"><h2 class="h2 rv">${c.structH}</h2><ul class="struct-row">${STRUCTURES.map((s, i) => `<li class="struct rv" style="--d:${i * 70}ms"><span class="struct-n">0${i + 1}</span>${esc(s[lang])}</li>`).join("")}</ul></div></section>`;
  const process = `<section class="process" data-process aria-labelledby="proc-h"><div class="process-pin"><div class="wrap process-grid"><div class="process-intro"><h2 class="h2" id="proc-h">${c.processH}</h2><p class="lead">${c.processSub}</p><ol class="pnav" aria-hidden="true">${PROCESS.map((p, i) => `<li data-i="${i}"><span>${i + 1}</span>${esc(p[lang][0])}</li>`).join("")}</ol><div class="pbar" aria-hidden="true"><i></i></div></div><div class="process-stage">${PROCESS.map((p, i) => `<article class="pstep" data-i="${i}"><div class="pstep-ic">${icon(stepIcons[i])}</div><span class="pstep-n">0${i + 1}</span><h3>${esc(p[lang][0])}</h3><p>${esc(p[lang][1])}</p></article>`).join("")}</div></div></div></section>`;
  const why = `<section class="sec why"><div class="wrap"><h2 class="h2 rv">${c.whyH}</h2><div class="why-grid">${c.why.map((w, i) => `<article class="why-c rv" style="--d:${i * 80}ms"><span class="why-i">${icon(["shield", "pin", "check", "home"][i])}</span><h3>${w[0]}</h3><p>${w[1]}</p></article>`).join("")}</div></div></section>`;
  const work = `<section class="sec workteaser"><div class="wrap work-grid"><div><h2 class="h2 rv">${c.workH}</h2><p class="lead rv">${c.workSub}</p><div class="rv">${btn(path("work", lang), u.nav.work, "ghost-d")}</div></div><div class="rv">${beforeAfter(lang, c.workH)}</div></div></section>`;
  const warranty = ct(BIZ.warranty) ? `<section class="sec warranty"><div class="wrap narrow"><h2 class="h2 rv">${lang === "fr" ? "Notre garantie" : "Our warranty"}</h2><p class="lead rv">${esc(BIZ.warranty[lang])}</p></div></section>` : "";
  const areas = `<section class="sec areas"><div class="wrap${hasImg("street") ? " areas-grid" : ""}"><div><h2 class="h2 rv">${c.areasH}</h2><p class="lead rv">${c.areasSub}</p><div class="rv">${areaChips(lang)}</div><p class="rv">${link("areas", lang, `${COPY[lang].areas.h1} ${"→"}`, "textlink")}</p></div>${hasImg("street") ? `<figure class="areas-fig rv">${photo("street", lang)}</figure>` : ""}</div></section>`;
  const faq = `<section class="sec faqsec"><div class="wrap narrow"><h2 class="h2 rv">${c.faqH}</h2>${faqBlock(lang, FAQ.slice(0, 4))}<p class="rv">${link("faq", lang, `${t(lang).nav.faq} →`, "textlink")}</p></div></section>`;
  return shell({ lang, key: "home", title: c.title, desc: c.desc, body: hero + trustStrip(lang) + intro + services + structs + process + why + work + reviews(lang, c.reviewsH) + warranty + areas + faq + ctaBand(lang, c.ctaH, c.ctaSub), extraSchema: [faqSchema(lang, FAQ.slice(0, 4))], bodyClass: "home" });
}

function paintPage(lang) {
  const c = COPY[lang].paint, u = t(lang);
  const body = pageHead(lang, "paint", c.h1, c.lead) +
    `<section class="sec"><div class="wrap"><h2 class="h2 rv">${c.structH}</h2><ul class="struct-row struct-row-lg">${STRUCTURES.map((s, i) => `<li class="struct rv" style="--d:${i * 70}ms"><span class="struct-n">0${i + 1}</span>${esc(s[lang])}</li>`).join("")}</ul><p class="rv big">${lang === "fr" ? "Un rendu durable, esthétique et protégé contre la corrosion." : "A durable, attractive finish protected against corrosion."}</p></div></section>` +
    `<section class="sec dark two"><div class="wrap two-grid">${hasImg("spiral") ? `<figure class="side-fig rv">${photo("spiral", lang)}</figure>` : ""}<div class="card-l rv"><h2 class="h3">${c.procH}</h2><ol class="steps">${c.procBullets.map((b) => `<li>${b}</li>`).join("")}</ol></div><div class="rv"><h2 class="h3">${c.durH}</h2><p>${c.durP}</p><p>${c.crossP} ${link("weld", lang, c.crossLink, "textlink")}.</p><div class="mt">${btn(path("contact", lang), u.quoteLong, "primary", ' data-event="click_quote"')}</div></div></div></section>` +
    `<section class="sec"><div class="wrap work-grid"><div><h2 class="h2 rv">${COPY[lang].home.workH}</h2><p class="lead rv">${COPY[lang].home.workSub}</p></div><div class="rv">${beforeAfter(lang, COPY[lang].home.workH)}</div></div></section>` +
    ctaBand(lang, c.ctaH);
  return shell({ lang, key: "paint", title: c.title, desc: c.desc, body, extraSchema: [serviceSchema(lang, "paint")] });
}
function weldPage(lang) {
  const c = COPY[lang].weld, u = t(lang);
  const body = pageHead(lang, "weld", c.h1, c.lead, undefined, "welding") +
    `<section class="sec"><div class="wrap"><h2 class="h2 rv">${c.cardsH}</h2><div class="two-cards">${c.cards.map((cd, i) => `<article class="why-c rv"><span class="why-i">${icon(i ? "shield" : "wrench")}</span><h3>${cd[0]}</h3><ul class="ticks">${cd[1].map((x) => `<li>${icon("check")}${x}</li>`).join("")}</ul></article>`).join("")}</div></div></section>` +
    `<section class="sec dark"><div class="wrap"><h2 class="h2 rv">${c.structH}</h2><div class="weld-grid">${WELD_STRUCTURES.map((w, i) => `<article class="weld-c rv" style="--d:${i * 70}ms"><span class="struct-n">0${i + 1}</span><h3>${esc(w[lang][0])}</h3><p>${esc(w[lang][1])}</p></article>`).join("")}</div><p class="rv mt">${c.crossP} ${link("paint", lang, c.crossLink, "textlink")} ${c.crossEnd}</p></div></section>` +
    ctaBand(lang, c.ctaH);
  return shell({ lang, key: "weld", title: c.title, desc: c.desc, body, extraSchema: [serviceSchema(lang, "weld")] });
}
function workPage(lang) {
  const c = COPY[lang].work;
  const body = pageHead(lang, "work", c.h1, c.lead) +
    `<section class="sec"><div class="wrap"><h2 class="h2 rv">${c.demoH}</h2><div class="rv ba-wide">${beforeAfter(lang, c.demoH)}</div><ol class="ba-steps rv">${c.steps.map((s, i) => `<li><span>${i + 1}</span>${s}</li>`).join("")}</ol><p class="note rv">${c.note}</p></div></section>` + ctaBand(lang, c.ctaH);
  return shell({ lang, key: "work", title: c.title, desc: c.desc, body });
}
const PHRASES = { fr: [["peinture de fer forgé à Montréal", "paint"], ["restauration et soudure de fer forgé", "weld"]], en: [["wrought iron painting", "paint"], ["wrought iron restoration and welding", "weld"]] };
function linkify(text, lang) {
  let out = text;
  for (const [ph, k] of PHRASES[lang]) { const i = out.indexOf(ph); if (i >= 0 && !out.slice(0, i).includes("<a ")) out = out.slice(0, i) + `<a class="textlink" href="${path(k, lang)}">${ph}</a>` + out.slice(i + ph.length); else if (i >= 0) out = out.replace(ph, `<a class="textlink" href="${path(k, lang)}">${ph}</a>`); }
  return out;
}
function aboutPage(lang) {
  const c = COPY[lang].about;
  const facts = [BIZ.owner && `<li><strong>${lang === "fr" ? "Dirigeant" : "Owner"}</strong> ${esc(BIZ.owner)}</li>`, BIZ.founded && `<li><strong>${lang === "fr" ? "Fondée en" : "Founded"}</strong> ${BIZ.founded}</li>`, BIZ.rbq && `<li><strong>RBQ</strong> ${esc(BIZ.rbq)}</li>`, ct(BIZ.insurance) && `<li><strong>${lang === "fr" ? "Assurance" : "Insurance"}</strong> ${esc(BIZ.insurance[lang])}</li>`].filter(Boolean);
  const body = pageHead(lang, "about", c.h1) +
    `<section class="sec"><div class="wrap two-grid"><div><h2 class="h2 rv">${c.h2}</h2>${c.p.map((p) => `<p class="rv">${linkify(p, lang)}</p>`).join("")}${facts.length ? `<ul class="facts rv">${facts.join("")}</ul>` : ""}</div><div class="rv"><div class="card-l"><h2 class="h3">${c.methodH}</h2><ol class="steps">${c.method.map((m) => `<li>${m}</li>`).join("")}</ol></div><div class="card-l mt"><h2 class="h3">${c.commitH}</h2><ul class="ticks">${c.commit.map((m) => `<li>${icon("check")}${m}</li>`).join("")}</ul></div></div></div></section>` +
    ctaBand(lang, c.ctaH);
  return shell({ lang, key: "about", title: c.title, desc: c.desc, body });
}
function areasPage(lang) {
  const c = COPY[lang].areas;
  const body = pageHead(lang, "areas", c.h1, c.lead, undefined, "street") +
    `<section class="sec"><div class="wrap two-grid"><div><h2 class="h2 rv">${c.listH}</h2><div class="rv">${areaChips(lang)}</div><a class="btn btn-ghost-d rv mt" href="${BIZ.mapsUrl}" rel="noopener" target="_blank" data-event="click_directions"><span>${c.mapBtn}</span>${icon("arrow", "btn-ic")}</a></div><div class="rv card-l"><h2 class="h3">${c.whyH}</h2><p>${c.whyP}</p><address class="nap">${icon("pin")}${esc(addr)}<br>${icon("phone")}${tel("", BIZ.phoneDisplay)}</address></div></div></section>` + ctaBand(lang, c.ctaH);
  return shell({ lang, key: "areas", title: c.title, desc: c.desc, body });
}
function faqPage(lang) {
  const c = COPY[lang].faq;
  const body = pageHead(lang, "faq", c.h1, c.lead) + `<section class="sec"><div class="wrap narrow">${faqBlock(lang, FAQ)}</div></section>` + ctaBand(lang, c.ctaH);
  return shell({ lang, key: "faq", title: c.title, desc: c.desc, body, extraSchema: [faqSchema(lang, FAQ)] });
}
function guidesPage(lang) {
  const c = COPY[lang].guides;
  const body = pageHead(lang, "guides", c.h1, c.lead) + `<section class="sec"><div class="wrap"><div class="guide-grid">${["g1", "g2"].map((k) => `<a class="svc-card rv" href="${path(k, lang)}"><h2 class="h3">${GUIDES[k][lang].title}</h2><p>${GUIDES[k][lang].desc}</p><span class="more">${t(lang).readGuide} ${icon("arrow")}</span></a>`).join("")}</div></div></section>` + ctaBand(lang, COPY[lang].home.ctaH, COPY[lang].home.ctaSub);
  return shell({ lang, key: "guides", title: c.title, desc: c.desc, body });
}
function guidePage(lang, k) {
  const g = GUIDES[k][lang];
  const article = { "@type": "Article", headline: g.title, description: g.desc, inLanguage: lang === "fr" ? "fr-CA" : "en-CA", datePublished: BUILD_DATE, dateModified: BUILD_DATE, author: { "@id": abs("/#business") }, publisher: { "@id": abs("/#business") }, mainEntityOfPage: abs(path(k, lang)), image: abs("/assets/og.jpg") };
  const body = pageHead(lang, k, g.title, g.lead, g.title) + `<section class="sec"><div class="wrap narrow prose">${g.sections.map(([h, ps]) => `<h2 class="h3 rv">${h}</h2>${ps.map((p) => `<p class="rv">${p}</p>`).join("")}`).join("")}<p class="rv">${link("paint", lang, COPY[lang].paint.h1, "textlink")} · ${link("weld", lang, COPY[lang].weld.h1, "textlink")}</p></div></section>` + ctaBand(lang, COPY[lang].home.ctaH, COPY[lang].home.ctaSub);
  return shell({ lang, key: k, title: `${g.tt} | ${BIZ.name}`, desc: g.desc, body, extraSchema: [article] });
}
function contactPage(lang) {
  const c = COPY[lang].contact, f = c.f, u = t(lang);
  const field = (id, label, type = "text", req = true, attrs = "") => `<div class="fld"><label for="${id}">${label}${req ? ' <span class="req" aria-hidden="true">*</span>' : ` <span class="opt">(${f.optional})</span>`}</label><input id="${id}" name="${id}" type="${type}"${req ? " required" : ""} ${attrs}><p class="err" data-err="${id}" hidden></p></div>`;
  const sel = (id, label, opts) => `<div class="fld"><label for="${id}">${label} <span class="req" aria-hidden="true">*</span></label><select id="${id}" name="${id}" required><option value="" disabled selected>—</option>${opts.map((o) => `<option>${o}</option>`).join("")}</select><p class="err" data-err="${id}" hidden></p></div>`;
  const form = `<form class="qform" id="quote" novalidate data-i18n='${esc(JSON.stringify({ sending: u.sending, send: u.send, sentTitle: u.sentTitle, sentText: u.sentText, fallbackTitle: u.fallbackTitle, fallbackText: u.fallbackText, errRequired: u.errRequired, errEmail: u.errEmail, errPhone: u.errPhone, errPostal: u.errPostal, errConsent: u.errConsent, errFiles: u.errFiles }))}'>
<div class="fgrid">${field("name", f.name)}${field("phone", f.phone, "tel", true, 'inputmode="tel" autocomplete="tel"')}${field("email", f.email, "email", true, 'autocomplete="email"')}${field("postal", f.postal, "text", true, 'autocomplete="postal-code" maxlength="7"')}</div>
${field("address", f.address, "text", false, 'autocomplete="street-address"')}
<div class="fgrid">${sel("clientType", f.clientType, f.ct)}${sel("work", f.work, f.wk)}${sel("timeline", f.timeline, f.tl)}</div>
<fieldset class="fld"><legend>${f.struct} <span class="opt">(${f.optional})</span></legend><div class="checks">${STRUCTURES.map((s) => `<label class="chk"><input type="checkbox" name="structures" value="${esc(s[lang])}"><span>${esc(s[lang])}</span></label>`).join("")}</div></fieldset>
<div class="fld"><label for="msg">${f.msg} <span class="opt">(${f.optional})</span></label><textarea id="msg" name="message" rows="5"></textarea></div>
<div class="fld"><label for="photos">${f.photos} <span class="opt">(${f.optional})</span></label><input id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple><p class="help">${f.photosHelp}</p><p class="err" data-err="photos" hidden></p></div>
<div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<div class="fld"><label class="chk consent"><input type="checkbox" id="consent" name="consent" required><span>${f.consent.replace("{priv}", path("privacy", lang))}</span></label><p class="err" data-err="consent" hidden></p></div>
<div class="cf-turnstile-wrap" data-ts></div>
<p class="min">${c.min.replace("{min}", BIZ.minimumProject[lang])}</p>
<button class="btn btn-primary btn-lg" type="submit" data-event="submit_quote"><span>${u.send}</span>${icon("arrow", "btn-ic")}</button>
<div class="form-status" role="status" aria-live="polite" hidden></div></form>`;
  const body = pageHead(lang, "contact", c.h1, c.lead) + `<section class="sec contact"><div class="wrap contact-grid"><div class="rv">${form}</div><aside class="rv card-l"><h2 class="h3">${c.alt}</h2><p>${tel("big-tel", `${icon("phone")}${BIZ.phoneDisplay}`)}</p><p><a href="mailto:${BIZ.email}" data-event="click_email">${icon("mail")}${BIZ.email}</a></p><p><a href="${BIZ.mapsUrl}" rel="noopener" target="_blank" data-event="click_directions">${icon("pin")}${esc(addr)}</a></p><p class="note">${c.thanks}</p></aside></div></section>`;
  return shell({ lang, key: "contact", title: c.title, desc: c.desc, body, extraSchema: [{ "@type": "ContactPage", url: abs(path("contact", lang)), about: { "@id": abs("/#business") } }] });
}
function privacyPage(lang) {
  const c = COPY[lang].privacy;
  const officer = BIZ.privacyOfficer;
  const body = pageHead(lang, "privacy", c.h1) + `<section class="sec"><div class="wrap narrow prose">${PRIVACY[lang].map(([h, p]) => `<h2 class="h3">${h}</h2><p>${p}</p>`).join("")}<h2 class="h3">${lang === "fr" ? "Nous joindre" : "Contact us"}</h2><p>${officer.name ? esc(officer.name) + " · " : ""}<a href="mailto:${officer.email}">${officer.email}</a> · ${tel("", BIZ.phoneDisplay)}<br>${esc(addr)}</p><p class="note">${lang === "fr" ? "Dernière mise à jour" : "Last updated"} : ${BUILD_DATE}</p></div></section>`;
  return shell({ lang, key: "privacy", title: c.title, desc: c.desc, body });
}
function notFound() {
  const c = COPY.fr.notFound;
  const body = `<section class="phead"><div class="phead-bg" aria-hidden="true">${spiralArt()}</div><div class="wrap phead-in"><h1>${c.h1}</h1><p class="lead">${c.p}</p><div class="hero-cta">${btn("/", "Accueil", "ghost")}${btn("/contact-devis/", UI.fr.quoteLong, "primary")}</div></div></section>`;
  return shell({ lang: "fr", key: "home", title: c.title, desc: c.p, body, noindex: true }).replace(/<link rel="canonical"[^>]*>/, "");
}

// ---------- Write ----------
const renderers = { home: homePage, paint: paintPage, weld: weldPage, work: workPage, about: aboutPage, areas: areasPage, faq: faqPage, guides: guidesPage, contact: contactPage, privacy: privacyPage, g1: (l) => guidePage(l, "g1"), g2: (l) => guidePage(l, "g2") };
const write = (rel, content) => { const p = join(DIST, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, content); };
for (const p of PAGES) for (const lang of LANGS) write(join(p[lang], "index.html"), renderers[p.key](lang));
write("404.html", notFound());
write("assets/favicon.svg", FAVICON);
write("assets/logo.svg", logo().replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace('fill="currentColor"', 'fill="#333657" color="#333657"'));

// sitemap with hreflang
const urls = PAGES.flatMap((p) => LANGS.map((lang) => `<url><loc>${abs(path(p.key, lang))}</loc><lastmod>${BUILD_DATE}</lastmod>${LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l === "fr" ? "fr-CA" : "en-CA"}" href="${abs(path(p.key, l))}"/>`).join("")}<xhtml:link rel="alternate" hreflang="x-default" href="${abs(path(p.key, "fr"))}"/><priority>${p.key === "home" ? "1.0" : ["paint", "weld", "contact"].includes(p.key) ? "0.9" : "0.6"}</priority></url>`));
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("")}</urlset>`);
write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${abs("/sitemap.xml")}\n`);
write("manifest.webmanifest", JSON.stringify({ name: BIZ.name, short_name: "Pro Fer Forgé", lang: "fr-CA", start_url: "/", display: "standalone", background_color: "#0E1226", theme_color: "#0E1226", icons: [{ src: "/assets/favicon.svg", sizes: "any", type: "image/svg+xml" }] }));
write("_headers", `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'sha256-${INLINE_HASH}' https://www.googletagmanager.com https://challenges.cloudflare.com; connect-src 'self' https:; frame-src https://challenges.cloudflare.com; media-src 'self'${ENV.heroVideoUrl ? " " + new URL(ENV.heroVideoUrl).origin : ""}; font-src 'self'; form-action 'self' https:; base-uri 'self'\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/*.html\n  Cache-Control: public, max-age=0, must-revalidate\n`);
write("_redirects", `# Old WordPress URLs keep working (same slugs). Add extra rules below if needed.\n/blog  /guides/  301\n/blog/  /guides/  301\n/index.html  /  301\n/contact  /contact-devis/  301\n/contact/  /contact-devis/  301\n/en/contact  /en/contact-quote/  301\n/en/contact/  /en/contact-quote/  301\n`);
console.log(`Built ${PAGES.length * 2 + 1} pages → ${DIST}${HAS_VIDEO ? " (with hero video)" : ENV.heroVideoUrl ? " (hero video from PF_HERO_VIDEO_URL)" : " (no hero video yet: still-image hero)"}`);
