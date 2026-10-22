// The 1% — administration : statistiques, étudiants, commandes, contenu (cours/modules/leçons/quiz), médias, codes promo, réglages.
import { state, $, esc, money, fmtDate, hours, api, toast, navigate, md } from "/app.js";

const main = (html) => { $("#main").innerHTML = html; };
const SECTIONS = [["", "Tableau de bord"], ["etudiants", "Étudiants"], ["commandes", "Commandes"], ["formations", "Contenu"], ["medias", "Médias"], ["coupons", "Codes promo"], ["reglages", "Réglages"]];

export async function renderAdmin({ section = "", id } = {}) {
  if (!state.user) return navigate(`/connexion?next=${encodeURIComponent(location.pathname)}`);
  if (state.user.role !== "admin") return main(`<div class="wrap section"><div class="empty">Réservé à l'administration.</div></div>`);
  const nav = `<nav>${SECTIONS.map(([s, l]) => `<a href="/admin${s ? "/" + s : ""}" class="${section === s ? "active" : ""}">${l}</a>`).join("")}</nav>`;
  const body = (html) => main(`<div class="wrap admin">${nav}<div>${html}</div></div>`);
  try {
    if (section === "") return body(await statsView());
    if (section === "etudiants") return body(await studentsView());
    if (section === "etudiant") return body(await studentView(id));
    if (section === "commandes") return body(await ordersView());
    if (section === "formations") return body(await coursesView());
    if (section === "formation") return body(await courseEditor(id));
    if (section === "medias") return body(await mediaView());
    if (section === "coupons") return body(await couponsView());
    if (section === "reglages") return body(await settingsView());
    body(`<div class="empty">Section inconnue.</div>`);
  } catch (e) { body(`<div class="empty">${esc(e.message)}</div>`); }
}
const head = (title, extra = "") => `<div class="page-head"><div><div class="eyebrow">Administration</div><h1 style="font-size:34px">${title}</h1></div><div>${extra}</div></div>`;
const on = (sel, ev, fn) => document.querySelectorAll(sel).forEach((el) => (el[ev] = fn));
const confirmDo = async (msg, fn) => { if (confirm(msg)) { try { await fn(); toast("Fait."); renderAdmin(current()); } catch (e) { toast(e.message, true); } } };
const current = () => { const m = /^\/admin(?:\/([^/]+))?(?:\/([^/]+))?/.exec(location.pathname); return { section: m[1] || "", id: m[2] }; };

// ---------- Tableau de bord ----------
async function statsView() {
  const s = await api("/api/admin/stats");
  return `${head("Tableau de bord", `<a class="btn btn-ghost btn-sm" href="/api/admin/export/students.csv" download>Exporter les étudiants (CSV)</a>`)}
  <div class="grid grid-4">
    <div class="stat"><div class="n">${s.students}</div><div class="l">étudiants · ${s.new_students_30d} nouveaux (30 j)</div></div>
    <div class="stat"><div class="n">${money(s.revenue_cents)}</div><div class="l">encaissé · ${money(s.revenue_30d_cents)} (30 j)</div></div>
    <div class="stat"><div class="n">${money(s.outstanding_cents)}</div><div class="l">versements à venir (plans actifs)</div></div>
    <div class="stat"><div class="n">${s.certificates}</div><div class="l">certificats · ${s.lessons_completed} leçons complétées</div></div>
  </div>
  <h3 style="margin-top:36px">Par formation</h3>
  <div class="table-wrap"><table class="table"><thead><tr><th>Formation</th><th>Inscrits</th><th>Certifiés</th><th>Revenus</th></tr></thead><tbody>${s.byCourse.map((c) => `<tr><td><a href="/admin/formation/${c.id}">${esc(c.title)}</a></td><td>${c.enrolled}</td><td>${c.certified}</td><td>${money(c.revenue_cents)}</td></tr>`).join("")}</tbody></table></div>
  ${s.overdue.length ? `<h3 style="margin-top:36px">Versements en retard <span class="badge badge-err">${s.overdue.length}</span></h3><div class="table-wrap"><table class="table"><thead><tr><th>Étudiant</th><th>Formation</th><th>Versement</th><th>Échéance</th><th>Montant</th><th></th></tr></thead><tbody>${s.overdue.map((o) => `<tr><td>${esc(o.name)}<br><span class="dim small">${esc(o.email)}</span></td><td>${esc(o.course_title)}</td><td>${o.number}</td><td>${fmtDate(o.due_at)}</td><td>${money(o.amount_cents)}</td><td><button class="btn btn-sm btn-ghost" data-paid="${o.id}">Marquer payé</button></td></tr>`).join("")}</tbody></table></div>` : ""}
  ${s.btc_pending?.length ? `<h3 style="margin-top:36px">Factures Bitcoin en attente <span class="badge badge-warn">${s.btc_pending.length}</span></h3><div class="table-wrap"><table class="table"><thead><tr><th>Étudiant</th><th>Versement</th><th>Montant</th><th>BTC</th><th>Statut</th><th>Créée</th></tr></thead><tbody>${s.btc_pending.map((b) => `<tr><td>${esc(b.name)}<br><span class="dim small">${esc(b.email)}</span></td><td>${b.number}</td><td>${money(b.amount_cents)}</td><td>${(b.sats / 1e8).toFixed(8)}</td><td>${b.status === "seen" ? `<span class="badge badge-warn">détectée · ${b.confirmations} conf.</span>` : '<span class="badge">en attente</span>'}</td><td class="dim">${fmtDate(b.created_at)}</td></tr>`).join("")}</tbody></table></div>` : ""}
  <h3 style="margin-top:36px">Derniers inscrits</h3>
  <div class="table-wrap"><table class="table"><tbody>${s.recent.map((r) => `<tr><td>${esc(r.name)}</td><td class="muted">${esc(r.email)}</td><td class="dim">${fmtDate(r.created_at)}</td></tr>`).join("") || "<tr><td class='muted'>Aucun étudiant pour le moment.</td></tr>"}</tbody></table></div>
  ${bindLater(() => on("[data-paid]", "onclick", (e) => confirmDo("Marquer ce versement comme payé (virement reçu) ?", () => api(`/api/admin/installments/${e.target.dataset.paid}/paid`, { method: "POST" }))))}`;
}
// Petit utilitaire : exécute une fonction de liaison après le rendu du HTML retourné.
function bindLater(fn) { setTimeout(fn, 0); return ""; }

// ---------- Étudiants ----------
async function studentsView() {
  const qs = new URLSearchParams(location.search).get("q") || "";
  const users = await api(`/api/admin/users?q=${encodeURIComponent(qs)}`);
  return `${head("Étudiants", `<span class="badge">${users.length}</span>`)}
  <div class="toolbar"><input id="q" placeholder="Rechercher par nom ou courriel…" value="${esc(qs)}"><button class="btn btn-ghost btn-sm" id="enrollBtn">+ Inscrire manuellement</button></div>
  <div class="table-wrap"><table class="table"><thead><tr><th>Nom</th><th>Courriel</th><th>Rôle</th><th>Formations</th><th>Leçons</th><th>Payé</th><th>Inscrit le</th></tr></thead><tbody>
  ${users.map((u) => `<tr><td><a href="/admin/etudiant/${u.id}">${esc(u.name)}</a></td><td class="muted">${esc(u.email)}</td><td>${u.role === "admin" ? '<span class="badge badge-gold">admin</span>' : ""}</td><td>${u.enrollments}</td><td>${u.lessons_done}</td><td>${money(u.paid_cents)}</td><td class="dim">${fmtDate(u.created_at)}</td></tr>`).join("")}</tbody></table></div>
  ${bindLater(() => { $("#q").onkeydown = (e) => { if (e.key === "Enter") navigate(`/admin/etudiants?q=${encodeURIComponent(e.target.value)}`); }; $("#enrollBtn").onclick = enrollDialog; })}`;
}
async function enrollDialog() {
  const courses = await api("/api/admin/courses");
  const email = prompt("Courriel de l'étudiant (le compte doit exister) :"); if (!email) return;
  const choice = prompt(`Numéro de la formation :\n${courses.map((c, i) => `${i + 1}. ${c.title}`).join("\n")}`); const c = courses[Number(choice) - 1]; if (!c) return;
  try { await api("/api/admin/enroll", { method: "POST", body: { email, course_id: c.id } }); toast("Inscription ajoutée."); renderAdmin(current()); } catch (e) { toast(e.message, true); }
}
async function studentView(id) {
  const d = await api(`/api/admin/users/${id}`);
  const u = d.user;
  return `${head(esc(u.name), `<a class="btn btn-ghost btn-sm" href="/admin/etudiants">← Étudiants</a>`)}
  <div class="grid grid-2">
    <div class="card"><h4>Compte</h4><dl class="kv"><dt>Courriel</dt><dd>${esc(u.email)}</dd><dt>Rôle</dt><dd>${u.role}</dd><dt>Inscrit le</dt><dd>${fmtDate(u.created_at)}</dd><dt>Dernière connexion</dt><dd>${fmtDate(u.last_login_at)}</dd></dl>
      <div class="toolbar" style="margin-top:16px"><button class="btn btn-sm btn-ghost" id="pw">Définir un mot de passe</button><button class="btn btn-sm btn-ghost" id="role">${u.role === "admin" ? "Retirer admin" : "Rendre admin"}</button><button class="btn btn-sm btn-ghost" id="enroll">+ Inscrire à une formation</button></div></div>
    <div class="card"><h4>Formations</h4>${d.enrollments.map((e) => `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;gap:10px"><b>${esc(e.title)}</b><span class="dim small">${e.source} · ${fmtDate(e.created_at)}</span></div><div class="progress" style="margin:8px 0"><span style="width:${e.completion.pct}%"></span></div><div class="small muted">${e.completion.done}/${e.completion.lessons} leçons · ${e.completion.quizzesPassed}/${e.completion.quizzes} quiz ${e.certificate ? `· <a href="/certificat/${e.certificate}" target="_blank">certificat</a>` : ""} · <a href="#" data-unenroll="${e.course_id}" style="color:var(--err)">retirer</a></div></div>`).join("") || '<p class="muted">Aucune.</p>'}</div>
  </div>
  <h3 style="margin-top:30px">Commandes et versements</h3>
  ${d.orders.map((o) => `<div class="card" style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>${esc(o.course_title)}</b><span>${money(o.amount_cents, o.currency)} · ${o.plan} · <span class="badge ${o.status === "paid" ? "badge-ok" : o.status === "active" ? "badge-warn" : ""}">${o.status}</span>${o.coupon ? ` · code ${esc(o.coupon)}` : ""} · ${o.provider}</span></div>
    <table class="table" style="margin-top:10px"><tbody>${o.installments.map((i) => `<tr><td>${i.number}. ${esc(i.label)}</td><td>${fmtDate(i.due_at)}</td><td>${money(i.amount_cents, o.currency)}</td><td>${i.status === "paid" ? `<span class="badge badge-ok">payé ${fmtDate(i.paid_at)}</span>` : `<button class="btn btn-sm btn-ghost" data-paid="${i.id}">Marquer payé</button>`}</td></tr>`).join("")}</tbody></table></div>`).join("") || '<p class="muted">Aucune commande.</p>'}
  <h3 style="margin-top:30px">Tentatives de quiz</h3>
  <div class="table-wrap"><table class="table"><tbody>${d.attempts.map((a) => `<tr><td>${esc(a.title)}</td><td>${a.score_pct} %</td><td>${a.passed ? '<span class="badge badge-ok">réussi</span>' : '<span class="badge badge-err">échoué</span>'}</td><td class="dim">${fmtDate(a.created_at)}</td></tr>`).join("") || "<tr><td class='muted'>Aucune.</td></tr>"}</tbody></table></div>
  ${bindLater(() => {
    $("#pw").onclick = () => { const p = prompt("Nouveau mot de passe (8+ caractères) :"); if (p) confirmDo("Remplacer le mot de passe ?", () => api(`/api/admin/users/${id}`, { method: "PUT", body: { password: p } })); };
    $("#role").onclick = () => confirmDo("Changer le rôle ?", () => api(`/api/admin/users/${id}`, { method: "PUT", body: { role: u.role === "admin" ? "student" : "admin" } }));
    $("#enroll").onclick = async () => { const courses = await api("/api/admin/courses"); const ch = prompt(`Numéro de la formation :\n${courses.map((c, i) => `${i + 1}. ${c.title}`).join("\n")}`); const c = courses[Number(ch) - 1]; if (c) confirmDo(`Inscrire à « ${c.title} » ?`, () => api("/api/admin/enroll", { method: "POST", body: { user_id: id, course_id: c.id } })); };
    on("[data-unenroll]", "onclick", (e) => { e.preventDefault(); confirmDo("Retirer l'inscription (la progression est conservée) ?", () => api("/api/admin/enroll", { method: "DELETE", body: { user_id: id, course_id: e.target.dataset.unenroll } })); });
    on("[data-paid]", "onclick", (e) => confirmDo("Marquer ce versement comme payé ?", () => api(`/api/admin/installments/${e.target.dataset.paid}/paid`, { method: "POST" })));
  })}`;
}

// ---------- Commandes ----------
async function ordersView() {
  const orders = await api("/api/admin/orders");
  return `${head("Commandes", `<span class="badge">${orders.length}</span>`)}
  <div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Étudiant</th><th>Formation</th><th>Plan</th><th>Total</th><th>Payé</th><th>Statut</th><th>Via</th><th>Date</th></tr></thead><tbody>
  ${orders.map((o) => `<tr><td>${o.id}</td><td>${esc(o.name)}<br><span class="dim small">${esc(o.email)}</span></td><td>${esc(o.course_title)}</td><td>${o.plan}${o.coupon ? `<br><span class="dim small">${esc(o.coupon)}</span>` : ""}</td><td>${money(o.amount_cents, o.currency)}</td><td>${money(o.paid_cents, o.currency)}</td><td><span class="badge ${o.status === "paid" ? "badge-ok" : o.status === "active" ? "badge-warn" : o.status === "pending" ? "" : "badge-err"}">${o.status}</span></td><td class="dim">${o.provider}</td><td class="dim">${fmtDate(o.created_at)}</td></tr>`).join("") || "<tr><td colspan='9' class='muted'>Aucune commande.</td></tr>"}</tbody></table></div>`;
}

// ---------- Codes promo ----------
async function couponsView() {
  const coupons = await api("/api/admin/coupons");
  return `${head("Codes promo")}
  <div class="card" style="margin-bottom:20px"><form id="cf" class="row row-3" style="align-items:end"><div class="field" style="margin:0"><label>Code</label><input name="code" placeholder="BIENVENUE" required></div><div class="field" style="margin:0"><label>% de rabais</label><input name="pct_off" type="number" min="1" max="100" required></div><button class="btn btn-gold">Créer / mettre à jour</button></form></div>
  <div class="table-wrap"><table class="table"><thead><tr><th>Code</th><th>Rabais</th><th>Utilisations</th><th>Statut</th><th></th></tr></thead><tbody>${coupons.map((c) => `<tr><td><b>${esc(c.code)}</b></td><td>${c.pct_off} %</td><td>${c.uses}</td><td>${c.active ? '<span class="badge badge-ok">actif</span>' : '<span class="badge">désactivé</span>'}</td><td>${c.active ? `<button class="btn btn-sm btn-ghost" data-off="${esc(c.code)}">Désactiver</button>` : ""}</td></tr>`).join("")}</tbody></table></div>
  ${bindLater(() => { $("#cf").onsubmit = async (e) => { e.preventDefault(); try { await api("/api/admin/coupons", { method: "POST", body: Object.fromEntries(new FormData(e.target)) }); toast("Code enregistré."); renderAdmin(current()); } catch (er) { toast(er.message, true); } }; on("[data-off]", "onclick", (e) => confirmDo("Désactiver ce code ?", () => api(`/api/admin/coupons/${e.target.dataset.off}`, { method: "DELETE" }))); })}`;
}

// ---------- Réglages ----------
async function settingsView() {
  const s = await api("/api/admin/settings");
  const f = (k, label, help = "", type = "input") => `<div class="field"><label>${label}</label>${type === "textarea" ? `<textarea name="${k}" style="min-height:90px">${esc(s[k] || "")}</textarea>` : `<input name="${k}" value="${esc(s[k] || "")}">`}${help ? `<div class="help">${help}</div>` : ""}</div>`;
  return `${head("Réglages")}
  <div class="grid grid-2" style="align-items:start">
  <div class="card"><h4>Marque et confiance</h4><form id="sf">${f("brand_name", "Nom de la marque")}${f("tagline", "Signature (pied de page)")}${f("support_email", "Courriel de soutien")}${f("founder", "Nom du fondateur ou de la fondatrice", "Affiche la section « Qui est derrière The 1% » sur l'accueil quand il est rempli.")}${f("founder_bio", "Présentation du fondateur (markdown)", "Parcours réel, chiffres vérifiables, aucune invention : c'est ce qui crédibilise un prix de 20 000 $.", "textarea")}${f("company_legal", "Raison sociale (ex. The 1% Academy inc., NEQ…)")}${f("company_address", "Adresse d'affaires")}${f("calendly_url", "Lien de réservation des appels de coaching")}${f("community_url", "Lien de la communauté privée")}<button class="btn btn-gold">Enregistrer</button></form></div>
  <div>
  <div class="card"><h4>Paiements</h4><form id="pf">${f("btc_address", "Adresse Bitcoin de réception", "bc1q… (SegWit) ou 1…/3…. Chaque versement génère une facture à montant fixe en BTC ; la blockchain est vérifiée automatiquement via mempool.space. Utilisez une adresse d'un portefeuille que vous contrôlez (matériel de préférence). Pour une adresse différente à chaque facture, branchez un xpub : voir README.")}${f("payment_methods", "Moyens de paiement et ordre (ex. bitcoin,card)", "« bitcoin » = Bitcoin seulement. « bitcoin,card » = Bitcoin en premier, carte Stripe ensuite. La carte n'apparaît que si Stripe est configuré.")}<button class="btn btn-gold">Enregistrer</button></form>
  <p class="muted small" style="margin:14px 0 0">Stripe : <b>${state.config.stripe ? "configuré (paiements réels)" : "non configuré (carte en mode démonstration)"}</b>. Bitcoin : <b>${s.btc_address || s.__btc_env ? "actif" : "inactif (saisissez une adresse)"}</b>.</p></div>
  </div></div>
  ${bindLater(() => { for (const id of ["sf", "pf"]) $("#" + id).onsubmit = async (e) => { e.preventDefault(); try { await api("/api/admin/settings", { method: "PUT", body: Object.fromEntries(new FormData(e.target)) }); toast("Réglages enregistrés."); state.config = await api("/api/config"); } catch (er) { toast(er.message, true); } }; })}`;
}

// ---------- Médias (téléversement de vidéos et fichiers) ----------
export async function uploadFile(file, onProgress) {
  if (state.config.uploads === "blob") {
    // Téléversement direct du navigateur vers Vercel Blob (jeton client émis par /api/admin/upload-token), puis enregistrement.
    const { upload } = await import("https://esm.sh/@vercel/blob@2.8.2/client");
    const safe = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-");
    const blob = await upload(`media/${safe}`, file, { access: "public", handleUploadUrl: "/api/admin/upload-token", multipart: true, contentType: file.type || "application/octet-stream", onUploadProgress: (e) => onProgress && onProgress(Math.round(e.percentage)) });
    return api("/api/admin/uploads/register", { method: "POST", body: { url: blob.url, name: file.name, size: file.size, mime: file.type } });
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/api/admin/upload?name=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader("X-Requested-With", "the1percent");
    xhr.upload.onprogress = (e) => onProgress && e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => { try { const d = JSON.parse(xhr.responseText); xhr.status < 300 ? resolve(d) : reject(new Error(d.error || xhr.statusText)); } catch { reject(new Error("Réponse invalide")); } };
    xhr.onerror = () => reject(new Error("Échec du téléversement"));
    xhr.send(file);
  });
}
function dropzone(id, after) {
  setTimeout(() => {
    const z = $(`#${id}`); if (!z) return; const input = z.querySelector("input[type=file]"); const bar = z.querySelector(".progress span"); const st = z.querySelector(".st");
    const go = async (files) => { for (const f of files) { st.textContent = `Téléversement de ${f.name}…`; try { const r = await uploadFile(f, (p) => (bar.style.width = p + "%")); st.textContent = `✓ ${f.name}`; toast("Fichier téléversé."); after && after(r); } catch (e) { st.textContent = e.message; toast(e.message, true); } } };
    z.onclick = (e) => { if (e.target !== input) input.click(); }; input.onchange = () => go(input.files);
    z.ondragover = (e) => { e.preventDefault(); z.classList.add("over"); }; z.ondragleave = () => z.classList.remove("over"); z.ondrop = (e) => { e.preventDefault(); z.classList.remove("over"); go(e.dataTransfer.files); };
  }, 0);
  return `<div class="drop" id="${id}"><input type="file" multiple accept=".mp4,.webm,.mov,.pdf,.png,.jpg,.jpeg,.webp,.zip,.xlsx,.csv" hidden><div><b>Déposez vos vidéos (MP4, WebM, MOV), PDF ou images ici</b></div><div class="small dim">ou cliquez pour choisir. Jusqu'à 2 Go par fichier.${state.config.uploads === "blob" ? " Stockage infonuagique : l'adresse du fichier est longue et imprévisible, et n'est affichée qu'aux inscrits." : " Les vidéos sont diffusées uniquement aux inscrits."}</div><div class="progress" style="margin-top:12px"><span style="width:0"></span></div><div class="st small muted" style="margin-top:6px"></div></div>`;
}
async function mediaView() {
  const files = await api("/api/admin/uploads");
  const size = (b) => (b > 1e9 ? (b / 1e9).toFixed(2) + " Go" : b > 1e6 ? (b / 1e6).toFixed(1) + " Mo" : Math.round(b / 1e3) + " ko");
  return `${head("Médias", `<span class="badge">${files.length} fichiers</span>`)}
  <p class="muted">Téléversez vos vidéos ici, puis collez l'URL dans le champ « Vidéo » d'une leçon (ou téléversez directement depuis l'éditeur de leçon). Vous pouvez aussi héberger les vidéos sur YouTube (non répertorié), Vimeo ou Bunny Stream et coller leur lien.</p>
  ${dropzone("dz", () => renderAdmin(current()))}
  <div class="table-wrap" style="margin-top:20px"><table class="table"><thead><tr><th>Fichier</th><th>Type</th><th>Taille</th><th>URL</th><th>Ajouté</th><th></th></tr></thead><tbody>${files.map((f) => `<tr><td>${esc(f.original_name)}</td><td class="dim">${esc(f.mime)}</td><td>${size(f.size_bytes)}</td><td><code style="font-size:12px;word-break:break-all">${esc(f.url || "/media/" + f.filename)}</code> <button class="btn btn-sm btn-ghost" data-copy="${esc(f.url || "/media/" + f.filename)}">Copier</button></td><td class="dim">${fmtDate(f.created_at)}</td><td><button class="btn btn-sm btn-danger" data-del="${f.id}">Supprimer</button></td></tr>`).join("") || "<tr><td colspan='6' class='muted'>Aucun fichier.</td></tr>"}</tbody></table></div>
  ${bindLater(() => { on("[data-copy]", "onclick", (e) => { navigator.clipboard.writeText(e.target.dataset.copy); toast("URL copiée."); }); on("[data-del]", "onclick", (e) => confirmDo("Supprimer ce fichier ? Les leçons qui l'utilisent n'auront plus de vidéo.", () => api(`/api/admin/uploads/${e.target.dataset.del}`, { method: "DELETE" }))); })}`;
}

// ---------- Contenu : liste des formations ----------
async function coursesView() {
  const courses = await api("/api/admin/courses");
  return `${head("Contenu", `<button class="btn btn-gold btn-sm" id="newCourse">+ Nouvelle formation</button>`)}
  <div class="grid grid-2">${courses.map((c) => `<article class="card course-card"><div class="accent" style="background:${esc(c.accent)}"></div><div class="pill-list">${c.published ? '<span class="badge badge-ok">publiée</span>' : '<span class="badge badge-warn">brouillon</span>'}${c.featured ? '<span class="badge badge-gold">vedette</span>' : ""}<span class="badge">${c.modules} modules · ${c.lessons} leçons · ${c.quizzes} quiz</span></div><h3>${esc(c.title)}</h3><p class="muted small">${esc(c.subtitle)}</p><div class="foot"><b>${c.price_cents ? money(c.price_cents, c.currency) : "Gratuit"}</b><a class="btn btn-ghost btn-sm" href="/admin/formation/${c.id}">Modifier</a></div></article>`).join("")}</div>
  ${bindLater(() => { $("#newCourse").onclick = async () => { const title = prompt("Titre de la nouvelle formation :"); if (!title) return; try { const r = await api("/api/admin/courses", { method: "POST", body: { title } }); navigate(`/admin/formation/${r.id}`); } catch (e) { toast(e.message, true); } }; })}`;
}

// ---------- Contenu : éditeur d'une formation ----------
async function courseEditor(id) {
  const c = await api(`/api/admin/courses/${id}`);
  const sp = new URLSearchParams(location.search);
  const editLesson = sp.get("lecon"), editQuiz = sp.get("quiz"), editInfo = sp.get("infos") !== null;
  let panel = "";
  if (editInfo) panel = courseInfoForm(c);
  else if (editLesson) { const l = c.modulesList.flatMap((m) => m.lessons).find((x) => x.id === Number(editLesson)); panel = l ? lessonForm(l, c) : ""; }
  else if (editQuiz) { const z = editQuiz === "final" ? c.finalExam : c.modulesList.map((m) => m.quiz).find((x) => x && x.id === Number(editQuiz)); panel = z ? quizForm(z, c) : ""; }
  const tree = `<div class="tree">${c.modulesList.map((m, i) => `<div class="m"><div class="mh"><span class="dim">${i + 1}</span><h4>${esc(m.title)}</h4><button class="btn btn-sm btn-ghost" data-rename-mod="${m.id}">Renommer</button><button class="btn btn-sm btn-ghost" data-add-lesson="${m.id}">+ Leçon</button>${m.quiz ? `<a class="btn btn-sm btn-ghost" href="/admin/formation/${id}?quiz=${m.quiz.id}">Quiz (${m.quiz.questions.length})</a>` : `<button class="btn btn-sm btn-ghost" data-add-quiz="${m.id}">+ Quiz</button>`}<button class="btn btn-sm btn-danger" data-del-mod="${m.id}">✕</button></div>
    ${m.lessons.map((l) => `<div class="l"><span class="dim">${l.has_video ? "▶" : "○"}</span><a class="t" href="/admin/formation/${id}?lecon=${l.id}">${esc(l.title)}</a><span class="dim small">${l.duration_min} min${l.is_preview ? " · aperçu" : ""}</span><button class="btn btn-sm btn-ghost" data-move="${l.id}:-1">↑</button><button class="btn btn-sm btn-ghost" data-move="${l.id}:1">↓</button><button class="btn btn-sm btn-danger" data-del-lesson="${l.id}">✕</button></div>`).join("")}</div>`).join("")}
    <div class="toolbar"><button class="btn btn-ghost btn-sm" id="addMod">+ Module</button>${c.finalExam ? `<a class="btn btn-ghost btn-sm" href="/admin/formation/${id}?quiz=final">Examen final (${c.finalExam.questions.length} questions)</a>` : `<button class="btn btn-ghost btn-sm" id="addFinal">+ Examen final</button>`}</div></div>`;
  setTimeout(() => bindEditor(c), 0);
  return `${head(esc(c.title), `<a class="btn btn-ghost btn-sm" href="/formation/${esc(c.slug)}" target="_blank">Voir la page</a> <a class="btn btn-ghost btn-sm" href="/admin/formation/${id}?infos">Fiche et prix</a> <a class="btn btn-ghost btn-sm" href="/admin/formations">← Contenu</a>`)}
  <div class="pill-list" style="margin-bottom:18px">${c.published ? '<span class="badge badge-ok">publiée</span>' : '<span class="badge badge-warn">brouillon</span>'}<span class="badge">${c.lessons} leçons · ${hours(c.minutes)}</span><span class="badge">${c.price_cents ? money(c.price_cents, c.currency) : "Gratuit"}</span></div>
  ${panel ? `<div class="card" style="margin-bottom:24px">${panel}</div>` : ""}
  ${tree}`;
}
function courseInfoForm(c) {
  const f = (k, label, v, type = "text") => `<div class="field"><label>${label}</label><input name="${k}" type="${type}" value="${esc(v)}"></div>`;
  return `<h3>Fiche, prix et plan de paiement</h3><form id="info">
    <div class="row row-2">${f("title", "Titre", c.title)}${f("slug", "Adresse (slug)", c.slug)}</div>
    <div class="field"><label>Sous-titre</label><input name="subtitle" value="${esc(c.subtitle)}"></div>
    <div class="field"><label>Description (markdown)</label><textarea name="description">${esc(c.description)}</textarea></div>
    <div class="field"><label>Pour qui</label><textarea name="audience" style="min-height:70px">${esc(c.audience)}</textarea></div>
    <div class="row row-4">${f("level", "Niveau", c.level)}${f("hours", "Heures", c.hours, "number")}${f("price_cents", "Prix (cents)", c.price_cents, "number")}${f("currency", "Devise", c.currency)}</div>
    <div class="row row-3">${f("accent", "Couleur d'accent", c.accent)}${f("sort", "Ordre", c.sort ?? 0, "number")}<div class="field"><label>Visibilité</label><label class="check"><input type="checkbox" name="published" ${c.published ? "checked" : ""}> Publiée</label><label class="check"><input type="checkbox" name="featured" ${c.featured ? "checked" : ""}> Vedette</label></div></div>
    <div class="field"><label>Résultats (un par ligne)</label><textarea name="outcomes">${esc(c.outcomes.join("\n"))}</textarea></div>
    <div class="field"><label>Inclus (un par ligne, format « Titre | Détail »)</label><textarea name="includes">${esc(c.includes.map((x) => `${x.title} | ${x.detail}`).join("\n"))}</textarea></div>
    <div class="field"><label>Plan de paiement (JSON ; vide = paiement intégral seulement)</label><textarea name="plan" class="code" style="min-height:140px">${esc(c.plan ? JSON.stringify(c.plan, null, 2) : "")}</textarea><div class="help">Exemple : {"label":"Plan en 3 versements","installments":[{"label":"1er versement","amount_cents":500000,"days":0},{"label":"2e versement","amount_cents":500000,"days":30},{"label":"3e versement","amount_cents":1000000,"days":60}]}. La somme doit égaler le prix.</div></div>
    <button class="btn btn-gold">Enregistrer</button> <button type="button" class="btn btn-danger" id="delCourse">Supprimer la formation</button></form>`;
}
function lessonForm(l, c) {
  return `<h3>Leçon : ${esc(l.title)}</h3><form id="lf">
    <div class="row row-3"><div class="field" style="grid-column:span 2"><label>Titre</label><input name="title" value="${esc(l.title)}" required></div><div class="field"><label>Durée (min)</label><input name="duration_min" type="number" value="${l.duration_min}"></div></div>
    <div class="field"><label>Vidéo (URL YouTube, Vimeo, MP4 ou /media/… téléversé)</label><input name="video_url" value="${esc(l.video_url)}" placeholder="https://… ou /media/…"></div>
    ${dropzone("ldz", (r) => { $('input[name="video_url"]').value = r.url; toast("Vidéo attachée : enregistrez la leçon."); })}
    <div class="field" style="margin-top:16px"><label>Contenu (markdown : ## titres, **gras**, listes, tableaux, > citation)</label><textarea name="content" class="code" style="min-height:420px">${esc(l.content)}</textarea></div>
    <div class="field"><label>Ressources (une par ligne, format « Titre | URL »)</label><textarea name="resources" style="min-height:90px">${esc(l.resources.map(([t, u]) => `${t} | ${u}`).join("\n"))}</textarea></div>
    <label class="check"><input type="checkbox" name="is_preview" ${l.is_preview ? "checked" : ""}> Aperçu gratuit (visible sans inscription)</label>
    <div class="toolbar" style="margin-top:16px"><button class="btn btn-gold">Enregistrer la leçon</button><button type="button" class="btn btn-ghost" id="preview">Prévisualiser le contenu</button><a class="btn btn-ghost" href="/apprendre/${esc(c.slug)}/lecon/${l.id}" target="_blank">Ouvrir dans le lecteur</a></div></form><div id="pv" class="prose" style="margin-top:20px"></div>`;
}
function quizForm(z, c) {
  return `<h3>${esc(z.title)}</h3><form id="qf">
    <div class="row row-2"><div class="field"><label>Titre</label><input name="title" value="${esc(z.title)}"></div><div class="field"><label>% requis</label><input name="pass_pct" type="number" min="1" max="100" value="${z.pass_pct}"></div></div>
    <div class="field"><label>Questions (JSON : [{"q":"…","options":["a","b","c","d"],"answer":1,"why":"…"}])</label><textarea name="questions" class="code" style="min-height:360px">${esc(JSON.stringify(z.questions, null, 2))}</textarea></div>
    <div class="toolbar"><button class="btn btn-gold">Enregistrer le quiz</button><button type="button" class="btn btn-danger" id="delQuiz">Supprimer le quiz</button></div></form>`;
}
function bindEditor(c) {
  const id = c.id;
  const reload = () => renderAdmin(current());
  const post = (path, body, method = "POST") => api(path, { method, body });
  $("#addMod").onclick = async () => { const title = prompt("Titre du module :"); if (title) { await post("/api/admin/modules", { course_id: id, title }); reload(); } };
  const af = $("#addFinal"); if (af) af.onclick = async () => { await post("/api/admin/quizzes", { course_id: id, module_id: null, title: "Examen final", pass_pct: 75, questions: [] }); reload(); };
  on("[data-rename-mod]", "onclick", async (e) => { const m = c.modulesList.find((x) => x.id === Number(e.target.dataset.renameMod)); const title = prompt("Titre :", m.title); if (title === null) return; const summary = prompt("Résumé :", m.summary); await post(`/api/admin/modules/${m.id}`, { title, summary: summary ?? m.summary }, "PUT"); reload(); });
  on("[data-del-mod]", "onclick", (e) => confirmDo("Supprimer ce module et toutes ses leçons ?", () => post(`/api/admin/modules/${e.target.dataset.delMod}`, {}, "DELETE")));
  on("[data-add-lesson]", "onclick", async (e) => { const title = prompt("Titre de la leçon :"); if (title) { const r = await post("/api/admin/lessons", { module_id: e.target.dataset.addLesson, title }); navigate(`/admin/formation/${id}?lecon=${r.id}`); } });
  on("[data-add-quiz]", "onclick", async (e) => { const r = await post("/api/admin/quizzes", { course_id: id, module_id: e.target.dataset.addQuiz, title: "Quiz", pass_pct: 70, questions: [] }); navigate(`/admin/formation/${id}?quiz=${r.id}`); });
  on("[data-del-lesson]", "onclick", (e) => confirmDo("Supprimer cette leçon ?", () => post(`/api/admin/lessons/${e.target.dataset.delLesson}`, {}, "DELETE")));
  on("[data-move]", "onclick", async (e) => {
    const [lid, dir] = e.target.dataset.move.split(":").map(Number);
    const m = c.modulesList.find((x) => x.lessons.some((l) => l.id === lid)); const idx = m.lessons.findIndex((l) => l.id === lid); const j = idx + dir;
    if (j < 0 || j >= m.lessons.length) return;
    const order = [...m.lessons]; [order[idx], order[j]] = [order[j], order[idx]];
    await Promise.all(order.map((l, k) => post(`/api/admin/lessons/${l.id}`, { sort: k }, "PUT"))); reload();
  });
  const info = $("#info"); if (info) {
    info.onsubmit = async (e) => {
      e.preventDefault(); const fd = new FormData(info); const b = Object.fromEntries(fd);
      b.published = fd.get("published") === "on"; b.featured = fd.get("featured") === "on"; b.hours = Number(b.hours); b.price_cents = Number(b.price_cents); b.sort = Number(b.sort);
      b.outcomes = b.outcomes.split("\n").map((s) => s.trim()).filter(Boolean);
      b.includes = b.includes.split("\n").map((s) => s.trim()).filter(Boolean).map((s) => { const [title, ...d] = s.split("|"); return { title: title.trim(), detail: d.join("|").trim() }; });
      try { b.plan = b.plan.trim() ? JSON.parse(b.plan) : null; } catch { return toast("Plan de paiement : JSON invalide", true); }
      if (b.plan && b.plan.installments.reduce((s, i) => s + i.amount_cents, 0) !== b.price_cents) return toast("La somme des versements doit égaler le prix", true);
      try { await post(`/api/admin/courses/${id}`, b, "PUT"); toast("Fiche enregistrée."); reload(); } catch (er) { toast(er.message, true); }
    };
    $("#delCourse").onclick = () => confirmDo("Supprimer définitivement cette formation, ses leçons, inscriptions et progrès ?", async () => { await post(`/api/admin/courses/${id}`, {}, "DELETE"); navigate("/admin/formations"); });
  }
  const lf = $("#lf"); if (lf) {
    const lid = new URLSearchParams(location.search).get("lecon");
    lf.onsubmit = async (e) => {
      e.preventDefault(); const fd = new FormData(lf); const b = Object.fromEntries(fd);
      b.is_preview = fd.get("is_preview") === "on"; b.duration_min = Number(b.duration_min) || 10;
      b.resources = b.resources.split("\n").map((s) => s.trim()).filter(Boolean).map((s) => { const [t, ...u] = s.split("|"); return [t.trim(), (u.join("|").trim() || "#")]; });
      try { await post(`/api/admin/lessons/${lid}`, b, "PUT"); toast("Leçon enregistrée."); reload(); } catch (er) { toast(er.message, true); }
    };
    $("#preview").onclick = () => { $("#pv").innerHTML = md(lf.querySelector('[name="content"]').value); };
  }
  const qf = $("#qf"); if (qf) {
    const qid = new URLSearchParams(location.search).get("quiz"); const z = qid === "final" ? c.finalExam : c.modulesList.map((m) => m.quiz).find((x) => x && x.id === Number(qid));
    qf.onsubmit = async (e) => {
      e.preventDefault(); const b = Object.fromEntries(new FormData(qf)); b.pass_pct = Number(b.pass_pct);
      try { b.questions = JSON.parse(b.questions); } catch { return toast("Questions : JSON invalide", true); }
      try { await post(`/api/admin/quizzes/${z.id}`, b, "PUT"); toast("Quiz enregistré."); reload(); } catch (er) { toast(er.message, true); }
    };
    $("#delQuiz").onclick = () => confirmDo("Supprimer ce quiz ?", async () => { await post(`/api/admin/quizzes/${z.id}`, {}, "DELETE"); navigate(`/admin/formation/${id}`); });
  }
}
