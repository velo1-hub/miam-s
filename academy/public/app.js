// The 1% — application monopage (sans dépendance). Routes publiques, espace étudiant, lecteur, quiz, paiement.
import { renderAdmin } from "/admin.js";

export const state = { user: null, config: { brand: "The 1%", stripe: false }, menuOpen: false };
export const $ = (sel, root = document) => root.querySelector(sel);
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const money = (cents, cur = "USD") => new Intl.NumberFormat("fr-CA", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(cents / 100);
export const fmtDate = (iso) => (iso ? new Date(iso.includes("T") ? iso : iso + "Z").toLocaleDateString("fr-CA", { year: "numeric", month: "short", day: "numeric" }) : "—");
export const hours = (min) => (min >= 60 ? `${Math.floor(min / 60)} h ${min % 60 ? String(min % 60).padStart(2, "0") : ""}`.trim() : `${min} min`);

export async function api(path, { method = "GET", body, raw } = {}) {
  const opts = { method, headers: { "X-Requested-With": "the1percent" }, credentials: "same-origin" };
  if (body !== undefined && !raw) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
  if (raw) opts.body = raw;
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}
export function toast(msg, err = false) {
  const t = $("#toast"); t.textContent = msg; t.className = `toast show${err ? " err" : ""}`;
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.className = "toast"), 3500);
}
export function navigate(path) { history.pushState({}, "", path); render(); }
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || a.target === "_blank" || a.hasAttribute("download") || a.origin !== location.origin || a.getAttribute("href").startsWith("#")) return;
  if (a.pathname.startsWith("/media/") || a.pathname.startsWith("/certificat/") || a.pathname.startsWith("/api/")) return;
  e.preventDefault(); state.menuOpen = false; navigate(a.pathname + a.search);
});
window.addEventListener("popstate", render);

// ---------- Markdown minimal (titres, listes, tableaux, citations, gras, italique, liens, code) ----------
export function md(src) {
  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => /^(https?:\/\/|\/|#)/.test(u) ? `<a href="${u}" ${u.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${t}</a>` : t);
  const lines = src.replace(/\r/g, "").split("\n");
  let out = "", i = 0;
  const flushP = (buf) => (buf.length ? `<p>${inline(buf.join(" "))}</p>` : "");
  let p = [];
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*$/.test(l)) { out += flushP(p); p = []; i++; continue; }
    const h = /^(#{1,4})\s+(.*)/.exec(l);
    if (h) { out += flushP(p); p = []; out += `<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`; i++; continue; }
    if (/^\s*>\s?/.test(l)) { out += flushP(p); p = []; const b = []; while (i < lines.length && /^\s*>\s?/.test(lines[i])) b.push(lines[i].replace(/^\s*>\s?/, "")), i++; out += `<blockquote><p>${inline(b.join(" "))}</p></blockquote>`; continue; }
    if (/^\s*\|/.test(l)) {
      out += flushP(p); p = []; const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i]), i++;
      const cells = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(rows[0]); const body = rows.slice(1).filter((r) => !/^\s*\|?\s*:?-{2,}/.test(r));
      out += `<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      continue;
    }
    if (/^\s*(\d+)\.\s+/.test(l)) { out += flushP(p); p = []; const items = []; while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) items.push(lines[i].replace(/^\s*\d+\.\s+/, "")), i++; out += `<ol>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</ol>`; continue; }
    if (/^\s*[-*]\s+/.test(l)) { out += flushP(p); p = []; const items = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i].replace(/^\s*[-*]\s+/, "")), i++; out += `<ul>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</ul>`; continue; }
    p.push(l); i++;
  }
  return out + flushP(p);
}

// ---------- Mise en page ----------
function topbar() {
  const u = state.user;
  const path = location.pathname;
  const link = (href, label) => `<a href="${href}" class="${path === href || (href !== "/" && path.startsWith(href)) ? "active" : ""}">${label}</a>`;
  $("#topbar").innerHTML = `<div class="wrap">
    <a class="brand" href="/"><span class="logo-mark">1%</span><span>The 1%</span></a>
    <button class="menu-btn" aria-label="Menu" id="menuBtn">☰</button>
    <nav class="nav ${state.menuOpen ? "open" : ""}">
      ${link("/formations", "Formations")}
      ${link("/offre", "L'offre")}
      ${u ? link("/tableau-de-bord", "Mon espace") : ""}
      ${u?.role === "admin" ? link("/admin", "Administration") : ""}
      ${u ? `<a href="/profil">${esc(u.name.split(" ")[0])}</a><a href="#" id="logout">Se déconnecter</a>` : `${link("/connexion", "Connexion")}<a class="btn btn-gold btn-sm" href="/formation/the-1-percent">Rejoindre The 1%</a>`}
    </nav></div>`;
  $("#menuBtn").onclick = () => { state.menuOpen = !state.menuOpen; topbar(); };
  const lo = $("#logout"); if (lo) lo.onclick = async (e) => { e.preventDefault(); await api("/api/auth/logout", { method: "POST" }); state.user = null; toast("À bientôt."); navigate("/"); };
}
function footer() {
  const c = state.config;
  $("#footer").innerHTML = `<div class="wrap">
    <div><a class="brand" href="/" style="margin-bottom:12px"><span class="logo-mark">1%</span><span>The 1%</span></a><p class="muted small" style="max-width:320px">${esc(c.tagline || "L'académie e-commerce de ceux qui exécutent. Programme élite de 12 semaines avec coaching individuel jusqu'au résultat.")}</p>${c.supportEmail ? `<a href="mailto:${esc(c.supportEmail)}">${esc(c.supportEmail)}</a>` : ""}</div>
    <div><h5>Programme</h5><a href="/formation/the-1-percent">The 1% — Programme Élite</a><a href="/formation/masterclass-7-piliers">Masterclass gratuite</a><a href="/offre">L'offre et les versements</a><a href="/formations">Toutes les formations</a></div>
    <div><h5>Compte</h5><a href="/connexion">Connexion</a><a href="/inscription">Créer un compte</a><a href="/tableau-de-bord">Mon espace</a></div>
    <div><h5>Confiance</h5><a href="/conditions">Conditions et garantie</a><a href="/confidentialite">Confidentialité</a><a href="/offre#faq">Questions fréquentes</a>${c.bitcoin ? '<span class="badge" style="margin-top:4px">₿ Paiement Bitcoin accepté</span>' : ""}</div>
    <div class="legal">© ${new Date().getFullYear()} The 1%${c.companyLegal ? " · " + esc(c.companyLegal) : ""}${c.companyAddress ? " · " + esc(c.companyAddress) : ""}. Les études de cas présentées sont celles de membres et ne garantissent pas vos résultats. Tous les prix sont en dollars américains, taxes incluses lorsque applicables.</div>
  </div>`;
  $("#footer").className = "footer footer-v2";
}
const main = (html) => { $("#main").innerHTML = html; window.scrollTo({ top: 0 }); };
const loading = () => main(`<div class="wrap section-tight muted">Chargement…</div>`);
export const errorPage = (e) => main(`<div class="wrap section"><div class="empty">${esc(e.message || e)}</div></div>`);

// ---------- Routes ----------
const routes = [
  ["/", home], ["/formations", catalogue], ["/formation/:slug", coursePage], ["/offre", offerPage],
  ["/connexion", login], ["/inscription", register], ["/mot-de-passe-oublie", forgot], ["/reinitialiser/:token", resetPw],
  ["/tableau-de-bord", dashboard], ["/profil", profile],
  ["/apprendre/:slug", learn], ["/apprendre/:slug/lecon/:id", learn], ["/quiz/:id", quizPage],
  ["/paiement/simulation", paySimulation], ["/paiement/succes", paySuccess], ["/paiement/bitcoin", bitcoinPay],
  ["/conditions", terms], ["/confidentialite", privacy],
  ["/admin", renderAdmin], ["/admin/:section", renderAdmin], ["/admin/:section/:id", renderAdmin],
];
export async function render() {
  topbar(); footer();
  const path = location.pathname.replace(/\/+$/, "") || "/";
  for (const [pattern, fn] of routes) {
    const re = new RegExp("^" + pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$");
    const m = re.exec(path);
    if (m) { try { await fn(Object.fromEntries(Object.entries(m.groups || {}).map(([k, v]) => [k, decodeURIComponent(v)]))); } catch (e) { errorPage(e); } return; }
  }
  main(`<div class="wrap section center"><h1>404</h1><p class="muted">Page introuvable.</p><a class="btn btn-ghost" href="/">Retour à l'accueil</a></div>`);
}

// ---------- Accueil ----------
async function home() {
  loading();
  const courses = await api("/api/courses");
  const flag = courses.find((c) => c.slug === "the-1-percent") || courses[0];
  const free = courses.find((c) => c.price_cents === 0);
  const outline = flag ? await api(`/api/courses/${flag.slug}`) : null;
  const cfg = state.config;
  const covers = ["method", "store", "logistics", "box", "store", "finance", "ads", "ads", "ads", "community", "finance", "coaching", "method", "certificate"];
  main(`
<section class="hero-v2"><div class="bg"><img src="/img/hero.webp" alt="" loading="eager"></div><div class="wrap">
  <div>
    <div class="kicker"><i></i> Programme élite e-commerce · 12 semaines</div>
    <h1>Rejoignez le <em>1 %</em> des boutiques qui sont réellement rentables.</h1>
    <p class="lead">Un système d'exécution complet, du choix du produit à la vente de la marque, avec un coach jusqu'au résultat. ${outline?.modules || 14} modules, ${outline?.lessons || 63} leçons, révision de votre boutique et de vos campagnes, communauté privée et certificat vérifiable.</p>
    <div class="cta"><a class="btn btn-gold btn-lg" href="/formation/${esc(flag?.slug || "")}#inscription">Rejoindre The 1%</a>${free ? `<a class="btn btn-ghost btn-lg" href="/formation/${esc(free.slug)}">Masterclass gratuite</a>` : ""}</div>
    <div class="proof"><div><b>${outline?.modules || 14}</b>modules</div><div><b>${outline?.lessons || 63}</b>leçons</div><div><b>${hours(outline?.minutes || 1183)}</b>de vidéo</div><div><b>6</b>appels individuels</div><div><b>60+</b>gabarits</div></div>
  </div>
  ${flag ? offerCard(flag) : ""}
</div></section>

<section class="trust-band"><div class="wrap">
  <div class="t"><span class="ic">✓</span><div><b>Garantie d'exécution</b>Coaching prolongé gratuitement jusqu'à vos 10 premières ventes</div></div>
  <div class="t"><span class="ic">◆</span><div><b>Certificat vérifiable</b>Code public de vérification pour chaque diplômé</div></div>
  <div class="t"><span class="ic">${cfg.bitcoin ? "₿" : "▣"}</span><div><b>${cfg.bitcoin ? "Paiement Bitcoin" : "Paiement sécurisé"}</b>${cfg.bitcoin ? "Facture en BTC, vérification automatique sur la blockchain" : "Via Stripe, 3 versements possibles"}${cfg.bitcoin && cfg.methods?.includes("card") ? " · carte acceptée" : ""}</div></div>
  <div class="t"><span class="ic">∞</span><div><b>Accès à vie</b>Mises à jour du programme et communauté Alumni incluses</div></div>
</div></section>

<section class="section"><div class="wrap split">
  <div>
    <div class="eyebrow">Pour qui</div>
    <h2>Ce programme n'est pas pour tout le monde.</h2>
    <p class="muted">Il est conçu pour les personnes qui veulent une marque e-commerce rentable en 12 semaines, pas « un revenu passif ». Vous bloquez 90 minutes par jour, vous disposez de 2 000 à 3 500 $ de capital de travail et vous acceptez de montrer vos chiffres à un coach.</p>
    <ul class="tick-list">
      <li>Vous voulez bâtir un actif : marque déposée, procédures, équipe, et non une boutique jetable.</li>
      <li>Vous êtes prêt à couper un produit qui ne passe pas le test, même si vous l'aimez.</li>
      <li>Vous préférez un système et des chiffres aux promesses.</li>
    </ul>
  </div>
  <div class="photo"><img src="/img/coaching.webp" alt="Espace de coaching privé" loading="lazy"><span class="cap">Coaching individuel</span></div>
</div></section>

<section class="section" style="background:var(--bg-2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)"><div class="wrap">
  <div class="split rev">
    <div class="photo wide"><img src="/img/method.webp" alt="Les trois paliers de la méthode" loading="lazy"><span class="cap">La méthode</span></div>
    <div>
      <div class="eyebrow">La méthode</div>
      <h2>Trois paliers. Vous ne passez au suivant que lorsque les chiffres le confirment.</h2>
      <p class="muted">Chaque palier a sa liste de contrôle, ses indicateurs et sa revue avec un coach.</p>
    </div>
  </div>
  <div class="steps-h" style="margin-top:40px">
    <div class="s"><b>01</b><h4>Preuve · semaines 1 à 6</h4><p class="muted small" style="margin:0">Grille de sélection à 12 critères, fournisseur et coût rendu, boutique révisée sur 60 points, test publicitaire à budget fixe. Objectif : 10 premières ventes payées par des inconnus.</p></div>
    <div class="s"><b>02</b><h4>Rentabilité · semaines 6 à 10</h4><p class="muted small" style="margin:0">CPA inférieur à la marge brute pendant 14 jours, flux courriel et SMS, compte de résultat hebdomadaire, plan de trésorerie, CPA maximal connu.</p></div>
    <div class="s"><b>03</b><h4>Échelle · semaines 10 à 12 et après</h4><p class="muted small" style="margin:0">Scaling vertical et horizontal, usine à créatifs, TikTok et Google, gamme, premières embauches, international, marque prête à être vendue.</p></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="eyebrow">Le programme</div>
  <h2>${outline?.modules || 14} modules, ${outline?.lessons || 63} leçons, chacune avec un livrable.</h2>
  <p class="muted" style="max-width:720px">Chaque leçon se termine par une action révisée par un coach. Chaque module se termine par un quiz. L'examen final émet votre certificat vérifiable.</p>
  <div class="module-grid" style="margin-top:28px">${(outline?.modulesList || []).map((m, i) => `<a class="module-card" href="/formation/${esc(flag.slug)}" style="color:inherit;text-decoration:none"><div class="ph"><img src="/img/${covers[i % covers.length]}.webp" alt="" loading="lazy"><span class="n">${String(i + 1).padStart(2, "0")}</span></div><div class="bd"><h4>${esc(m.title.replace(/^Module \d+ — /, ""))}</h4><p>${esc(m.summary)}</p><div class="meta">${m.lessons.length} leçons · ${hours(m.lessons.reduce((s, l) => s + l.duration_min, 0))}${m.quiz ? " · quiz" : ""}</div></div></a>`).join("")}</div>
</div></section>

<section class="section" style="background:var(--bg-2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)"><div class="wrap">
  <div class="eyebrow">Ce qui est inclus</div>
  <h2>Tout est compris dans les ${money(flag?.price_cents || 2000000, flag?.currency || "USD")}. Aucun frais caché.</h2>
  <div class="grid grid-3" style="margin-top:28px">
    <div class="img-card"><div class="ph"><img src="/img/coaching.webp" alt="" loading="lazy"></div><div class="bd"><h4>Coaching individuel</h4><p class="muted small" style="margin:0">6 appels d'une heure sur 12 semaines avec un coach qui a opéré une marque à 7 chiffres, plus un appel de groupe chaque semaine.</p></div></div>
    <div class="img-card"><div class="ph"><img src="/img/community.webp" alt="" loading="lazy"></div><div class="bd"><h4>Communauté privée et partenaires</h4><p class="muted small" style="margin:0">Revue hebdomadaire des chiffres, réseau d'agents de sourcing, 3PL, créateurs UGC, comptables et avocats avec conditions préférentielles.</p></div></div>
    <div class="img-card"><div class="ph"><img src="/img/certificate.webp" alt="" loading="lazy"></div><div class="bd"><h4>Certificat vérifiable</h4><p class="muted small" style="margin:0">Émis après les 14 quiz et l'examen final, avec une page de vérification publique que vos partenaires peuvent consulter.</p></div></div>
  </div>
  <div class="grid grid-3" style="margin-top:18px">${(flag?.includes || []).slice(3).map((x) => `<div class="card"><h4>${esc(x.title)}</h4><p class="muted small" style="margin:0">${esc(x.detail)}</p></div>`).join("")}</div>
</div></section>

<section class="section"><div class="wrap">
  <div class="guarantee"><div class="seal">GARANTIE<br>D'EXÉCUTION</div><div><h3 style="margin-bottom:6px">Si vous exécutez et que les ventes ne viennent pas, nous continuons gratuitement.</h3><p class="muted" style="margin:0">Complétez les 14 modules, livrez chaque action et assistez aux appels : si vous n'obtenez pas vos 10 premières ventes en 12 semaines, le coaching est prolongé sans frais jusqu'à ce que vous les obteniez. Les conditions complètes sont publiées dans nos <a href="/conditions">conditions</a>.</p></div></div>
</div></section>

${cfg.founder ? `<section class="section" style="background:var(--bg-2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)"><div class="wrap founder">
  <div class="photo sq"><img src="/img/box.webp" alt="" loading="lazy"><span class="cap">The 1%</span></div>
  <div><div class="eyebrow">Qui est derrière The 1%</div><h2>${esc(cfg.founder)}</h2><div class="prose">${md(cfg.founderBio || "")}</div><div class="sig">${esc(cfg.founder)}</div></div>
</div></section>` : ""}

<section class="section"><div class="wrap">
  <div class="eyebrow">Études de cas</div>
  <h2>Des chiffres, pas des promesses.</h2>
  <div class="grid grid-3" style="margin-top:28px">
    <div class="img-card"><div class="ph"><img src="/img/store.webp" alt="" loading="lazy"></div><div class="bd"><span class="badge badge-gold">Luminothérapie</span><p class="quote" style="font-size:18px;margin:10px 0 6px">« Grille 49/60, CPA de test 19 $, profit par commande 24 $. Marque privée dès la semaine 8. »</p><p class="muted small" style="margin:0">38 000 $ de ventes le quatrième mois. Détails au module 2.</p></div></div>
    <div class="img-card"><div class="ph"><img src="/img/ads.webp" alt="" loading="lazy"></div><div class="bd"><span class="badge badge-gold">Tapis d'acupression</span><p class="quote" style="font-size:18px;margin:10px 0 6px">« De 50 $ à 1 800 $ de publicité par jour en 31 jours, MER 3,1. »</p><p class="muted small" style="margin:0">Profit net mensuel d'environ 19 000 $. Chronologie au module 7.</p></div></div>
    <div class="img-card"><div class="ph"><img src="/img/logistics.webp" alt="" loading="lazy"></div><div class="bd"><span class="badge badge-gold">Brosse lissante · TikTok</span><p class="quote" style="font-size:18px;margin:10px 0 6px">« 14 créateurs, 38 vidéos, 6 succès. 121 000 $ en 90 jours. »</p><p class="muted small" style="margin:0">34 % des ventes par affiliation TikTok Shop. Détails au module 8.</p></div></div>
  </div>
  <p class="dim small" style="margin-top:16px">Études de cas de membres, documentées dans les leçons. Vos résultats dépendent de votre produit, de votre capital et de votre exécution.</p>
</div></section>

${cfg.bitcoin ? `<section class="section" style="background:var(--bg-2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)"><div class="wrap split">
  <div><div class="eyebrow">Paiement</div><h2>Payez en Bitcoin, accès immédiat.</h2><p class="muted">Choisissez Bitcoin à l'inscription : une facture à montant fixe en BTC est générée, vous la réglez depuis n'importe quel portefeuille, et votre accès s'ouvre dès que la transaction est détectée sur la blockchain. Le plan en 3 versements s'applique aussi en Bitcoin.${cfg.methods?.includes("card") ? " La carte bancaire reste disponible via Stripe." : ""}</p><a class="btn btn-ghost" href="/offre">Voir les modalités</a></div>
  <div class="photo"><img src="/img/bitcoin.webp" alt="Paiement en Bitcoin" loading="lazy"><span class="cap">Bitcoin accepté</span></div>
</div></section>` : ""}

<section class="section"><div class="wrap">
  <div class="eyebrow">Questions fréquentes</div>
  <h2>Avant de vous décider.</h2>
  <div style="margin-top:24px;max-width:860px">${faq().map(([q, a]) => `<details><summary>${esc(q)}</summary><div class="inner">${a}</div></details>`).join("")}</div>
</div></section>

<section class="section"><div class="wrap"><div class="cta-band">
  <div class="eyebrow">Prochaine étape</div>
  <h2>Rejoignez The 1 %.</h2>
  <p class="muted" style="max-width:600px;margin:0 auto 24px">${money(flag?.price_cents || 2000000, flag?.currency || "USD")} tout inclus, payable en 3 versements (5 000 $ à l'inscription, 5 000 $ à 30 jours, 10 000 $ à 60 jours)${cfg.bitcoin ? ", en Bitcoin" + (cfg.methods?.includes("card") ? " ou par carte" : "") : ""}. Accès immédiat au premier versement.</p>
  <a class="btn btn-gold btn-lg" href="/formation/${esc(flag?.slug || "")}#inscription">Voir l'offre complète</a>
</div></div></section>`);
  revealOnScroll();
}
function revealOnScroll() {
  const els = document.querySelectorAll(".section .wrap > *, .trust-band .t");
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .08 });
  els.forEach((el) => { el.classList.add("reveal"); io.observe(el); });
}

function faq() {
  return [
    ["Est-ce que 20 000 $ est vraiment tout inclus ?", "Oui. Le prix couvre les 14 modules, les 6 appels individuels, les appels de groupe, les révisions de boutique et de campagne, la communauté, les gabarits, l'annuaire de partenaires, le certificat et le programme Alumni. Il n'y a ni abonnement, ni frais de plateforme, ni module payant supplémentaire. Les seuls coûts hors programme sont ceux de votre propre entreprise (Shopify, échantillons, budget publicitaire), détaillés en toute transparence au module 1."],
    ["Comment fonctionne le plan en 3 versements ?", "5 000 $ à l'inscription (accès immédiat à tout le programme), 5 000 $ 30 jours plus tard, 10 000 $ 60 jours après l'inscription. Chaque versement se règle en Bitcoin (facture à montant fixe, vérification automatique) ou par carte via Stripe lorsque cette option est activée. Vous pouvez aussi payer les 20 000 $ en une fois."],
    ["Comment se passe le paiement en Bitcoin ?", "À l'inscription, une facture indique le montant exact en BTC (calculé au taux du moment et figé pendant 1 heure) et une adresse de réception avec code QR. Vous payez depuis n'importe quel portefeuille. La plateforme surveille la blockchain et ouvre votre accès dès que la transaction est détectée, en général en moins d'une heure. Les frais de réseau sont à la charge de l'expéditeur. Conservez votre identifiant de transaction : il figure sur votre reçu."],
    ["Combien de temps dois-je consacrer ?", "90 minutes par jour, 5 jours par semaine, pendant 12 semaines, plus un appel de groupe hebdomadaire et deux appels individuels par mois. Vous gardez l'accès à vie et vous pouvez avancer plus lentement, mais le coaching est calibré sur 12 semaines."],
    ["Quel budget faut-il en plus pour lancer ma boutique ?", "Prévoyez 2 000 à 3 500 $ : Shopify et applications, échantillons, contenu UGC et 3 tests publicitaires de 300 à 500 $. Le module 2 présente aussi les modèles à faible capital (précommande, impression à la demande, produits numériques)."],
    ["Quelle est la garantie ?", "Garantie d'exécution : si vous complétez les 14 modules, livrez chaque action et n'obtenez pas vos 10 premières ventes en 12 semaines, nous prolongeons le coaching gratuitement jusqu'à ce que vous les obteniez. La garantie est conditionnelle à l'exécution, pas au résultat seul : nous ne pouvons pas exécuter à votre place."],
    ["Est-ce adapté au Québec et au Canada ?", "Le programme est conçu pour le marché canadien et américain : TPS/TVQ/TVH, Loi 25, LCAP, incorporation au Québec, 3PL à Toronto et Montréal, expansion aux États-Unis. Le contenu est en français."],
    ["Je n'ai jamais rien vendu en ligne. Est-ce trop avancé ?", "Non. Le module 1 part de zéro (comptes, outils, budget) et chaque leçon a un livrable précis. En revanche, le rythme est exigeant."],
    ["Le certificat a-t-il une valeur ?", "Il atteste que vous avez complété les 63 leçons, les 14 quiz et l'examen final (75 % requis). Il est vérifiable publiquement par son code, et nos partenaires (3PL, agences, créateurs) offrent des conditions préférentielles aux diplômés."],
  ];
}

export function offerCard(c, { compact = false } = {}) {
  const plan = c.plan;
  const enrolled = c.enrolled;
  return `<div class="card card-gold offer-card">
    <span class="ribbon">Tout inclus</span>
    <div class="eyebrow">${esc(c.title.replace(/^The 1% — /, ""))}</div>
    <div class="price">${money(c.price_cents, c.currency)} <small>${esc(c.currency)} · tout inclus</small></div>
    ${plan ? `<div class="plan"><div style="color:var(--gold-2);font-weight:600">${esc(plan.label)}</div>${plan.installments.map((i) => `<div><span>${esc(i.label)}</span><b>${money(i.amount_cents, c.currency)}</b></div>`).join("")}</div>` : ""}
    ${compact ? "" : `<ul class="tick-list small">${c.includes.slice(0, 5).map((x) => `<li>${esc(x.title)}</li>`).join("")}</ul>`}
    <div style="margin-top:18px;display:grid;gap:10px">
      ${enrolled ? `<a class="btn btn-gold btn-block" href="/apprendre/${esc(c.slug)}">Continuer la formation</a>` : `<a class="btn btn-gold btn-block" href="/formation/${esc(c.slug)}#inscription">Rejoindre The 1% — ${plan ? money(plan.installments[0].amount_cents, c.currency) + " aujourd'hui" : money(c.price_cents, c.currency)}</a>`}
    </div>
    <p class="dim small center" style="margin:12px 0 0">${state.config.bitcoin ? "₿ Bitcoin" + (state.config.methods?.includes("card") ? " ou carte" : "") : "Paiement sécurisé par Stripe"} · Garantie d'exécution · Accès à vie</p>
  </div>`;
}

// ---------- Catalogue et page de formation ----------
async function catalogue() {
  loading();
  const courses = await api("/api/courses");
  main(`<div class="wrap section-tight"><div class="page-head"><div><div class="eyebrow">Catalogue</div><h1 style="font-size:40px">Formations</h1></div></div>
  <div class="grid grid-2">${courses.map((c) => `<article class="card course-card"><div class="accent" style="background:${esc(c.accent)}"></div>
    <div class="pill-list"><span class="badge">${esc(c.level)}</span><span class="badge">${c.modules} modules · ${c.lessons} leçons</span><span class="badge">${hours(c.minutes)}</span>${c.enrolled ? '<span class="badge badge-ok">Inscrit</span>' : ""}</div>
    <h3>${esc(c.title)}</h3><p class="muted">${esc(c.subtitle)}</p>
    <div class="foot"><strong style="font-family:var(--serif);font-size:24px">${c.price_cents ? money(c.price_cents, c.currency) : "Gratuit"}</strong><a class="btn ${c.price_cents ? "btn-gold" : "btn-ghost"}" href="/formation/${esc(c.slug)}">${c.enrolled ? "Continuer" : "Découvrir"}</a></div></article>`).join("")}</div></div>`);
}

async function coursePage({ slug }) {
  loading();
  const c = await api(`/api/courses/${slug}`);
  const u = state.user;
  const firstPreview = c.modulesList.flatMap((m) => m.lessons).find((l) => l.is_preview);
  main(`<div class="wrap section-tight">
  <div style="display:grid;grid-template-columns:1.25fr .75fr;gap:40px;align-items:start" class="course-layout">
    <div>
      <div class="pill-list" style="margin-bottom:14px"><span class="badge badge-gold">${esc(c.level)}</span><span class="badge">${c.modules} modules</span><span class="badge">${c.lessons} leçons</span><span class="badge">${hours(c.minutes)} de vidéo</span><span class="badge">${c.quizzes} quiz</span></div>
      <h1 style="font-size:44px">${esc(c.title)}</h1>
      <p class="lead muted" style="font-size:18px">${esc(c.subtitle)}</p>
      <div class="prose">${md(c.description)}</div>
      ${c.audience ? `<div class="card" style="margin:22px 0"><h4>Pour qui</h4><p class="muted" style="margin:0">${esc(c.audience)}</p></div>` : ""}
      <h2 style="font-size:30px;margin-top:40px">Ce que vous aurez à la fin</h2>
      <ul class="tick-list">${c.outcomes.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
      <h2 style="font-size:30px;margin-top:40px">Programme détaillé</h2>
      ${c.modulesList.map((m, i) => `<details ${i === 0 ? "open" : ""}><summary><span>${esc(m.title)}</span><span class="dim small" style="font-weight:500">${m.lessons.length} leçons · ${hours(m.lessons.reduce((s, l) => s + l.duration_min, 0))}</span></summary><div class="inner"><p class="small">${esc(m.summary)}</p>
        <ul style="list-style:none;padding:0;margin:0">${m.lessons.map((l) => `<li style="display:flex;gap:10px;padding:7px 0;border-top:1px solid var(--line);font-size:14px"><span style="color:${l.locked ? "var(--dim)" : "var(--gold)"}">${l.locked ? "🔒" : "▶"}</span><span style="flex:1;color:${l.locked ? "var(--muted)" : "var(--text)"}">${l.locked ? esc(l.title) : `<a href="/apprendre/${esc(c.slug)}/lecon/${l.id}" style="color:inherit">${esc(l.title)}</a>`}${l.is_preview && !c.enrolled ? ' <span class="badge badge-gold" style="margin-left:6px">Aperçu gratuit</span>' : ""}</span><span class="dim">${l.duration_min} min</span></li>`).join("")}
        ${m.quiz ? `<li style="display:flex;gap:10px;padding:7px 0;border-top:1px solid var(--line);font-size:14px"><span style="color:var(--gold)">✎</span><span style="flex:1">${esc(m.quiz.title)} <span class="dim">(${m.quiz.pass_pct} % requis)</span></span></li>` : ""}</ul></div></details>`).join("")}
      ${c.finalExam ? `<div class="card" style="margin-top:14px"><h4>${esc(c.finalExam.title)}</h4><p class="muted small" style="margin:0">${c.finalExam.pass_pct} % requis. Émet le certificat vérifiable.</p></div>` : ""}
      ${c.includes.length ? `<h2 style="font-size:30px;margin-top:40px">Inclus dans le prix</h2><div class="grid grid-2">${c.includes.map((x) => `<div class="card"><h4>${esc(x.title)}</h4><p class="muted small" style="margin:0">${esc(x.detail)}</p></div>`).join("")}</div>` : ""}
    </div>
    <aside id="inscription" style="position:sticky;top:86px">
      ${c.enrolled ? enrolledCard(c) : c.price_cents === 0 ? freeCard(c) : buyCard(c)}
      ${firstPreview && !c.enrolled ? `<p class="center small" style="margin-top:14px"><a href="/apprendre/${esc(c.slug)}/lecon/${firstPreview.id}">Regarder une leçon en aperçu gratuit →</a></p>` : ""}
    </aside>
  </div></div>
  <style>@media (max-width:900px){.course-layout{grid-template-columns:1fr !important}.course-layout aside{position:static !important}}</style>`);
  bindBuy(c);
}
function enrolledCard(c) {
  const p = c.progress;
  return `<div class="card card-gold"><div class="eyebrow">Vous êtes inscrit</div><h3>${p.pct} % complété</h3><div class="progress"><span style="width:${p.pct}%"></span></div>
  <p class="muted small" style="margin:12px 0">${p.done}/${p.lessons} leçons · ${p.quizzesPassed}/${p.quizzes} quiz réussis</p>
  <a class="btn btn-gold btn-block" href="/apprendre/${esc(c.slug)}">${p.pct ? "Continuer" : "Commencer"} la formation</a>
  ${c.certificate ? `<a class="btn btn-ghost btn-block" style="margin-top:10px" href="/certificat/${esc(c.certificate.code)}" target="_blank">Voir mon certificat</a>` : ""}
  ${c.order && c.order.plan === "3x" ? `<div class="plan" style="margin-top:16px;border-top:1px solid var(--line);padding-top:12px"><div class="small muted" style="margin-bottom:6px">Plan de paiement</div>${c.order.installments.map((i) => `<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0"><span>${esc(i.label.split(" — ")[0])} · ${fmtDate(i.due_at)}</span>${i.status === "paid" ? '<span class="badge badge-ok">Payé</span>' : `<button class="btn btn-sm btn-ghost" data-pay="${c.order.id}:${i.number}">Payer ${money(i.amount_cents, c.order.currency)}</button>`}</div>`).join("")}</div>` : ""}
  </div>`;
}
function freeCard(c) {
  return `<div class="card card-gold"><div class="eyebrow">Gratuit</div><h3>Accès immédiat</h3><p class="muted small">Créez un compte gratuit et commencez maintenant.</p>
  <button class="btn btn-gold btn-block" id="buyBtn" data-plan="full">${state.user ? "M'inscrire gratuitement" : "Créer mon compte et commencer"}</button></div>`;
}
function buyCard(c) {
  const plan = c.plan;
  return `<div class="card card-gold offer-card"><span class="ribbon">Tout inclus</span>
  <div class="price">${money(c.price_cents, c.currency)} <small>${esc(c.currency)}</small></div>
  <p class="muted small">Aucun frais supplémentaire. Accès à vie. Garantie d'exécution.</p>
  ${plan ? `<div class="field" style="margin-top:18px"><label>Mode de paiement</label>
    <label class="opt" style="margin-bottom:8px"><input type="radio" name="plan" value="3x" checked><span><b>${esc(plan.label)}</b><br><span class="muted small">${plan.installments.map((i) => money(i.amount_cents, c.currency)).join(" + ")} · accès immédiat au 1er versement</span></span></label>
    <label class="opt"><input type="radio" name="plan" value="full"><span><b>Paiement intégral</b><br><span class="muted small">${money(c.price_cents, c.currency)} aujourd'hui</span></span></label></div>` : ""}
  ${(state.config.methods || []).length > 1 ? `<div class="field"><label>Moyen de paiement</label><div class="pay-methods">${(state.config.methods || []).map((m, i) => m === "bitcoin" ? `<label class="opt btc"><input type="radio" name="method" value="bitcoin" ${i === 0 ? "checked" : ""}><span class="pm-ic">₿</span><span><b>Bitcoin</b><br><span class="muted small">Facture en BTC, accès dès détection sur la blockchain</span></span></label>` : `<label class="opt"><input type="radio" name="method" value="card" ${i === 0 ? "checked" : ""}><span class="pm-ic">▣</span><span><b>Carte bancaire</b><br><span class="muted small">Paiement sécurisé par Stripe</span></span></label>`).join("")}</div></div>` : ""}
  <div class="field"><label for="coupon">Code promo (facultatif)</label><input id="coupon" placeholder="CODE"></div>
  <button class="btn btn-gold btn-block btn-lg" id="buyBtn">${state.user ? (plan ? `Payer ${money(plan.installments[0].amount_cents, c.currency)} et commencer` : `Payer ${money(c.price_cents, c.currency)}`) : "Créer mon compte pour m'inscrire"}</button>
  <p class="dim small center" style="margin:12px 0 0">${(state.config.methods || []).includes("bitcoin") ? "₿ Paiement en Bitcoin" + ((state.config.methods || []).includes("card") ? " ou par carte" : "") : "Paiement sécurisé par Stripe"}${!state.config.stripe && (state.config.methods || []).includes("card") ? " (carte en mode démonstration)" : ""}.</p>
  <div id="buyErr" class="error"></div></div>`;
}
function bindBuy(c) {
  const btn = $("#buyBtn");
  if (btn) btn.onclick = async () => {
    if (!state.user) return navigate(`/inscription?next=${encodeURIComponent(`/formation/${c.slug}#inscription`)}`);
    btn.disabled = true;
    try {
      const plan = $('input[name="plan"]:checked')?.value || "full";
      const method = $('input[name="method"]:checked')?.value || (state.config.methods || [])[0] || "card";
      const r = await api("/api/checkout", { method: "POST", body: { course_id: c.id, plan, coupon: $("#coupon")?.value || "", method } });
      if (r.enrolled) { toast("Inscription réussie !"); return navigate(r.redirect); }
      if (r.url.startsWith("/")) return navigate(r.url);
      location.href = r.url;
    } catch (e) { $("#buyErr").textContent = e.message; btn.disabled = false; }
  };
  document.querySelectorAll("[data-pay]").forEach((b) => (b.onclick = async () => {
    const [order, n] = b.dataset.pay.split(":");
    b.disabled = true;
    try { const r = await api(`/api/orders/${order}/pay/${n}${b.dataset.method ? "?method=" + b.dataset.method : ""}`, { method: "POST" }); if (r.url.startsWith("/")) return navigate(r.url); location.href = r.url; } catch (e) { toast(e.message, true); b.disabled = false; }
  }));
}

// ---------- Offre (page commerciale imprimable) ----------
async function offerPage() {
  loading();
  const c = await api("/api/courses/the-1-percent").catch(() => null);
  if (!c) return errorPage(new Error("Programme introuvable"));
  const plan = c.plan;
  main(`<div class="wrap section-tight" style="max-width:900px">
  <div class="eyebrow">L'offre</div>
  <h1 style="font-size:46px">The 1% — Programme Élite E-commerce</h1>
  <p class="lead muted" style="font-size:18px">${esc(c.subtitle)}</p>
  <div class="card card-gold" style="margin:28px 0"><div style="display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;align-items:end">
    <div><div class="eyebrow">Investissement</div><div class="price" style="font-family:var(--serif);font-size:52px;line-height:1">${money(c.price_cents, c.currency)} <span class="muted" style="font-size:16px;font-family:var(--sans)">${esc(c.currency)} · tout inclus, aucun frais caché</span></div></div>
    <a class="btn btn-gold btn-lg" href="/formation/${esc(c.slug)}#inscription">Rejoindre</a></div>
    ${plan ? `<table class="table" style="margin-top:22px"><thead><tr><th>Versement</th><th>Échéance</th><th style="text-align:right">Montant</th></tr></thead><tbody>${plan.installments.map((i, k) => `<tr><td>${esc(i.label.split(" — ")[0])}</td><td>${k === 0 ? "À l'inscription (accès immédiat)" : `${i.days} jours après l'inscription`}</td><td style="text-align:right"><b>${money(i.amount_cents, c.currency)}</b></td></tr>`).join("")}<tr><td colspan="2"><b>Total</b></td><td style="text-align:right"><b>${money(c.price_cents, c.currency)}</b></td></tr></tbody></table>` : ""}
    <p class="muted small" style="margin:14px 0 0">Ou paiement intégral de ${money(c.price_cents, c.currency)} à l'inscription. Carte via Stripe ou virement sur demande.</p>
  </div>
  <h2 style="font-size:30px">Ce que comprend l'offre</h2>
  <table class="table"><thead><tr><th>Composante</th><th>Détail</th></tr></thead><tbody>${c.includes.map((x) => `<tr><td><b>${esc(x.title)}</b></td><td class="muted">${esc(x.detail)}</td></tr>`).join("")}</tbody></table>
  <h2 style="font-size:30px;margin-top:40px">Résultats visés en 12 semaines</h2>
  <ul class="tick-list">${c.outcomes.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>
  <h2 style="font-size:30px;margin-top:40px">Le programme</h2>
  <table class="table"><thead><tr><th>#</th><th>Module</th><th>Leçons</th><th>Durée</th></tr></thead><tbody>${c.modulesList.map((m, i) => `<tr><td>${i + 1}</td><td><b>${esc(m.title.replace(/^Module \d+ — /, ""))}</b><br><span class="muted small">${esc(m.summary)}</span></td><td>${m.lessons.length}</td><td>${hours(m.lessons.reduce((s, l) => s + l.duration_min, 0))}</td></tr>`).join("")}</tbody></table>
  <h2 style="font-size:30px;margin-top:40px">Comparaison</h2>
  <table class="compare"><thead><tr><th></th><th>Cours vidéo à 500–2 000 $</th><th>Agence à 5 000 $/mois</th><th>The 1%</th></tr></thead><tbody>
    <tr><td>Système complet du produit à la vente de la marque</td><td class="x">Partiel</td><td class="x">Non, exécution seulement</td><td class="v">Oui, 14 modules</td></tr>
    <tr><td>Coaching individuel jusqu'au résultat</td><td class="x">Non</td><td class="x">Gestion, pas formation</td><td class="v">6 appels + appels de groupe</td></tr>
    <tr><td>Révision de boutique et de campagne</td><td class="x">Non</td><td class="v">Oui</td><td class="v">Oui, listes à 60 points</td></tr>
    <tr><td>Vous gardez la compétence</td><td class="v">Partiellement</td><td class="x">Non</td><td class="v">Oui, avec procédures</td></tr>
    <tr><td>Coût sur 12 mois</td><td class="v">500–2 000 $</td><td class="x">60 000 $+</td><td class="v">20 000 $, une fois</td></tr>
    <tr><td>Garantie</td><td class="x">Rarement</td><td class="x">Non</td><td class="v">Garantie d'exécution</td></tr>
  </tbody></table>
  <h2 style="font-size:30px;margin-top:40px">Garantie d'exécution</h2>
  <p class="muted">Si vous complétez les 14 modules, livrez chaque action prévue et n'obtenez pas vos 10 premières ventes en 12 semaines, nous prolongeons le coaching gratuitement jusqu'à ce que vous les obteniez. Conditions détaillées dans les <a href="/conditions">conditions</a>.</p>
  <h2 style="font-size:30px;margin-top:40px">Questions fréquentes</h2>
  ${faq().map(([q, a]) => `<details><summary>${esc(q)}</summary><div class="inner">${a}</div></details>`).join("")}
  <div class="cta-band" style="margin-top:40px"><h2>Prêt ?</h2><p class="muted">Accès immédiat dès le premier versement de ${plan ? money(plan.installments[0].amount_cents, c.currency) : money(c.price_cents, c.currency)}.</p><a class="btn btn-gold btn-lg" href="/formation/${esc(c.slug)}#inscription">Rejoindre The 1%</a><p class="dim small" style="margin:16px 0 0"><a href="#" onclick="window.print();return false">Imprimer ou enregistrer cette offre en PDF</a></p></div>
  </div>`);
}

// ---------- Authentification ----------
function authForm(title, fields, submitLabel, foot) {
  return `<div class="wrap"><div class="auth"><div class="eyebrow">The 1%</div><h1>${title}</h1><form id="f">${fields}<div class="error" id="err"></div><button class="btn btn-gold btn-block btn-lg" type="submit">${submitLabel}</button></form><p class="muted small center" style="margin-top:18px">${foot}</p></div></div>`;
}
const nextParam = () => new URLSearchParams(location.search).get("next") || "/tableau-de-bord";
async function login() {
  if (state.user) return navigate(nextParam());
  main(authForm("Connexion", `<div class="field"><label>Courriel</label><input name="email" type="email" autocomplete="email" required></div><div class="field"><label>Mot de passe</label><input name="password" type="password" autocomplete="current-password" required></div>`, "Se connecter", `Pas encore de compte ? <a href="/inscription${location.search}">Créer un compte</a> · <a href="/mot-de-passe-oublie">Mot de passe oublié</a>`));
  $("#f").onsubmit = async (e) => { e.preventDefault(); try { const r = await api("/api/auth/login", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); state.user = r.user; toast(`Bon retour, ${r.user.name.split(" ")[0]}.`); const n = nextParam(); location.hash ? (location.href = n) : navigate(n); } catch (er) { $("#err").textContent = er.message; } };
}
async function register() {
  if (state.user) return navigate(nextParam());
  main(authForm("Créer un compte", `<div class="field"><label>Nom complet</label><input name="name" autocomplete="name" required minlength="2"></div><div class="field"><label>Courriel</label><input name="email" type="email" autocomplete="email" required></div><div class="field"><label>Mot de passe (8 caractères min.)</label><input name="password" type="password" autocomplete="new-password" required minlength="8"></div>`, "Créer mon compte", `Déjà membre ? <a href="/connexion${location.search}">Se connecter</a>`));
  $("#f").onsubmit = async (e) => { e.preventDefault(); try { const r = await api("/api/auth/register", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); state.user = r.user; toast("Bienvenue dans The 1%."); const n = nextParam(); n.includes("#") ? (location.href = n) : navigate(n); } catch (er) { $("#err").textContent = er.message; } };
}
async function forgot() {
  main(authForm("Mot de passe oublié", `<div class="field"><label>Courriel</label><input name="email" type="email" required></div>`, "Envoyer le lien", `<a href="/connexion">Retour à la connexion</a>`));
  $("#f").onsubmit = async (e) => { e.preventDefault(); await api("/api/auth/forgot", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); main(`<div class="wrap"><div class="auth"><h1>Vérifiez vos courriels</h1><p class="muted">Si un compte existe pour cette adresse, un lien de réinitialisation valable 1 heure a été généré. Sans service de courriel configuré, l'administrateur vous le transmettra.</p></div></div>`); };
}
async function resetPw({ token }) {
  main(authForm("Nouveau mot de passe", `<div class="field"><label>Nouveau mot de passe</label><input name="password" type="password" required minlength="8"></div>`, "Enregistrer", `<a href="/connexion">Connexion</a>`));
  $("#f").onsubmit = async (e) => { e.preventDefault(); try { await api("/api/auth/reset", { method: "POST", body: { token, password: new FormData(e.target).get("password") } }); toast("Mot de passe mis à jour."); navigate("/connexion"); } catch (er) { $("#err").textContent = er.message; } };
}

// ---------- Espace étudiant ----------
function requireLogin() { if (!state.user) { navigate(`/connexion?next=${encodeURIComponent(location.pathname)}`); return false; } return true; }
async function dashboard() {
  if (!requireLogin()) return;
  loading();
  const d = await api("/api/dashboard");
  main(`<div class="wrap section-tight">
  <div class="page-head"><div><div class="eyebrow">Mon espace</div><h1 style="font-size:40px">Bonjour, ${esc(state.user.name.split(" ")[0])}.</h1></div><div class="pill-list"><span class="badge">${hours(d.minutes)} de formation complétés</span></div></div>
  ${d.courses.length ? `<div class="grid grid-2">${d.courses.map((c) => `<article class="card course-card"><div class="accent" style="background:${esc(c.accent)}"></div><h3>${esc(c.title)}</h3>
    <div class="progress"><span style="width:${c.progress.pct}%"></span></div><p class="muted small" style="margin:8px 0 0">${c.progress.pct} % · ${c.progress.done}/${c.progress.lessons} leçons · ${c.progress.quizzesPassed}/${c.progress.quizzes} quiz</p>
    <div class="foot">${c.certificate ? `<a class="badge badge-ok" href="/certificat/${esc(c.certificate)}" target="_blank">Certificat ✓</a>` : `<span class="dim small">${c.nextLesson ? "Prochaine : " + esc(c.nextLesson.title) : "Toutes les leçons sont terminées"}</span>`}
    <a class="btn btn-gold btn-sm" href="${c.nextLesson ? `/apprendre/${esc(c.slug)}/lecon/${c.nextLesson.id}` : `/apprendre/${esc(c.slug)}`}">${c.progress.pct ? "Continuer" : "Commencer"}</a></div></article>`).join("")}</div>`
    : `<div class="empty">Vous n'êtes inscrit à aucune formation. <a href="/formations">Voir le catalogue</a></div>`}
  ${d.orders.length ? `<h2 style="font-size:28px;margin-top:48px">Paiements</h2><div class="table-wrap"><table class="table"><thead><tr><th>Formation</th><th>Versement</th><th>Échéance</th><th>Montant</th><th>Statut</th><th></th></tr></thead><tbody>
    ${d.orders.flatMap((o) => o.installments.map((i) => `<tr><td>${esc(o.course_title)}</td><td>${esc(i.label.split(" — ")[0])}</td><td>${fmtDate(i.due_at)}</td><td>${money(i.amount_cents, o.currency)}</td><td>${i.status === "paid" ? `<span class="badge badge-ok">Payé le ${fmtDate(i.paid_at)}</span>` : new Date(i.due_at) < new Date() ? '<span class="badge badge-err">En retard</span>' : '<span class="badge badge-warn">À venir</span>'}</td><td>${i.status !== "paid" && o.status !== "pending" ? (state.config.methods || []).map((m) => `<button class="btn btn-sm btn-ghost" data-pay="${o.id}:${i.number}" data-method="${m}" style="margin:2px">${m === "bitcoin" ? "₿ Payer en Bitcoin" : "Payer par carte"}</button>`).join("") : ""}</td></tr>`)).join("")}</tbody></table></div>` : ""}
  </div>`);
  bindBuy({});
}
async function profile() {
  if (!requireLogin()) return;
  const u = state.user;
  main(`<div class="wrap"><div class="auth"><div class="eyebrow">Profil</div><h1>Mon compte</h1>
  <form id="f"><div class="field"><label>Nom</label><input name="name" value="${esc(u.name)}" required></div><div class="field"><label>Courriel</label><input value="${esc(u.email)}" disabled></div><hr>
  <div class="field"><label>Mot de passe actuel</label><input name="current_password" type="password" autocomplete="current-password"></div><div class="field"><label>Nouveau mot de passe</label><input name="password" type="password" autocomplete="new-password" minlength="8"></div>
  <div class="error" id="err"></div><button class="btn btn-gold btn-block">Enregistrer</button></form></div></div>`);
  $("#f").onsubmit = async (e) => { e.preventDefault(); const b = Object.fromEntries(new FormData(e.target)); if (!b.password) { delete b.password; delete b.current_password; } try { const r = await api("/api/me", { method: "PUT", body: b }); state.user = r.user; toast("Profil mis à jour."); topbar(); } catch (er) { $("#err").textContent = er.message; } };
}

// ---------- Lecteur de cours ----------
function videoBlock(url) {
  if (!url) return `<div class="video"><div class="placeholder"><b>Vidéo à venir</b>Cette leçon recevra sa vidéo prochainement. Le contenu écrit ci-dessous est complet.</div></div>`;
  const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/.exec(url);
  if (yt) return `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Vidéo"></iframe></div>`;
  const vm = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  if (vm) return `<div class="video"><iframe src="https://player.vimeo.com/video/${vm[1]}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Vidéo"></iframe></div>`;
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url) || url.startsWith("/media/") || /blob\.vercel-storage\.com/.test(url)) return `<div class="video"><video controls preload="metadata" controlsList="nodownload" src="${esc(url)}"></video></div>`;
  return `<div class="video"><iframe src="${esc(url)}" allowfullscreen title="Vidéo"></iframe></div>`;
}
async function learn({ slug, id }) {
  loading();
  const c = await api(`/api/courses/${slug}`);
  const all = c.modulesList.flatMap((m) => m.lessons);
  if (!id) {
    const next = all.find((l) => !l.done && !l.locked) || all.find((l) => !l.locked);
    if (!next) { if (!state.user) return navigate(`/connexion?next=${encodeURIComponent(location.pathname)}`); return navigate(`/formation/${slug}`); }
    return navigate(`/apprendre/${slug}/lecon/${next.id}`);
  }
  let lesson;
  try { lesson = await api(`/api/lessons/${id}`); } catch (e) {
    if (!state.user) return navigate(`/connexion?next=${encodeURIComponent(location.pathname)}`);
    return main(`<div class="wrap section"><div class="empty"><p>${esc(e.message)}</p><a class="btn btn-gold" href="/formation/${esc(slug)}#inscription">Voir l'offre</a></div></div>`);
  }
  const p = c.progress;
  const sidebar = `<aside><div class="head"><div class="eyebrow" style="margin-bottom:6px">${esc(c.title)}</div>${p ? `<div class="progress"><span style="width:${p.pct}%"></span></div><div class="dim small" style="margin-top:6px">${p.pct} % · ${p.done}/${p.lessons} leçons</div>` : `<a class="btn btn-gold btn-sm btn-block" href="/formation/${esc(c.slug)}#inscription">Rejoindre pour tout débloquer</a>`}</div>
    ${c.modulesList.map((m, i) => { const open = m.lessons.some((l) => l.id === Number(id)); return `<div class="mod"><button data-mod="${m.id}" aria-expanded="${open}"><span>${esc(m.title)}</span><span class="cnt">${m.lessons.filter((l) => l.done).length}/${m.lessons.length}</span></button><ul ${open ? "" : "hidden"}>
      ${m.lessons.map((l) => `<li><a href="/apprendre/${esc(c.slug)}/lecon/${l.id}" class="${l.id === Number(id) ? "active" : ""} ${l.done ? "done" : ""} ${l.locked ? "lock" : ""}"><span class="dot">${l.done ? "✓" : l.locked ? "" : ""}</span><span>${esc(l.title)}</span><span class="dur">${l.duration_min}'</span></a></li>`).join("")}
      ${m.quiz ? `<li><a href="/quiz/${m.quiz.id}" class="quiz ${m.quiz.passed ? "done" : ""}"><span class="dot">${m.quiz.passed ? "✓" : "?"}</span><span>${esc(m.quiz.title)}</span><span class="dur">${m.quiz.best != null ? m.quiz.best + " %" : ""}</span></a></li>` : ""}</ul></div>`; }).join("")}
    ${c.finalExam ? `<div class="mod"><ul style="padding-top:8px"><li><a href="/quiz/${c.finalExam.id}" class="quiz ${c.finalExam.passed ? "done" : ""}"><span class="dot">${c.finalExam.passed ? "✓" : "★"}</span><span><b>${esc(c.finalExam.title)}</b></span><span class="dur">${c.finalExam.best != null ? c.finalExam.best + " %" : ""}</span></a></li>${c.certificate ? `<li><a href="/certificat/${esc(c.certificate.code)}" target="_blank" class="done"><span class="dot">✓</span><span>Mon certificat</span></a></li>` : ""}</ul></div>` : ""}</aside>`;
  main(`<div class="learn">${sidebar}<div class="content">
    <div class="dim small" style="margin-bottom:8px">${esc(lesson.module.title)}</div>
    <h1 style="font-size:34px">${esc(lesson.title)}</h1>
    <div class="pill-list" style="margin-bottom:18px"><span class="badge">${lesson.duration_min} min</span>${lesson.is_preview ? '<span class="badge badge-gold">Aperçu gratuit</span>' : ""}${lesson.done ? '<span class="badge badge-ok">Terminée</span>' : ""}</div>
    ${videoBlock(lesson.video_url)}
    <div class="prose">${md(lesson.content)}</div>
    ${lesson.resources.length ? `<h3 style="margin-top:36px">Ressources</h3><div class="resources">${lesson.resources.map(([t, u]) => `<a href="${esc(u)}" ${u && u !== "#" ? 'target="_blank" rel="noopener"' : 'onclick="return false" title="Fichier à ajouter par l\'équipe"'}>📎 <span>${esc(t)}</span>${!u || u === "#" ? '<span class="dim small" style="margin-left:auto">bientôt</span>' : ""}</a>`).join("")}</div>` : ""}
    ${state.user ? `<div class="lesson-nav"><div>${lesson.prev ? `<a class="btn btn-ghost" href="/apprendre/${esc(c.slug)}/lecon/${lesson.prev}">← Précédente</a>` : ""}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${c.enrolled || state.user.role === "admin" ? `<button class="btn ${lesson.done ? "btn-dark" : "btn-gold"}" id="doneBtn">${lesson.done ? "✓ Terminée (annuler)" : "Marquer comme terminée"}</button>` : ""}${lesson.next ? `<a class="btn btn-ghost" href="/apprendre/${esc(c.slug)}/lecon/${lesson.next}">Suivante →</a>` : ""}</div></div>` : `<div class="card card-gold" style="margin-top:30px"><h3>Continuer</h3><p class="muted">Créez un compte gratuit pour suivre votre progression, ou rejoignez The 1% pour débloquer les ${c.lessons} leçons.</p><a class="btn btn-gold" href="/inscription?next=${encodeURIComponent(location.pathname)}">Créer un compte</a></div>`}
    ${state.user && (c.enrolled || state.user.role === "admin") ? `<h3 style="margin-top:48px">Questions et discussion</h3><form id="cf"><div class="field"><textarea name="body" placeholder="Posez votre question à l'équipe ou partagez votre livrable…" required minlength="2"></textarea></div><button class="btn btn-ghost btn-sm">Publier</button></form>
      <div style="margin-top:12px">${lesson.comments.map((k) => `<div class="comment"><div class="who"><b>${esc(k.name)}</b>${k.role === "admin" ? ' <span class="badge badge-gold">Équipe</span>' : ""} · ${fmtDate(k.created_at)}</div><div>${esc(k.body)}</div></div>`).join("") || '<p class="dim small">Aucune question pour le moment.</p>'}</div>` : ""}
  </div></div>`);
  document.querySelectorAll("[data-mod]").forEach((b) => (b.onclick = () => { const ul = b.nextElementSibling; ul.hidden = !ul.hidden; b.setAttribute("aria-expanded", String(!ul.hidden)); }));
  const done = $("#doneBtn");
  if (done) done.onclick = async () => {
    done.disabled = true;
    try {
      const r = await api(`/api/lessons/${lesson.id}/complete`, { method: lesson.done ? "DELETE" : "POST" });
      if (r.certificate) toast("🎓 Félicitations ! Votre certificat est émis.");
      else if (!lesson.done && lesson.next) return navigate(`/apprendre/${c.slug}/lecon/${lesson.next}`);
      render();
    } catch (e) { toast(e.message, true); done.disabled = false; }
  };
  const cf = $("#cf");
  if (cf) cf.onsubmit = async (e) => { e.preventDefault(); try { await api(`/api/lessons/${lesson.id}/comments`, { method: "POST", body: { body: new FormData(cf).get("body") } }); toast("Publié."); render(); } catch (er) { toast(er.message, true); } };
}

// ---------- Quiz ----------
async function quizPage({ id }) {
  if (!requireLogin()) return;
  loading();
  let z;
  try { z = await api(`/api/quizzes/${id}`); } catch (e) { return main(`<div class="wrap section"><div class="empty">${esc(e.message)}</div></div>`); }
  main(`<div class="wrap section-tight" style="max-width:820px">
    <div class="dim small"><a href="/apprendre/${esc(z.course.slug)}">← ${esc(z.course.title)}</a></div>
    <h1 style="font-size:36px">${esc(z.title)}</h1>
    <p class="muted">${z.questions.length} questions · ${z.pass_pct} % requis${z.attempts.length ? ` · meilleur résultat : ${Math.max(...z.attempts.map((a) => a.score_pct))} %` : ""}${z.isFinal ? " · Émet le certificat une fois toutes les leçons et tous les quiz complétés" : ""}</p>
    <form id="qf">${z.questions.map((qq, i) => `<div class="q" data-i="${i}"><div class="qt">${i + 1}. ${esc(qq.q)}</div>${qq.options.map((o, j) => `<label class="opt"><input type="radio" name="q${i}" value="${j}" required><span>${esc(o)}</span></label>`).join("")}<div class="why" hidden></div></div>`).join("")}
    <div class="error" id="err"></div><button class="btn btn-gold btn-lg" id="sub">Valider mes réponses</button></form>
    <div id="result"></div></div>`);
  $("#qf").onsubmit = async (e) => {
    e.preventDefault();
    const answers = z.questions.map((_, i) => Number(new FormData(e.target).get(`q${i}`)));
    $("#sub").disabled = true;
    try {
      const r = await api(`/api/quizzes/${id}/attempt`, { method: "POST", body: { answers } });
      r.results.forEach((res, i) => {
        const box = $(`.q[data-i="${i}"]`); const opts = box.querySelectorAll(".opt");
        opts[res.answer].classList.add("correct"); if (!res.correct) opts[answers[i]].classList.add("wrong");
        const why = box.querySelector(".why"); why.hidden = false; why.textContent = (res.correct ? "✓ Exact. " : "✗ ") + res.why;
        box.querySelectorAll("input").forEach((inp) => (inp.disabled = true));
      });
      $("#sub").hidden = true;
      $("#result").innerHTML = `<div class="card ${r.passed ? "card-gold" : ""}" style="text-align:center;margin-top:24px"><div class="score">${r.score} %</div><h3 style="margin-top:10px">${r.passed ? "Quiz réussi" : `Non réussi (${z.pass_pct} % requis)`}</h3>
        ${r.certificate ? `<p>🎓 Votre certificat est émis.</p><a class="btn btn-gold" href="/certificat/${esc(r.certificate)}" target="_blank">Voir mon certificat</a> ` : ""}
        ${!r.passed ? `<button class="btn btn-ghost" onclick="location.reload()">Réessayer</button> ` : ""}<a class="btn ${r.passed ? "btn-gold" : "btn-ghost"}" href="/apprendre/${esc(z.course.slug)}">Retour au cours</a></div>`;
      $("#result").scrollIntoView({ behavior: "smooth" });
    } catch (er) { $("#err").textContent = er.message; $("#sub").disabled = false; }
  };
}

// ---------- Paiement ----------
async function paySimulation() {
  if (!requireLogin()) return;
  const sp = new URLSearchParams(location.search);
  const order = sp.get("order"), n = sp.get("n") || "1";
  main(`<div class="wrap"><div class="auth"><div class="eyebrow">Mode démonstration</div><h1>Paiement simulé</h1><p class="muted">Stripe n'est pas configuré sur ce serveur. En production, cette page est remplacée par la page de paiement sécurisée de Stripe. Cliquez pour simuler un paiement réussi du versement ${esc(n)}.</p>
  <button class="btn btn-gold btn-block btn-lg" id="ok">Simuler le paiement</button><p class="center small" style="margin-top:12px"><a href="/tableau-de-bord">Annuler</a></p></div></div>`);
  $("#ok").onclick = async () => { try { const r = await api("/api/checkout/simulate", { method: "POST", body: { order_id: Number(order), n: Number(n) } }); toast("Paiement enregistré. Bienvenue !"); navigate(r.redirect); } catch (e) { toast(e.message, true); } };
}
async function bitcoinPay() {
  if (!requireLogin()) return;
  const sp = new URLSearchParams(location.search);
  const order = sp.get("order"), n = sp.get("n") || "1";
  loading();
  let d;
  try { d = await api(`/api/orders/${order}/btc/${n}`); } catch (e) { return main(`<div class="wrap section"><div class="empty">${esc(e.message)}</div></div>`); }
  if (d.paid) { toast("Versement déjà réglé."); return navigate(d.redirect); }
  const inv = d.invoice;
  main(`<div class="wrap section-tight"><div class="btc-page">
    <div>
      <div class="eyebrow">Paiement en Bitcoin</div>
      <h1 style="font-size:36px">${esc(d.installment.label.split(" — ")[0])} · ${esc(d.course.title.replace(/^The 1% — /, ""))}</h1>
      <p class="muted">Envoyez exactement le montant ci-dessous à l'adresse indiquée. Votre accès s'ouvre automatiquement dès que la transaction est détectée${d.price_usd ? ` (taux figé : 1 BTC = ${money(Math.round(d.price_usd * 100))})` : ""}. La facture est valable 1 heure ; passé ce délai, un nouveau montant est calculé.</p>
      <div class="card card-gold">
        <div class="small muted">Montant à envoyer</div>
        <div class="amount-big">${esc(inv.btc)} BTC</div>
        <div class="muted small" style="margin:6px 0 16px">= ${money(d.installment.amount_cents, d.installment.currency)} · ${inv.sats.toLocaleString("fr-CA")} sats</div>
        <label>Adresse de réception</label>
        <div class="mono" id="addr">${esc(inv.address)}</div>
        <div class="toolbar" style="margin-top:12px"><button class="btn btn-ghost btn-sm" id="copyAddr">Copier l'adresse</button><button class="btn btn-ghost btn-sm" id="copyAmt">Copier le montant</button><a class="btn btn-ghost btn-sm" href="${esc(inv.uri)}">Ouvrir dans mon portefeuille</a></div>
        <hr>
        <div id="st"><span class="status-dot"></span><b>En attente de votre paiement…</b><div class="muted small" style="margin-top:6px">Vérification automatique toutes les 20 secondes. Vous pouvez fermer cette page : votre tableau de bord reflétera le paiement.</div></div>
        <button class="btn btn-gold btn-block" id="check" style="margin-top:14px">J'ai payé, vérifier maintenant</button>
      </div>
      <p class="dim small" style="margin-top:14px">Frais de réseau à la charge de l'expéditeur. Si vous payez depuis une plateforme d'échange, assurez-vous que le montant reçu après frais est au moins celui indiqué. Besoin d'aide ? ${esc(state.config.supportEmail || "")}</p>
    </div>
    <div>
      <div class="card"><div class="qr" id="qr"><img alt="Code QR" src="" id="qrimg" hidden></div><p class="center muted small" style="margin:12px 0 0">Scannez avec votre portefeuille Bitcoin</p></div>
      <div class="card" style="margin-top:16px"><h4>Comment ça marche</h4><ol class="small muted" style="padding-left:18px;margin:0"><li>Ouvrez votre portefeuille (Ledger, Trezor, Coinbase, Binance, Cash App…).</li><li>Scannez le code QR ou collez l'adresse et le montant.</li><li>Confirmez l'envoi. Dès que la transaction apparaît sur la blockchain, cette page se met à jour et votre accès s'ouvre.</li></ol></div>
      <div class="photo" style="margin-top:16px"><img src="/img/bitcoin.webp" alt="" loading="lazy"></div>
    </div>
  </div></div>`);
  // QR : bibliothèque chargée à la demande ; repli sur le texte si indisponible.
  try {
    const QR = (await import("https://esm.sh/qrcode@1.5.4")).default;
    const url = await QR.toDataURL(inv.uri, { width: 440, margin: 1, color: { dark: "#111111", light: "#ffffff" } });
    const img = $("#qrimg"); img.src = url; img.hidden = false;
  } catch { $("#qr").innerHTML = `<div class="small" style="color:#111;padding:8px;max-width:220px;word-break:break-all">${esc(inv.uri)}</div>`; }
  $("#copyAddr").onclick = () => { navigator.clipboard.writeText(inv.address); toast("Adresse copiée."); };
  $("#copyAmt").onclick = () => { navigator.clipboard.writeText(inv.btc); toast("Montant copié."); };
  let timer;
  const check = async (manual) => {
    try {
      const r = await api(`/api/btc/invoices/${inv.id}/check`, { method: "POST" });
      if (r.status === "paid") { clearInterval(timer); $("#st").innerHTML = `<span class="status-dot ok"></span><b>Paiement confirmé.</b><div class="muted small" style="margin-top:6px">Transaction ${esc(r.txid)}</div>`; toast("Paiement reçu. Bienvenue dans The 1%."); setTimeout(() => navigate(r.redirect), 1500); }
      else if (r.status === "seen") $("#st").innerHTML = `<span class="status-dot"></span><b>Transaction détectée, en attente de confirmation.</b><div class="muted small" style="margin-top:6px">${esc(r.txid)} · ${r.confirmations} confirmation(s)</div>`;
      else if (manual) toast("Aucune transaction détectée pour le moment. Réessayez dans quelques minutes.");
    } catch (e) { if (manual) toast(e.message, true); }
  };
  $("#check").onclick = () => check(true);
  timer = setInterval(() => { if (location.pathname !== "/paiement/bitcoin") return clearInterval(timer); check(false); }, 20000);
}
async function paySuccess() {
  main(`<div class="wrap"><div class="auth center"><div class="eyebrow">Merci</div><h1>Paiement reçu</h1><p class="muted">Votre accès est activé (ou le sera dans quelques secondes, le temps que Stripe nous confirme le paiement).</p><a class="btn btn-gold" href="/tableau-de-bord">Accéder à mon espace</a></div></div>`);
}

// ---------- Pages légales (gabarits à adapter par l'exploitant) ----------
function terms() {
  main(`<div class="wrap section-tight prose" style="max-width:820px"><h1 style="font-size:40px">Conditions de vente et d'utilisation</h1>
  ${md(`**Gabarit à faire valider par un conseiller juridique avant mise en ligne.**

## 1. Objet
Les présentes conditions régissent l'accès au programme « The 1% — Programme Élite E-commerce » et aux autres formations offertes sur cette plateforme (ci-après « les Formations »).

## 2. Prix et paiement
Le prix du programme est de 20 000 $ US, toutes composantes incluses, tel que décrit sur la page de l'offre. Il est payable en une fois ou en trois versements : 5 000 $ à l'inscription, 5 000 $ 30 jours après l'inscription et 10 000 $ 60 jours après l'inscription. L'accès au programme est ouvert dès le premier versement. En cas de versement impayé après un rappel de 7 jours, l'accès peut être suspendu jusqu'à régularisation.

## 3. Droit de résiliation
Conformément à la Loi sur la protection du consommateur (Québec), le consommateur peut résilier un contrat conclu à distance dans les délais prévus par la loi. Toute demande de résiliation est à adresser à l'adresse de soutien indiquée au bas de chaque page.

## 4. Garantie d'exécution
Si le membre complète les 14 modules, remet chaque action (livrable) prévue dans les leçons dans les délais du programme, assiste aux appels prévus et n'obtient pas 10 ventes payées par des clients hors de son entourage dans les 12 semaines suivant son inscription, l'exploitant prolonge gratuitement le coaching jusqu'à l'obtention de ces 10 ventes. Cette garantie ne constitue pas une promesse de résultat financier.

## 5. Propriété intellectuelle
Les contenus (vidéos, textes, gabarits) sont protégés. L'accès est personnel et non transférable. Toute reproduction ou diffusion est interdite.

## 6. Résultats
Les études de cas présentées sont celles de membres et ne garantissent pas les résultats du membre, qui dépendent de son produit, de son capital et de son exécution.

## 7. Responsabilité
Les Formations ont un caractère éducatif. Le membre demeure seul responsable de ses décisions d'affaires, fiscales et juridiques.`)}</div>`);
}
function privacy() {
  main(`<div class="wrap section-tight prose" style="max-width:820px"><h1 style="font-size:40px">Politique de confidentialité</h1>
  ${md(`**Gabarit conforme aux principes de la Loi 25 (Québec), à faire valider avant mise en ligne.**

## Renseignements collectés
Nom, adresse courriel, mot de passe (haché), progression dans les formations, résultats de quiz, questions publiées, et historique des paiements (montants, dates, référence du processeur). Les données de carte sont traitées exclusivement par Stripe et ne transitent jamais par nos serveurs.

## Finalités
Fournir l'accès aux formations, suivre la progression, émettre les certificats, gérer les paiements et le soutien. Aucune vente de données à des tiers.

## Témoins (cookies)
Un seul témoin de session, strictement nécessaire au fonctionnement du compte. Aucun témoin publicitaire n'est déposé par la plateforme elle-même.

## Conservation et droits
Les données sont conservées tant que le compte est actif. Vous pouvez demander l'accès, la rectification ou la suppression de vos renseignements à l'adresse de soutien. Responsable de la protection des renseignements personnels : l'exploitant de la plateforme, joignable à la même adresse.`)}</div>`);
}

// ---------- Démarrage ----------
(async () => {
  try { const [me, cfg] = await Promise.all([api("/api/me"), api("/api/config")]); state.user = me.user; state.config = cfg; } catch {}
  render();
})();
