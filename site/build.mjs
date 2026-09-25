// Static site generator for Miam's Resto Café (no dependencies).
//   node site/build.mjs   → writes site/dist/
// Content: site/src/content.mjs · Business facts: site/src/config.mjs · Menu: data/menu.json
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BIZ } from "./src/config.mjs";
import { UI, PAGES, FAQ } from "./src/content.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, "dist");
const menu = JSON.parse(readFileSync(join(here, "../data/menu.json"), "utf8"));
const UPDATED = "2026-09-25";
const LOCALE = { fr: "fr-CA", en: "en-CA" };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const price = (p, lang) => {
  const s = Number.isInteger(p) ? String(p) : p.toFixed(2);
  return lang === "fr" ? s.replace(".", ",") : s;
};
const pageBy = (key) => PAGES.find((p) => p.key === key);
const url = (path) => BIZ.url + path;
const addressLine = `${BIZ.street}, ${BIZ.city} (${BIZ.region}) ${BIZ.postal}`;

// ---------- Brand SVGs ----------
const LOGO = `<svg viewBox="0 0 250 72" role="img" aria-label="Miam's Resto Café"><text x="4" y="46" font-family="Fraunces, Georgia, serif" font-style="italic" font-weight="800" font-size="50" fill="#B8472A">Miam's</text><circle cx="73" cy="14" r="5.5" fill="#E9A23B"/><path d="M14 56 Q52 70 92 55" stroke="#B8472A" stroke-width="5" fill="none" stroke-linecap="round"/><text x="186" y="36" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="12.5" letter-spacing="2.5" fill="#26301F">RESTO</text><text x="186" y="53" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="12.5" letter-spacing="2.5" fill="#26301F">CAFÉ</text></svg>`;
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#B8472A"/><path d="M18 40V22l14 14 14-14v18" fill="none" stroke="#F6EEDF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 48q12 7 24 0" fill="none" stroke="#E9A23B" stroke-width="5" stroke-linecap="round"/></svg>`;
const HERO_ART = `<svg viewBox="0 0 400 400"><defs><pattern id="tile" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M20 4q8 8 0 16q-8-8 0-16zM20 20q8 8 0 16q-8-8 0-16zM4 20q8-8 16 0q-8 8-16 0zM20 20q8-8 16 0q-8 8-16 0z" fill="none" stroke="#B8472A" stroke-opacity=".18" stroke-width="1.2"/></pattern></defs><rect width="400" height="400" rx="200" fill="url(#tile)"/><circle cx="300" cy="90" r="48" fill="#E9A23B"/><g stroke="#E9A23B" stroke-width="6" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const r = (a * Math.PI) / 180; return `<line x1="${(300 + Math.cos(r) * 62).toFixed(1)}" y1="${(90 + Math.sin(r) * 62).toFixed(1)}" x2="${(300 + Math.cos(r) * 78).toFixed(1)}" y2="${(90 + Math.sin(r) * 78).toFixed(1)}"/>`; }).join("")}</g><rect x="318" y="228" width="70" height="20" rx="10" fill="#26301F"/><circle cx="200" cy="240" r="120" fill="#26301F"/><circle cx="200" cy="240" r="104" fill="#B8472A"/><circle cx="200" cy="240" r="104" fill="none" stroke="#9A3A21" stroke-width="6" stroke-dasharray="3 14"/><ellipse cx="165" cy="215" rx="34" ry="30" fill="#F6EEDF"/><circle cx="168" cy="213" r="14" fill="#E9A23B"/><ellipse cx="235" cy="265" rx="34" ry="30" fill="#F6EEDF"/><circle cx="232" cy="262" r="14" fill="#E9A23B"/><g fill="#8FA07E"><circle cx="240" cy="200" r="7"/><circle cx="252" cy="210" r="6"/><circle cx="150" cy="280" r="7"/><circle cx="138" cy="268" r="5"/><circle cx="205" cy="300" r="6"/></g><g fill="#F6EEDF" opacity=".85"><rect x="190" y="178" width="14" height="10" rx="3"/><rect x="262" y="236" width="12" height="9" rx="3"/><rect x="120" y="230" width="12" height="9" rx="3"/></g></svg>`;

// ---------- Components ----------
function hoursTable(lang) {
  const t = UI[lang];
  const order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const fmt = (h) => (lang === "fr" ? h.replace(":", " h ").replace(" h 00", " h").replace(/^0/, "") : h);
  const rows = order.map((d) => {
    const h = BIZ.hours.find((x) => x.days.includes(d));
    return `<tr data-day="${d}"><th scope="row">${t.days[d]}</th><td>${h ? `${fmt(h.opens)} – ${fmt(h.closes)}` : t.closed}</td></tr>`;
  });
  return `<h2 class="h-hours">${t.hoursTitle}</h2><table class="hours" data-hours='${esc(JSON.stringify(BIZ.hours))}'>${rows.join("")}</table>`;
}
const nap = (lang) => `<address class="nap"><strong>${esc(BIZ.name)}</strong><br>${esc(BIZ.street)}<br>${esc(BIZ.city)} (${BIZ.region}) ${esc(BIZ.postal)}<br><a href="tel:${BIZ.phone}" data-event="click_call">${BIZ.phoneDisplay}</a><br><a href="mailto:${BIZ.email}">${BIZ.email}</a></address>`;
const mapCard = (lang) => `<p><a class="btn btn-ghost" href="${BIZ.mapsUrl}" target="_blank" rel="noopener" data-event="click_directions">${lang === "fr" ? "Ouvrir dans Google Maps" : "Open in Google Maps"}</a></p>`;

function externalBtn(href, label, event, lang, cls = "btn") {
  if (href) return `<a class="${cls}" href="${href}" data-event="${event}" rel="noopener">${label}</a>`;
  return `<a class="${cls}" aria-disabled="true" title="${UI[lang].comingSoon}">${label} · ${UI[lang].comingSoon}</a>`;
}
const L = (lang, fr, en) => (lang === "fr" ? fr : en);

function signatures(lang) {
  const ids = ["shakshuka", "pain_perdu", "bol_poulet", "latte_miel_cardamome", "croissant_pistache", "planche_mezze"];
  return `<div class="sig-grid">${ids.map((id) => {
    const it = menu.items.find((i) => i.id === id);
    return `<article class="sig-card"><h3>${esc(it[lang])}</h3><p>${esc(it[`desc_${lang}`])}</p><span class="price">${price(it.price, lang)}</span></article>`;
  }).join("")}</div>`;
}

function badges(it, lang) {
  const b = [];
  if (it.tags.includes("signature")) b.push(`<span class="badge signature">★ ${menu.tags.signature[lang]}</span>`);
  if (it.tags.includes("vegan")) b.push(`<span class="badge vegan">${menu.tags.vegan[lang]}</span>`);
  else if (it.tags.includes("vegetarian")) b.push(`<span class="badge vegetarian">${menu.tags.vegetarian[lang]}</span>`);
  if (it.tags.includes("halal")) b.push(`<span class="badge halal">${menu.tags.halal[lang]}</span>`);
  if (it.tags.includes("spicy_mild")) b.push(`<span class="badge">🌶 ${menu.tags.spicy_mild[lang]}</span>`);
  if (it.tags.includes("no_gluten_ingredients")) b.push(`<span class="badge">${menu.tags.no_gluten_ingredients[lang]}</span>`);
  return b.join("");
}

function menuPage(lang) {
  const cats = menu.categories.filter((c) => c.id !== "traiteur");
  const visible = (it) => it.channels.dine_in || it.channels.takeout;
  const diets = [["vegan", menu.tags.vegan[lang]], ["vegetarian", menu.tags.vegetarian[lang]], ["halal", menu.tags.halal[lang]], ["no_gluten_ingredients", menu.tags.no_gluten_ingredients[lang]]];
  const allergenBtns = Object.entries(menu.allergens).map(([k, a]) => `<button type="button" class="chip" data-without="${k}" aria-pressed="false">${L(lang, "Sans", "No")} ${esc(a[lang].split(" (")[0].toLowerCase())}</button>`).join("");
  let h = `<div data-menu>
<h1 class="menu-title">${L(lang, "Le menu", "The menu")}</h1>
<p>${L(lang, "Commandez au comptoir, ou réservez et on vous sert à table le week-end.", "Order at the counter, or book and we'll serve you at your table on weekends.")} <a href="${L(lang, "/fr/commander/", "/en/order/")}">${L(lang, "Pour emporter : commandez en ligne.", "To go: order online.")}</a></p>
<div class="menu-tools">
  <input id="q" class="menu-search" type="search" aria-label="${L(lang, "Rechercher dans le menu", "Search the menu")}" placeholder="${L(lang, "Rechercher un plat, un ingrédient…", "Search a dish or ingredient…")}" autocomplete="off">
  <div class="chips" role="group" aria-label="${L(lang, "Régimes", "Diets")}">${diets.map(([k, v]) => `<button type="button" class="chip" data-diet="${k}" aria-pressed="false">${esc(v)}</button>`).join("")}</div>
  <details class="allergen-filter"><summary>${L(lang, "Masquer les plats contenant…", "Hide dishes containing…")}</summary><div class="allergen-grid">${allergenBtns}</div></details>
  <nav class="chips cat-nav" aria-label="${L(lang, "Catégories", "Categories")}">${cats.map((c) => `<a class="chip" href="#${c.id}">${esc(c[lang])}</a>`).join("")}</nav>
</div>`;
  for (const c of cats) {
    const its = menu.items.filter((i) => i.cat === c.id && visible(i));
    if (!its.length) continue;
    h += `<section class="menu-cat" id="${c.id}"><h2>${esc(c[lang])}</h2>${c[`note_${lang}`] ? `<p>${esc(c[`note_${lang}`])}</p>` : ""}<ul class="menu-list">`;
    for (const it of its) {
      const alg = it.allergens.map((a) => `<abbr class="alg" title="${esc(menu.allergens[a][lang])}">${menu.allergens[a].icon}</abbr>`).join("");
      h += `<li class="menu-item" id="item-${it.id}" data-tags="${it.tags.join(" ")}" data-allergens="${it.allergens.join(" ")}"><div class="mi-head"><h3>${esc(it[lang])}</h3><span class="price">${price(it.price, lang)}</span></div>${it[`desc_${lang}`] ? `<p class="mi-desc">${esc(it[`desc_${lang}`])}</p>` : ""}<div class="mi-meta">${badges(it, lang)}${alg}</div></li>`;
    }
    h += `</ul></section>`;
  }
  const key = Object.values(menu.allergens).map((a) => `<abbr class="alg">${a.icon}</abbr> ${esc(a[lang])}`).join(" · ");
  h += `<p class="menu-empty" hidden>${L(lang, "Aucun plat ne correspond. Demandez-nous : on peut souvent adapter.", "No dish matches. Ask us: we can often adapt.")}</p>
<div class="menu-legal"><p><strong>${L(lang, "Allergènes", "Allergens")} :</strong> ${key}</p><p>${esc(menu.meta[`allergen_note_${lang}`])}</p><p>${L(lang, "Notre poulet est certifié halal. Notre cuisine n'est pas exclusivement halal.", "Our chicken is halal-certified. Our kitchen is not exclusively halal.")} ${esc(menu.meta[`tax_note_${lang}`])}</p></div></div>`;
  return h;
}

function catering(lang) {
  const its = menu.items.filter((i) => i.cat === "traiteur");
  return `<ul class="catering-list">${its.map((it) => `<li><div><h3>${esc(it[lang])}</h3><p class="mi-desc">${esc(it[`desc_${lang}`])}</p></div><span class="price">${price(it.price, lang)}${it.id === "boite_bureau" ? L(lang, " / pers.", " / person") : ""}</span></li>`).join("")}
<li><div><h3>${L(lang, "Bols et pitas individuels", "Individual bowls & pitas")}</h3><p class="mi-desc">${L(lang, "Bol mezze, bol poulet chermoula, pita poulet, wrap falafel.", "Mezze bowl, chermoula chicken bowl, chicken pita, falafel wrap.")}</p></div><span class="price">15,5–20</span></li></ul>`;
}

const faqHtml = (lang) => `<div class="faq">${FAQ[lang].map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>`;

// ---------- Schema.org JSON-LD ----------
function restaurantSchema(lang) {
  const dayMap = { Monday: "Mo", Tuesday: "Tu", Wednesday: "We", Thursday: "Th", Friday: "Fr", Saturday: "Sa", Sunday: "Su" };
  return {
    "@context": "https://schema.org",
    "@type": ["Restaurant", "CafeOrCoffeeShop"],
    "@id": BIZ.url + "/#restaurant",
    name: BIZ.name,
    url: url(`/${lang}/`),
    image: [BIZ.url + "/assets/og.png"],
    logo: BIZ.url + "/assets/favicon.svg",
    telephone: BIZ.phone,
    email: BIZ.email,
    priceRange: BIZ.priceRange,
    servesCuisine: ["Mediterranean", "Brunch", "Café", "Middle Eastern"],
    address: { "@type": "PostalAddress", streetAddress: BIZ.street, addressLocality: BIZ.city, addressRegion: BIZ.region, postalCode: BIZ.postal, addressCountry: BIZ.country },
    geo: { "@type": "GeoCoordinates", latitude: BIZ.geo.lat, longitude: BIZ.geo.lng },
    openingHoursSpecification: BIZ.hours.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
    openingHours: BIZ.hours.map((h) => `${h.days.map((d) => dayMap[d]).join(",")} ${h.opens}-${h.closes}`),
    hasMenu: url(lang === "fr" ? "/fr/menu/" : "/en/menu/"),
    acceptsReservations: BIZ.reserveUrl ? BIZ.reserveUrl : "True",
    ...(BIZ.orderUrl ? { potentialAction: { "@type": "OrderAction", target: BIZ.orderUrl } } : {}),
    sameAs: [BIZ.instagram, BIZ.facebook, BIZ.tiktok],
    inLanguage: LOCALE[lang],
  };
}
function menuSchema(lang) {
  const cats = menu.categories.filter((c) => c.id !== "traiteur");
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${BIZ.name}: ${L(lang, "Menu", "Menu")}`,
    inLanguage: LOCALE[lang],
    hasMenuSection: cats.map((c) => ({
      "@type": "MenuSection",
      name: c[lang],
      hasMenuItem: menu.items.filter((i) => i.cat === c.id && !i.tags.includes("modifier")).map((i) => ({
        "@type": "MenuItem",
        name: i[lang],
        description: i[`desc_${lang}`] || undefined,
        offers: { "@type": "Offer", price: i.price.toFixed(2), priceCurrency: "CAD" },
        suitableForDiet: [i.tags.includes("vegan") && "https://schema.org/VeganDiet", (i.tags.includes("vegetarian") || i.tags.includes("vegan")) && "https://schema.org/VegetarianDiet", i.tags.includes("halal") && "https://schema.org/HalalDiet"].filter(Boolean),
      })),
    })),
  };
}
const faqSchema = (lang) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ[lang].map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
const crumbs = (lang, page) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: L(lang, "Accueil", "Home"), item: url(`/${lang}/`) }, { "@type": "ListItem", position: 2, name: page[lang].h1, item: url(page[lang].path) }] });

// ---------- Layout ----------
function layout(page, lang, body) {
  const t = UI[lang];
  const other = lang === "fr" ? "en" : "fr";
  const p = page[lang];
  const navKeys = [["menu", t.nav.menu], ["story", t.nav.story], ["catering", t.nav.catering], ["contact", t.nav.contact], ["order", t.nav.order]];
  const schemas = [];
  if (page.key === "home" || page.key === "contact") schemas.push(restaurantSchema(lang));
  if (page.key === "menu") schemas.push(menuSchema(lang), restaurantSchema(lang));
  if (page.key === "faq") schemas.push(faqSchema(lang));
  if (page.key !== "home") schemas.push(crumbs(lang, page));
  const legalKeys = ["privacy", "terms", "careers", "faq", "gift", "reviews"];
  return `<!doctype html>
<html lang="${LOCALE[lang]}"${BIZ.gtmId ? ` data-gtm="${BIZ.gtmId}"` : ""}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url(p.path)}">
<link rel="alternate" hreflang="fr-CA" href="${url(page.fr.path)}">
<link rel="alternate" hreflang="en-CA" href="${url(page.en.path)}">
<link rel="alternate" hreflang="x-default" href="${url(page.fr.path)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(BIZ.name)}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url(p.path)}">
<meta property="og:locale" content="${LOCALE[lang].replace("-", "_")}">
<meta property="og:image" content="${BIZ.url}/assets/og.png">
<meta name="theme-color" content="#B8472A">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Fraunces:ital,opsz,wght,SOFT@0,9..144,600..800,80;1,9..144,800,80&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/styles.css">
${schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n")}
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
<header class="site-header"><div class="header-inner">
  <a class="logo" href="/${lang}/" aria-label="${esc(BIZ.name)}">${LOGO}</a>
  <button class="menu-toggle" aria-expanded="false" aria-controls="nav">Menu ☰</button>
  <nav id="nav" class="nav" aria-label="${L(lang, "Navigation principale", "Main navigation")}">
    ${navKeys.map(([k, label]) => `<a href="${pageBy(k)[lang].path}"${k === page.key ? ' aria-current="page"' : ""}>${label}</a>`).join("\n    ")}
    <a class="btn" href="${pageBy("book")[lang].path}" data-event="click_book_nav">${t.nav.book}</a>
    <a class="lang" href="${page[other].path}" hreflang="${LOCALE[other]}" lang="${LOCALE[other]}">${t.langSwitch}</a>
  </nav>
</div></header>
<main id="main">
${body}
</main>
<footer class="site-footer"><div class="footer-inner">
  <div><h2>Miam's Resto Café</h2>${nap(lang)}<p class="signoff" style="color:var(--safran)">${t.tagline}</p></div>
  <div>${hoursTable(lang)}<div class="social"><a href="${BIZ.instagram}" rel="noopener">Instagram</a><a href="${BIZ.facebook}" rel="noopener">Facebook</a><a href="${BIZ.tiktok}" rel="noopener">TikTok</a></div></div>
  <form class="newsletter" ${BIZ.newsletterAction ? `action="${BIZ.newsletterAction}" method="post"` : 'onsubmit="return false"'}>
    <h2>${t.newsletterTitle}</h2><p>${t.newsletterText}</p>
    <input id="nl-${lang}" type="email" aria-label="${t.newsletterEmail}" name="email" required placeholder="${t.newsletterEmail}" autocomplete="email">
    <input type="hidden" name="language" value="${lang}">
    <label><input type="checkbox" name="consent" required> ${t.newsletterConsent}</label>
    <button class="btn" type="submit" data-event="newsletter_signup">${t.newsletterBtn}</button>
  </form>
  <div class="footer-legal">${legalKeys.map((k, i) => `<a href="${pageBy(k)[lang].path}">${t.footerLegal[i]}</a>`).join("")}<span>© ${UPDATED.slice(0, 4)} ${esc(BIZ.name)}</span></div>
</div></footer>
${BIZ.gtmId ? `<div class="consent" role="dialog" aria-live="polite" aria-label="Cookies"><p>${t.cookieText} <a href="${pageBy("privacy")[lang].path}">${t.cookieLink}</a></p><button class="btn" data-consent="yes">${t.cookieAccept}</button><button class="btn btn-ghost" data-consent="no">${t.cookieDecline}</button></div>` : ""}
<script src="/assets/site.js" defer></script>
${page.key === "menu" ? '<script src="/assets/menu.js" defer></script>' : ""}
</body>
</html>
`;
}

function render(page, lang) {
  const p = page[lang];
  const blocks = {
    MENU: () => menuPage(lang),
    HOURS: () => hoursTable(lang),
    NAP: () => nap(lang),
    MAP: () => mapCard(lang),
    FAQ: () => faqHtml(lang),
    CATERING: () => catering(lang),
    SIGNATURES: () => signatures(lang),
    HERO_ART: () => HERO_ART,
    OPEN_NOW: () => `<p class="open-now" hidden></p>`,
    NEIGHBOURHOOD: () => esc(BIZ.neighbourhood[lang]),
    BTN_BOOK: () => externalBtn(BIZ.reserveUrl || pageBy("book")[lang].path, L(lang, "Réserver le brunch", "Book brunch"), "click_book", lang),
    BTN_ORDER: () => externalBtn(BIZ.orderUrl || pageBy("order")[lang].path, L(lang, "Commander pour emporter", "Order for pickup"), "click_order", lang, "btn btn-ghost"),
    ORDER_BLOCK: () => `<p>${externalBtn(BIZ.orderUrl, L(lang, "Commander maintenant", "Order now"), "click_order", lang)} <a class="btn btn-ghost" href="tel:${BIZ.phone}" data-event="click_call">${UI[lang].callUs}</a></p>`,
    BOOK_BLOCK: () => `<p>${externalBtn(BIZ.reserveUrl, L(lang, "Choisir ma table", "Pick my table"), "click_book", lang)} <a class="btn btn-ghost" href="tel:${BIZ.phone}" data-event="click_call">${UI[lang].callUs}</a></p>`,
    GIFT_BLOCK: () => `<p>${externalBtn(BIZ.giftCardUrl, L(lang, "Acheter une carte-cadeau", "Buy a gift card"), "click_giftcard", lang)}</p>`,
    REVIEW_BLOCK: () => `<p>${externalBtn(BIZ.googleReviewUrl, L(lang, "Laisser un avis Google", "Leave a Google review"), "click_review", lang)}</p>`,
    EMAIL: () => BIZ.email,
    PHONE: () => BIZ.phone,
    PHONE_DISPLAY: () => BIZ.phoneDisplay,
    MAPS_URL: () => BIZ.mapsUrl,
    UPDATED: () => UPDATED,
    ADDRESS_LINE: () => esc(addressLine),
  };
  const body = p.body.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (blocks[k] ? blocks[k]() : m));
  return layout(page, lang, body);
}

// ---------- Write ----------
rmSync(DIST, { recursive: true, force: true });
const write = (rel, content) => {
  const f = join(DIST, rel);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, content);
};
for (const page of PAGES) for (const lang of ["fr", "en"]) write(page[lang].path.replace(/^\//, "") + "index.html", render(page, lang));

write("assets/styles.css", readFileSync(join(here, "src/styles.css"), "utf8"));
write("assets/site.js", readFileSync(join(here, "src/site.js"), "utf8"));
write("assets/menu.js", readFileSync(join(here, "src/menu.js"), "utf8"));
write("assets/favicon.svg", FAVICON);
copyFileSync(join(here, "src/og.png"), join(DIST, "assets/og.png"));
write("assets/menu.json", JSON.stringify(menu));
write("screens/board.html", readFileSync(join(here, "src/board.html"), "utf8"));

// Language router: French by default (French-first), English if the browser prefers it.
write("index.html", `<!doctype html><html lang="fr-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(BIZ.name)}</title>
<link rel="canonical" href="${url("/fr/")}"><link rel="alternate" hreflang="fr-CA" href="${url("/fr/")}"><link rel="alternate" hreflang="en-CA" href="${url("/en/")}"><link rel="alternate" hreflang="x-default" href="${url("/fr/")}">
<script>var l=(navigator.languages||[navigator.language||"fr"])[0]||"fr";location.replace(/^en/i.test(l)?"/en/":"/fr/");</script>
<meta http-equiv="refresh" content="2;url=/fr/"></head><body style="font-family:system-ui;background:#F6EEDF;color:#26301F;text-align:center;padding:3rem"><p><a href="/fr/">Français</a> · <a href="/en/">English</a></p></body></html>`);

write("404.html", `<!doctype html><html lang="fr-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Oups · 404 · Miam's</title><link rel="stylesheet" href="/assets/styles.css"><meta name="robots" content="noindex"></head><body><main class="narrow" style="padding:4rem 16px;text-align:center"><h1>Oups, cette page a été mangée.</h1><p>This page got eaten.</p><p><a class="btn" href="/fr/menu/">Voir le menu</a> <a class="btn btn-ghost" href="/en/menu/">See the menu</a></p></main></body></html>`);

write("manifest.webmanifest", JSON.stringify({ name: BIZ.name, short_name: "Miam's", start_url: "/fr/", display: "standalone", background_color: "#F6EEDF", theme_color: "#B8472A", icons: [{ src: "/assets/favicon.svg", sizes: "any", type: "image/svg+xml" }] }, null, 2));

write("robots.txt", `User-agent: *\nAllow: /\nDisallow: /screens/\n\nSitemap: ${url("/sitemap.xml")}\n`);

const sm = PAGES.flatMap((page) => ["fr", "en"].map((lang) => `  <url><loc>${url(page[lang].path)}</loc><lastmod>${UPDATED}</lastmod>
    <xhtml:link rel="alternate" hreflang="fr-CA" href="${url(page.fr.path)}"/>
    <xhtml:link rel="alternate" hreflang="en-CA" href="${url(page.en.path)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${url(page.fr.path)}"/>
  </url>`));
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sm.join("\n")}\n</urlset>\n`);

// Short QR links (Phase 4): printed codes point to /m/<placement>. Change a destination here, not on the print.
const QR = {
  table: "/fr/menu/?utm_source=qr&utm_medium=print&utm_campaign=menu&utm_content=table",
  window: "/fr/menu/?utm_source=qr&utm_medium=print&utm_campaign=menu&utm_content=window",
  receipt: "/fr/avis/?utm_source=qr&utm_medium=print&utm_campaign=reviews&utm_content=receipt",
  bag: "/fr/commander/?utm_source=qr&utm_medium=print&utm_campaign=direct&utm_content=bag",
  delivery: "/fr/commander/?utm_source=qr&utm_medium=print&utm_campaign=channel_shift&utm_content=delivery_insert",
  flyer: "/fr/commander/?utm_source=qr&utm_medium=print&utm_campaign=direct&utm_content=flyer",
  book: "/fr/reserver/?utm_source=qr&utm_medium=print&utm_campaign=booking&utm_content=window",
  loyalty: "/fr/?utm_source=qr&utm_medium=print&utm_campaign=loyalty&utm_content=cup_sleeve",
  catering: "/fr/traiteur/?utm_source=qr&utm_medium=print&utm_campaign=catering&utm_content=flyer",
};
write("_redirects", Object.entries(QR).map(([k, v]) => `/m/${k}  ${v}  302`).join("\n") + "\n");
write("_headers", `/assets/*\n  Cache-Control: public, max-age=86400\n/assets/menu.json\n  Cache-Control: no-cache\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`);

console.log(`Built ${PAGES.length * 2} pages + board, sitemap, robots, redirects → site/dist`);
