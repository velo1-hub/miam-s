// Pro Fer Forgé: staff dashboard (leads, client dossiers, quote drafts, suggestions, settings).
// Data access goes through Supabase with the public anon key + the signed-in staff session; RLS restricts
// everything to rows in staff_users. On the local dev server, ?demo=1 uses in-memory data instead.
import { recalc, renderQuoteHtml } from "./quote.js";

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === "class") n.className = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? "" : v); } kids.flat().forEach((c) => c != null && c !== false && n.append(c)); return n; };
const cfg = document.body.dataset;
const money = (n) => (n == null ? "—" : new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n));
const when = (iso) => (iso ? new Intl.DateTimeFormat("fr-CA", { timeZone: "America/Montreal", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "—");
const ago = (iso) => { if (!iso) return ""; const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : `il y a ${Math.round(m / 1440)} j`; };
const TEMP = { hot: ["Chaud", "t-hot"], warm: ["Tiède", "t-warm"], cold: ["Froid", "t-cold"], unscored: ["En cours", "t-none"] };
const STATUS = { qualifying: "En qualification", qualified: "Qualifié", visit_booked: "Visite demandée", quote_drafted: "Soumission à réviser", quote_sent: "Soumission envoyée", won: "Gagné", lost: "Perdu", spam: "Indésirable" };
const LABELS = {
  "contact.name": "Nom", "contact.phone": "Téléphone", "contact.email": "Courriel", "contact.preferred_contact": "Contact préféré", "contact.best_time": "Meilleur moment",
  "org.client_type": "Type de client", "org.org_name": "Organisation", "org.role": "Rôle", "org.is_decision_maker": "Décideur", "org.approval_status": "Approbation", "org.decision_date": "Date de décision",
  "site.address": "Adresse", "site.city": "Ville", "site.postal": "Code postal", "site.borough": "Arrondissement", "site.access_notes": "Accès", "site.height_storeys": "Étages",
  "project.work_type": "Travaux", "project.condition": "État", "project.safety_concern": "Enjeu de sécurité", "project.safety_notes": "Sécurité (notes)", "project.photos_promised": "Photos promises", "project.description": "Description",
  "timing.urgency": "Échéancier", "timing.deadline": "Échéance", "budget.range": "Budget", "budget.has_competing_quotes": "Autres soumissions", "notes": "Notes",
};
const VALUES = { condo: "Copropriété", coop: "Coopérative", building_owner: "Propriétaire d’immeuble", homeowner: "Propriétaire résidentiel", other: "Autre", board_member: "Membre du CA", property_manager: "Gestionnaire", owner: "Propriétaire", tenant: "Locataire",
  approved: "Approuvé", pending_board: "Conseil à venir", pending_agm: "Assemblée à venir", unknown: "Inconnu", paint: "Peinture", weld: "Soudure", both: "Peinture + soudure", good: "Bon état", flaking: "Écaillé", rusted: "Rouillé", rust_through: "Rouille perforante",
  asap: "Dès que possible", "1_3_months": "1 à 3 mois", this_season: "Cette saison", planning: "En planification", phone: "Téléphone", email: "Courriel", sms: "Texto", true: "Oui", false: "Non",
  balcony: "Balcon", service_stair: "Escalier de service", spiral: "Colimaçon", facade_stair: "Escalier de façade", railing: "Garde-corps", fence: "Clôture" };
const v = (x) => VALUES[String(x)] ?? String(x);
const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

// ---------------- Data layer ----------------
function supabaseApi() {
  const sb = window.supabase.createClient(cfg.sbUrl, cfg.sbKey);
  const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
  return {
    async session() { return (await sb.auth.getSession()).data.session; },
    onAuth(cb) { sb.auth.onAuthStateChange((_e, s) => cb(s)); },
    async login(email) { const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href.split("#")[0], shouldCreateUser: false } }); if (error) throw error; },
    async logout() { await sb.auth.signOut(); },
    async isStaff() { return !!must(await sb.from("staff_users").select("auth_user_id").maybeSingle()); },
    async leads() { return must(await sb.from("lead_overview").select("*").order("updated_at", { ascending: false }).limit(300)); },
    async lead(id) {
      const [lead, messages, appts, quotes, events] = await Promise.all([
        sb.from("leads").select("*").eq("id", id).single().then(must),
        sb.from("conversation_messages").select("role, display_text, created_at").eq("lead_id", id).not("display_text", "is", null).order("id").then(must),
        sb.from("appointments").select("*").eq("lead_id", id).order("starts_at").then(must),
        sb.from("quote_drafts").select("*").eq("lead_id", id).order("version", { ascending: false }).limit(1).then(must),
        sb.from("lead_events").select("type, payload, created_at").eq("lead_id", id).order("id", { ascending: false }).limit(30).then(must),
      ]);
      return { lead, messages, appts, quote: quotes[0] ?? null, events };
    },
    async updateLead(id, patch) { must(await sb.from("leads").update(patch).eq("id", id)); },
    async setAppt(id, status) { must(await sb.from("appointments").update({ status }).eq("id", id)); },
    async saveQuote(q) { must(await sb.from("quote_drafts").update({ data: q.data, status: q.status }).eq("id", q.id)); },
    async settings() { return must(await sb.from("settings").select("value").eq("key", "business").single()).value; },
    async saveSettings(value) { must(await sb.from("settings").update({ value }).eq("key", "business")); },
    async rateCard() { return must(await sb.from("rate_card").select("*").order("key")); },
    async saveRate(key, unit_price) { must(await sb.from("rate_card").update({ unit_price }).eq("key", key)); },
    async rules() { return must(await sb.from("availability_rules").select("*").order("weekday").order("start_time")); },
    async addRule(r) { must(await sb.from("availability_rules").insert(r)); },
    async delRule(id) { must(await sb.from("availability_rules").delete().eq("id", id)); },
  };
}
function demoApi() {
  let db = null;
  const load = async () => (db ??= await (await fetch("/api/debug/leads")).json());
  const settings = { name: "Pro Fer Forgé", minimum_project: 3000, quote_valid_days: 30, rbq: null, warranty_fr: null, payment_terms_fr: null, response_time_text_fr: "dès que possible", gst_rate: 0.05, qst_rate: 0.09975 };
  let rates = null, rules = [1, 2, 3, 4, 5].map((weekday, i) => ({ id: i + 1, weekday, start_time: "08:00", end_time: "16:00" }));
  return {
    async session() { return { user: { email: "demo@proferforge.ca" } }; }, onAuth() {}, async login() {}, async logout() { location.reload(); }, async isStaff() { return true; },
    async leads() { const d = await load(); return d.leads.map((l) => ({ ...l, city: l.dossier?.site?.city, work_type: l.dossier?.project?.work_type, next_visit: d.appointments.find((a) => a.lead_id === l.id && a.status !== "cancelled")?.starts_at, has_quote: d.quotes.some((q) => q.lead_id === l.id), updated_at: l.last_message_at })); },
    async lead(id) { const d = await load(); const q = d.quotes.filter((x) => x.lead_id === id).at(-1); return { lead: d.leads.find((l) => l.id === id), messages: d.messages?.[id] ?? [], appts: d.appointments.filter((a) => a.lead_id === id), quote: q ? { status: "draft", ...q } : null, events: [] }; },
    async updateLead(id, patch) { Object.assign(db.leads.find((l) => l.id === id), patch); },
    async setAppt(id, status) { db.appointments.find((a) => a.id === id).status = status; },
    async saveQuote(q) { const t = db.quotes.find((x) => x.id === q.id); t.data = q.data; t.status = q.status; },
    async settings() { return settings; }, async saveSettings(v) { Object.assign(settings, v); },
    async rateCard() { return (rates ??= (await load()).rate_card ?? []); }, async saveRate(key, p) { rates.find((r) => r.key === key).unit_price = p; },
    async rules() { return rules; }, async addRule(r) { rules.push({ id: Date.now(), ...r }); }, async delRule(id) { rules = rules.filter((r) => r.id !== id); },
  };
}
const api = cfg.demo === "1" && /^(localhost|127\.)/.test(location.hostname) ? demoApi() : cfg.sbUrl && window.supabase ? supabaseApi() : null;

// ---------------- Views ----------------
const main = $("#app");
let state = { leads: [], filter: "open", q: "", current: null, settings: null };

async function boot() {
  if (!api) { main.replaceChildren(el("div", { class: "card" }, el("h2", {}, "Configuration requise"), el("p", {}, "Construisez le site avec PF_SUPABASE_URL et PF_SUPABASE_ANON_KEY pour activer le tableau de bord (voir proferforge/backend/README.md)."))); return; }
  api.onAuth(() => route());
  route();
}
async function route() {
  const s = await api.session();
  if (!s) return loginView();
  if (!(await api.isStaff())) { main.replaceChildren(el("div", { class: "card" }, el("h2", {}, "Accès refusé"), el("p", {}, `${s.user.email} n’est pas membre de l’équipe.`), el("button", { class: "btn", onclick: () => api.logout() }, "Se déconnecter"))); return; }
  $("#who").textContent = s.user.email;
  $("#logout").hidden = false;
  state.settings = await api.settings();
  await refresh();
  const m = location.hash.match(/lead=([\w-]+)/);
  if (m) openLead(m[1]);
}
function loginView() {
  const msg = el("p", { class: "muted" });
  const input = el("input", { type: "email", required: true, placeholder: "vous@proferforge.ca", autocomplete: "email", "aria-label": "Courriel" });
  main.replaceChildren(el("form", { class: "card login", onsubmit: async (e) => { e.preventDefault(); try { await api.login(input.value); msg.textContent = "Lien de connexion envoyé. Vérifiez vos courriels."; } catch (err) { msg.textContent = "Erreur : " + err.message; } } },
    el("h2", {}, "Connexion équipe"), el("p", { class: "muted" }, "Recevez un lien de connexion par courriel."), input, el("button", { class: "btn" }, "Recevoir le lien"), msg));
}

async function refresh() {
  state.leads = await api.leads();
  renderList();
}
function filtered() {
  const q = state.q.toLowerCase();
  return state.leads.filter((l) => {
    if (state.filter === "hot" && l.temperature !== "hot") return false;
    if (state.filter === "call" && !l.needs_human) return false;
    if (state.filter === "open" && ["won", "lost", "spam"].includes(l.status)) return false;
    return !q || [l.contact_name, l.email, l.phone, l.city].some((x) => (x ?? "").toLowerCase().includes(q));
  }).sort((a, b) => (b.needs_human - a.needs_human) || ((["hot", "warm", "cold", "unscored"].indexOf(a.temperature)) - (["hot", "warm", "cold", "unscored"].indexOf(b.temperature))) || (b.score ?? 0) - (a.score ?? 0));
}
function renderList() {
  const L = state.leads, open = L.filter((l) => !["won", "lost", "spam"].includes(l.status));
  const kpi = (n, label, cls = "") => el("div", { class: `kpi ${cls}` }, el("strong", {}, String(n)), el("span", {}, label));
  const chip = (id, label) => el("button", { class: `chip${state.filter === id ? " on" : ""}`, onclick: () => { state.filter = id; renderList(); } }, label);
  const rows = filtered().map((l) => el("button", { class: `row${state.current === l.id ? " sel" : ""}`, onclick: () => openLead(l.id) },
    el("span", { class: `temp ${TEMP[l.temperature]?.[1]}` }, TEMP[l.temperature]?.[0] ?? l.temperature, l.score != null ? ` · ${l.score}` : ""),
    el("span", { class: "nm" }, l.contact_name || "Sans nom", l.needs_human ? el("em", { class: "flag" }, "À rappeler") : null),
    el("span", { class: "muted" }, [l.city, v(l.work_type ?? "")].filter(Boolean).join(" · ")),
    el("span", { class: "st" }, STATUS[l.status] ?? l.status), el("span", { class: "muted" }, l.next_visit ? `Visite ${when(l.next_visit)}` : ago(l.updated_at))));
  main.replaceChildren(
    el("section", { class: "kpis" }, kpi(open.filter((l) => l.temperature === "hot").length, "leads chauds", "k-hot"), kpi(L.filter((l) => l.needs_human).length, "à rappeler"), kpi(L.filter((l) => l.next_visit).length, "visites à venir"), kpi(L.filter((l) => l.status === "quote_drafted").length, "soumissions à réviser"), kpi(open.length, "dossiers ouverts")),
    el("section", { class: "tools" }, chip("open", "Ouverts"), chip("hot", "Chauds"), chip("call", "À rappeler"), chip("all", "Tous"),
      el("input", { type: "search", placeholder: "Rechercher nom, téléphone, ville…", value: state.q, "aria-label": "Rechercher", oninput: (e) => { state.q = e.target.value; renderRows(); } }),
      el("button", { class: "btn ghost", onclick: () => settingsView() }, "Paramètres")),
    el("div", { class: "split" }, el("div", { class: "list", id: "rows" }, rows.length ? rows : el("p", { class: "muted pad" }, "Aucun dossier.")), el("div", { class: "detail", id: "detail" }, el("p", { class: "muted pad" }, "Sélectionnez un dossier."))));
  if (state.current) openLead(state.current, true);
}
function renderRows() { const keep = state.q; renderList(); const i = $(".tools input"); i.focus(); i.setSelectionRange(keep.length, keep.length); }

async function openLead(id, silent) {
  state.current = id;
  if (!silent) history.replaceState(null, "", `#lead=${id}`);
  document.querySelectorAll(".row").forEach((r) => r.classList.remove("sel"));
  const pane = $("#detail");
  if (!pane) return;
  pane.replaceChildren(el("p", { class: "muted pad" }, "Chargement…"));
  const { lead, messages, appts, quote } = await api.lead(id);
  const d = lead.dossier ?? {};
  const flat = []; const walk = (o, p = "") => { for (const [k, val] of Object.entries(o ?? {})) { const key = p ? `${p}.${k}` : k; if (k === "structures") continue; if (val && typeof val === "object" && !Array.isArray(val)) walk(val, key); else flat.push([key, val]); } }; walk(d);
  const save = async (patch) => { await api.updateLead(id, patch); await refresh(); };
  const statusSel = el("select", { "aria-label": "Statut", onchange: (e) => save({ status: e.target.value }) }, Object.entries(STATUS).map(([k, label]) => el("option", { value: k, selected: k === lead.status }, label)));
  const notes = el("textarea", { rows: 3, placeholder: "Notes internes…" }); notes.value = lead.owner_notes ?? "";

  pane.replaceChildren(
    el("header", { class: "dh" }, el("div", {}, el("h2", {}, lead.contact_name || "Sans nom"), el("p", { class: "muted" }, [d.org?.org_name, v(d.org?.client_type ?? ""), d.site?.city].filter(Boolean).join(" · "))),
      el("span", { class: `temp big ${TEMP[lead.temperature]?.[1]}` }, TEMP[lead.temperature]?.[0], lead.score != null ? ` ${lead.score}/100` : "")),
    el("div", { class: "actions" }, lead.phone && el("a", { class: "btn", href: `tel:${lead.phone}` }, `Appeler ${lead.phone}`), lead.email && el("a", { class: "btn ghost", href: `mailto:${lead.email}` }, "Courriel"), statusSel,
      lead.needs_human && el("button", { class: "btn ghost", onclick: () => save({ needs_human: false }) }, "Marquer rappelé")),
    lead.summary && el("section", { class: "card" }, el("h3", {}, "Résumé"), el("p", {}, lead.summary)),
    el("section", { class: "card" }, el("h3", {}, "Suggestions"), el("ol", { class: "sugg" }, (lead.suggestions ?? []).map((s) => el("li", { class: `p${s.priority}` }, s.fr)))),
    appts.length ? el("section", { class: "card" }, el("h3", {}, "Visite"), appts.map((a) => el("div", { class: "appt" }, el("strong", {}, when(a.starts_at)), el("span", { class: "muted" }, a.address ?? ""), el("span", { class: "st" }, { requested: "Demandée", confirmed: "Confirmée", cancelled: "Annulée", done: "Faite" }[a.status]),
      a.status === "requested" && el("button", { class: "btn sm", onclick: async () => { await api.setAppt(a.id, "confirmed"); openLead(id); } }, "Confirmer"),
      ["requested", "confirmed"].includes(a.status) && el("button", { class: "btn ghost sm", onclick: async () => { await api.setAppt(a.id, "cancelled"); openLead(id); } }, "Annuler"))),
      (lead.visit_questions ?? []).length ? el("details", {}, el("summary", {}, "Questions à poser à la visite"), el("ul", {}, lead.visit_questions.map((q) => el("li", {}, q)))) : null) : null,
    quote ? quoteEditor(quote, lead) : el("section", { class: "card" }, el("h3", {}, "Soumission"), el("p", { class: "muted" }, "Pas encore de brouillon (le dossier n’est pas complet).")),
    el("section", { class: "card" }, el("h3", {}, "Pointage"), el("ul", { class: "reasons" }, (lead.score_reasons ?? []).map((r) => el("li", {}, el("b", { class: r.points < 0 ? "neg" : "" }, `${r.points > 0 ? "+" : ""}${r.points}`), " ", r.fr))),
      (lead.flags ?? []).length ? el("p", { class: "muted" }, "Signaux : " + lead.flags.join(", ")) : null),
    el("section", { class: "card" }, el("h3", {}, "Dossier client"), el("table", { class: "kv" }, flat.map(([k, val]) => el("tr", {}, el("th", {}, LABELS[k] ?? k), el("td", {}, v(val))))),
      (d.project?.structures ?? []).length ? el("p", {}, el("b", {}, "Structures : "), d.project.structures.map((s) => `${s.qty} × ${v(s.type)}${s.storeys ? ` (${s.storeys} étages)` : ""}${s.linear_m ? ` (${s.linear_m} m)` : ""}`).join(", ")) : null),
    el("section", { class: "card" }, el("h3", {}, "Notes internes"), notes, el("button", { class: "btn sm", onclick: () => save({ owner_notes: notes.value }) }, "Enregistrer")),
    el("details", { class: "card" }, el("summary", {}, `Conversation (${messages.length} messages)`), el("div", { class: "transcript" }, messages.map((m) => el("p", { class: m.role }, el("b", {}, m.role === "user" ? "Client : " : "Assistant : "), m.display_text?.replace(/\[\[options:[^\]]*\]\]\s*$/i, ""))))),
  );
}

function quoteEditor(quote, lead) {
  let q = structuredClone(quote.data);
  const box = el("section", { class: "card quote" });
  let drawing = false;
  const draw = () => {
    if (drawing) return; // replacing a focused input fires blur → change → draw again
    drawing = true;
    try { drawInner(); } finally { drawing = false; }
  };
  const drawInner = () => {
    q = recalc(q, state.settings ?? {});
    const num = (val, on) => el("input", { type: "number", min: 0, step: "0.01", value: val ?? "", oninput: (e) => { on(e.target.value === "" ? null : +e.target.value); }, onchange: () => setTimeout(draw) });
    box.replaceChildren(el("h3", {}, `Brouillon de soumission · v${quote.version} · `, el("span", { class: "st" }, { draft: "Brouillon", reviewed: "Révisée", sent: "Envoyée" }[quote.status] ?? quote.status)),
      q.warnings?.length ? el("ul", { class: "warn" }, q.warnings.map((w) => el("li", {}, w))) : null,
      el("table", { class: "ql" }, el("thead", {}, el("tr", {}, el("th", {}, "Description"), el("th", {}, "Qté"), el("th", {}, "Prix unit."), el("th", {}, "Montant"), el("th", {}))),
        el("tbody", {}, q.lines.map((l, i) => el("tr", {}, el("td", {}, el("input", { value: l.label, "aria-label": "Description", onchange: (e) => { l.label = e.target.value; } }), l.note ? el("small", { class: "muted" }, l.note) : null),
          el("td", {}, num(l.qty, (x) => (l.qty = x))), el("td", {}, num(l.unit_price, (x) => (l.unit_price = x))), el("td", { class: "r" }, money(l.amount)),
          el("td", {}, el("button", { class: "x", "aria-label": "Retirer la ligne", onclick: () => { q.lines.splice(i, 1); draw(); } }, "×")))))),
      el("button", { class: "btn ghost sm", onclick: () => { q.lines.push({ key: "custom", label: "Autre", unit: "lump_sum", qty: 1, unit_price: null, amount: null }); draw(); } }, "+ Ajouter une ligne"),
      el("dl", { class: "tot" }, el("dt", {}, "Sous-total"), el("dd", {}, money(q.subtotal)), el("dt", {}, "TPS 5 %"), el("dd", {}, money(q.gst)), el("dt", {}, "TVQ 9,975 %"), el("dd", {}, money(q.qst)), el("dt", { class: "b" }, "Total"), el("dd", { class: "b" }, money(q.total))),
      el("div", { class: "actions" },
        el("button", { class: "btn", onclick: async () => { await api.saveQuote({ id: quote.id, data: q, status: "reviewed" }); quote.status = "reviewed"; quote.data = q; draw(); } }, "Enregistrer (révisée)"),
        el("button", { class: "btn ghost", onclick: () => preview(q, lead, quote) }, "Aperçu / imprimer"),
        el("button", { class: "btn ghost", onclick: async () => { await api.saveQuote({ id: quote.id, data: q, status: "sent" }); await api.updateLead(lead.id, { status: "quote_sent" }); quote.status = "sent"; await refresh(); } }, "Marquer envoyée")));
  };
  draw();
  return box;
}
function preview(q, lead, quote) {
  const s = state.settings ?? {};
  const html = renderQuoteHtml(q, { ...s, phone: "(438) 815-7232", email: "info@proferforge.ca", address: "936 Avenue du Mont-Royal E, Montréal (QC) H2J 1X2" }, { number: `S-${lead.id.slice(0, 6).toUpperCase()}-${quote.version}`, date: new Date().toLocaleDateString("fr-CA"), draft: quote.status === "draft" });
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function settingsView() {
  const [s, rates, rules] = await Promise.all([api.settings(), api.rateCard(), api.rules()]);
  const f = (key, label, type = "text") => { const i = el(type === "textarea" ? "textarea" : "input", { type, rows: 2, "data-k": key }); i.value = s[key] ?? ""; return el("label", { class: "fld" }, el("span", {}, label), i); };
  const pane = $("#detail");
  state.current = null;
  pane.replaceChildren(
    el("header", { class: "dh" }, el("h2", {}, "Paramètres")),
    el("form", { class: "card", onsubmit: async (e) => { e.preventDefault(); const nv = { ...s }; e.target.querySelectorAll("[data-k]").forEach((i) => { const k = i.dataset.k; nv[k] = i.type === "number" ? (i.value === "" ? null : +i.value) : i.value.trim() || null; }); await api.saveSettings(nv); state.settings = nv; e.target.querySelector(".ok").textContent = "Enregistré ✓"; } },
      el("h3", {}, "Entreprise et soumissions"), f("rbq", "Numéro de licence RBQ"), f("minimum_project", "Montant minimal ($)", "number"), f("quote_valid_days", "Validité des soumissions (jours)", "number"),
      f("warranty_fr", "Garantie (texte de la soumission)", "textarea"), f("payment_terms_fr", "Modalités de paiement", "textarea"), f("response_time_text_fr", "Délai de réponse annoncé au client"),
      el("button", { class: "btn" }, "Enregistrer"), el("span", { class: "ok muted" })),
    el("section", { class: "card" }, el("h3", {}, "Grille tarifaire"), el("p", { class: "muted" }, "Laissez vide un prix non fixé : il restera « à compléter » dans les brouillons."),
      el("table", { class: "ql" }, el("tbody", {}, rates.map((r) => el("tr", {}, el("td", {}, r.label_fr), el("td", { class: "muted" }, { unit: "par unité", linear_m: "par m linéaire", storey: "par étage", hour: "par heure", lump_sum: "forfait" }[r.unit]),
        el("td", {}, el("input", { type: "number", min: 0, step: "0.01", value: r.unit_price ?? "", "aria-label": `Prix ${r.label_fr}`, onchange: (e) => api.saveRate(r.key, e.target.value === "" ? null : +e.target.value) }))))))),
    el("section", { class: "card" }, el("h3", {}, "Disponibilités pour les visites"), el("p", { class: "muted" }, "L’assistant ne propose que ces plages (fuseau de Montréal, visites d’une heure, au moins 24 h à l’avance)."),
      el("ul", { class: "rules" }, rules.map((r) => el("li", {}, `${DAYS[r.weekday]} ${r.start_time.slice(0, 5)} – ${r.end_time.slice(0, 5)} `, el("button", { class: "x", "aria-label": "Retirer", onclick: async () => { await api.delRule(r.id); settingsView(); } }, "×")))),
      el("form", { class: "inline", onsubmit: async (e) => { e.preventDefault(); const fd = new FormData(e.target); await api.addRule({ weekday: +fd.get("wd"), start_time: fd.get("a"), end_time: fd.get("b") }); settingsView(); } },
        el("select", { name: "wd", "aria-label": "Jour" }, DAYS.map((d, i) => el("option", { value: i }, d))), el("input", { type: "time", name: "a", value: "08:00", required: true, "aria-label": "Début" }), el("input", { type: "time", name: "b", value: "16:00", required: true, "aria-label": "Fin" }), el("button", { class: "btn sm" }, "Ajouter"))),
  );
}

$("#logout").addEventListener("click", () => api?.logout());
boot().catch((e) => { console.error(e); main.replaceChildren(el("div", { class: "card" }, el("h2", {}, "Erreur"), el("p", {}, e.message))); });
