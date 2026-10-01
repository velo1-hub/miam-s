// Quote draft (brouillon de soumission). Prices come ONLY from the owner's rate card; a missing price stays blank.
import type { Dossier } from "./dossier.ts";

export type RateItem = { key: string; label_fr: string; label_en: string; unit: "unit" | "linear_m" | "storey" | "hour" | "lump_sum"; unit_price: number | null; applies_to: string; structure_type: string | null; active?: boolean };
export type Settings = {
  name?: string; minimum_project?: number; quote_valid_days?: number; rbq?: string | null;
  warranty_fr?: string | null; warranty_en?: string | null; payment_terms_fr?: string | null; payment_terms_en?: string | null;
  gst_rate?: number; qst_rate?: number;
};
export type QuoteLine = { key: string; label: string; unit: RateItem["unit"]; qty: number | null; unit_price: number | null; amount: number | null; note?: string };
export type QuoteData = {
  lang: "fr" | "en"; lines: QuoteLine[]; subtotal: number; gst: number; qst: number; total: number; complete: boolean;
  scope: string[]; assumptions: string[]; exclusions: string[]; terms: string[]; warnings: string[];
  client: { name?: string; org?: string; address?: string; phone?: string; email?: string }; valid_days: number;
};

const r2 = (n: number) => Math.round(n * 100) / 100;
/** "1234 rue X, Montréal, H2J 2J5" without repeating parts already typed in the address. */
export function joinAddress(...parts: (string | undefined)[]): string | undefined {
  const out: string[] = [];
  for (const p of parts) if (p && !out.some((o) => o.toLowerCase().includes(p.toLowerCase()))) out.push(p);
  return out.join(", ") || undefined;
}
const STRUCT_KEY: Record<string, string> = { balcony: "paint_balcony", service_stair: "paint_service_stair", spiral: "paint_spiral", facade_stair: "paint_facade_stair", railing: "paint_railing", fence: "paint_fence" };
const T = {
  fr: {
    toMeasure: "À mesurer lors de la visite", toAssess: "À évaluer lors de la visite", noPrice: "Prix à compléter (grille tarifaire)",
    paintScope: ["Protection des surfaces avoisinantes", "Grattage et brossage de la peinture écaillée", "Meulage de la rouille et nettoyage", "Application d’un primer antirouille", "Application d’une peinture à métal industrielle"],
    weldScope: ["Remplacement des sections trop dégradées", "Redressement des structures déformées", "Consolidation et renforcement des zones amincies"],
    assumptions: ["Soumission préparée à partir de l’information fournie en ligne ; quantités et état à confirmer lors de la visite", "Accès au chantier dégagé et stationnement à proximité", "Couleur de finition à confirmer avec le client"],
    exclusions: ["Travaux de maçonnerie, de menuiserie ou de béton", "Remplacement complet de structures (sur soumission distincte)", "Permis municipaux, s’il y a lieu"],
    valid: (n: number) => `Soumission valide ${n} jours.`, minimum: (m: number) => `Montant minimal de ${m.toLocaleString("fr-CA")} $ par projet.`,
    wPrices: "Certains prix ne sont pas encore définis dans la grille tarifaire : compléter avant l’envoi.",
    wQty: "Certaines quantités doivent être mesurées sur place.",
    wMin: "Le total est sous le minimum de projet : ajuster ou appliquer le minimum.",
    wRbq: "Ajoutez votre numéro de licence RBQ aux paramètres avant d’envoyer une soumission.",
    wWarranty: "Précisez les conditions de garantie dans les paramètres.",
    wPay: "Précisez les modalités de paiement dans les paramètres.",
    safety: "Enjeu de sécurité signalé par le client : inspecter en priorité.",
  },
  en: {
    toMeasure: "To be measured at the visit", toAssess: "To be assessed at the visit", noPrice: "Price to complete (rate card)",
    paintScope: ["Protection of surrounding surfaces", "Scraping and brushing of flaking paint", "Rust grinding and cleaning", "Anti-rust primer", "Industrial metal paint"],
    weldScope: ["Replacement of badly degraded sections", "Straightening of deformed structures", "Consolidation and reinforcement of thinned areas"],
    assumptions: ["Quote prepared from information provided online; quantities and condition to be confirmed at the visit", "Clear site access and nearby parking", "Finish colour to be confirmed with the client"],
    exclusions: ["Masonry, carpentry or concrete work", "Full structure replacement (separate quote)", "Municipal permits, if required"],
    valid: (n: number) => `Quote valid for ${n} days.`, minimum: (m: number) => `Minimum project amount of $${m.toLocaleString("en-CA")}.`,
    wPrices: "Some prices are not set in the rate card yet: complete them before sending.",
    wQty: "Some quantities must be measured on site.",
    wMin: "Total is below the project minimum: adjust or apply the minimum.",
    wRbq: "Add your RBQ licence number in the settings before sending a quote.",
    wWarranty: "Set your warranty terms in the settings.",
    wPay: "Set your payment terms in the settings.",
    safety: "Client reported a safety concern: inspect first.",
  },
};

export function buildQuote(d: Dossier, rateCard: RateItem[], s: Settings, lang: "fr" | "en" = "fr"): QuoteData {
  const t = T[lang], rates = new Map(rateCard.filter((r) => r.active !== false).map((r) => [r.key, r]));
  const lines: QuoteLine[] = [];
  const line = (key: string, qty: number | null, note?: string) => {
    const r = rates.get(key);
    if (!r) return;
    const amount = qty != null && r.unit_price != null ? r2(qty * r.unit_price) : null;
    lines.push({ key, label: lang === "fr" ? r.label_fr : r.label_en, unit: r.unit, qty, unit_price: r.unit_price, amount, note: note ?? (r.unit_price == null ? t.noPrice : undefined) });
  };
  const wt = d.project?.work_type ?? "unknown";
  const paint = wt === "paint" || wt === "both" || wt === "unknown";
  const weld = wt === "weld" || wt === "both" || d.project?.condition === "rust_through";
  if (paint) {
    for (const st of d.project?.structures ?? []) {
      const key = STRUCT_KEY[st.type];
      if (!key) continue;
      const r = rates.get(key);
      const qty = r?.unit === "linear_m" ? st.linear_m ?? null : r?.unit === "storey" ? (st.qty ?? 1) * (st.storeys ?? 1) : st.qty ?? 1;
      line(key, qty, qty == null ? t.toMeasure : st.notes);
    }
  }
  if (weld) { line("weld_hour", null, t.toAssess); line("weld_material", null, t.toAssess); }
  if (lines.length) line("site_protection", 1);

  const priced = lines.filter((l) => l.amount != null);
  const subtotal = r2(priced.reduce((n, l) => n + (l.amount as number), 0));
  const gst = r2(subtotal * (s.gst_rate ?? 0.05)), qst = r2(subtotal * (s.qst_rate ?? 0.09975));
  const complete = lines.length > 0 && priced.length === lines.length;
  const min = s.minimum_project ?? 3000;

  const warnings: string[] = [];
  if (lines.some((l) => l.unit_price == null)) warnings.push(t.wPrices);
  if (lines.some((l) => l.qty == null)) warnings.push(t.wQty);
  if (complete && subtotal < min) warnings.push(t.wMin);
  if (!s.rbq) warnings.push(t.wRbq);
  if (!(lang === "fr" ? s.warranty_fr : s.warranty_en)) warnings.push(t.wWarranty);
  if (!(lang === "fr" ? s.payment_terms_fr : s.payment_terms_en)) warnings.push(t.wPay);
  if (d.project?.safety_concern) warnings.unshift(t.safety);

  const terms = [t.valid(s.quote_valid_days ?? 30), t.minimum(min)];
  const pay = lang === "fr" ? s.payment_terms_fr : s.payment_terms_en; if (pay) terms.push(pay);
  const war = lang === "fr" ? s.warranty_fr : s.warranty_en; if (war) terms.push(war);

  return {
    lang, lines, subtotal, gst, qst, total: r2(subtotal + gst + qst), complete,
    scope: [...(paint ? t.paintScope : []), ...(weld ? t.weldScope : [])],
    assumptions: t.assumptions, exclusions: t.exclusions, terms, warnings,
    client: { name: d.contact?.name, org: d.org?.org_name, address: joinAddress(d.site?.address, d.site?.city, d.site?.postal), phone: d.contact?.phone, email: d.contact?.email },
    valid_days: s.quote_valid_days ?? 30,
  };
}

/** Recompute totals after the owner edits lines in the dashboard. */
export function recalc(q: QuoteData, s: Settings): QuoteData {
  const lines = q.lines.map((l) => ({
    ...l, amount: l.qty != null && l.unit_price != null ? r2(l.qty * l.unit_price) : null,
    note: l.unit_price != null && l.note && /^(Prix à compléter|Price to complete)/.test(l.note) ? undefined : l.note,
  }));
  const subtotal = r2(lines.reduce((n, l) => n + (l.amount ?? 0), 0));
  const gst = r2(subtotal * (s.gst_rate ?? 0.05)), qst = r2(subtotal * (s.qst_rate ?? 0.09975));
  return { ...q, lines, subtotal, gst, qst, total: r2(subtotal + gst + qst), complete: lines.length > 0 && lines.every((l) => l.amount != null) };
}

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const money = (n: number | null, lang: "fr" | "en") => (n == null ? "—" : new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD" }).format(n));
const UNIT: Record<string, { fr: string; en: string }> = { unit: { fr: "unité", en: "unit" }, linear_m: { fr: "m lin.", en: "lin. m" }, storey: { fr: "étage", en: "storey" }, hour: { fr: "heure", en: "hour" }, lump_sum: { fr: "forfait", en: "lump sum" } };

/** Printable HTML (self-contained). Marked DRAFT until the owner reviews it. */
export function renderQuoteHtml(q: QuoteData, s: Settings & { phone?: string; email?: string; address?: string }, opts: { number?: string; date?: string; draft?: boolean } = {}): string {
  const fr = q.lang === "fr", L = (a: string, b: string) => (fr ? a : b);
  const rows = q.lines.map((l) => `<tr><td>${esc(l.label)}${l.note ? `<div class="n">${esc(l.note)}</div>` : ""}</td><td class="r">${l.qty ?? "—"} ${esc(UNIT[l.unit]?.[q.lang] ?? "")}</td><td class="r">${money(l.unit_price, q.lang)}</td><td class="r">${money(l.amount, q.lang)}</td></tr>`).join("");
  const list = (h: string, items: string[]) => (items.length ? `<h3>${h}</h3><ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "");
  return `<!doctype html><html lang="${q.lang}"><head><meta charset="utf-8"><title>${L("Soumission", "Quote")} ${esc(opts.number ?? "")}</title>
<style>body{font:14px/1.5 system-ui,sans-serif;color:#14151C;max-width:820px;margin:32px auto;padding:0 20px}h1{font-size:26px;margin:0}h3{margin:22px 0 6px;font-size:15px}table{width:100%;border-collapse:collapse;margin-top:14px}th,td{border-bottom:1px solid #ddd;padding:8px 6px;text-align:left;vertical-align:top}.r{text-align:right;white-space:nowrap}.n{color:#666;font-size:12px}.tot td{border:0}.big{font-weight:700;font-size:16px}.draft{background:#FFF3CD;color:#7A5A00;padding:8px 12px;border-radius:6px;font-weight:600}.warn{color:#8a1c12}.hd{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;border-bottom:3px solid #333657;padding-bottom:14px}@media print{.draft,.warn{display:none}}</style></head><body>
${opts.draft !== false ? `<p class="draft">${L("BROUILLON — à réviser avant l’envoi", "DRAFT — review before sending")}</p>` : ""}
${q.warnings.length ? `<ul class="warn">${q.warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>` : ""}
<div class="hd"><div><h1>${esc(s.name ?? "Pro Fer Forgé")}</h1><div>${esc(s.address ?? "")}</div><div>${esc(s.phone ?? "")} · ${esc(s.email ?? "")}</div>${s.rbq ? `<div>RBQ ${esc(s.rbq)}</div>` : ""}</div>
<div><strong>${L("Soumission", "Quote")} ${esc(opts.number ?? "")}</strong><div>${esc(opts.date ?? "")}</div></div></div>
<h3>${L("Client", "Client")}</h3><div>${[q.client.name, q.client.org, q.client.address, q.client.phone, q.client.email].filter(Boolean).map(esc).join("<br>")}</div>
<table><thead><tr><th>${L("Description", "Description")}</th><th class="r">${L("Qté", "Qty")}</th><th class="r">${L("Prix unitaire", "Unit price")}</th><th class="r">${L("Montant", "Amount")}</th></tr></thead><tbody>${rows}</tbody>
<tbody class="tot"><tr><td></td><td></td><td class="r">${L("Sous-total", "Subtotal")}</td><td class="r">${money(q.subtotal, q.lang)}</td></tr><tr><td></td><td></td><td class="r">TPS/GST (5 %)</td><td class="r">${money(q.gst, q.lang)}</td></tr><tr><td></td><td></td><td class="r">TVQ/QST (9,975 %)</td><td class="r">${money(q.qst, q.lang)}</td></tr><tr><td></td><td></td><td class="r big">Total</td><td class="r big">${money(q.total, q.lang)}</td></tr></tbody></table>
${list(L("Étendue des travaux", "Scope of work"), q.scope)}${list(L("Hypothèses", "Assumptions"), q.assumptions)}${list(L("Exclusions", "Exclusions"), q.exclusions)}${list(L("Conditions", "Terms"), q.terms)}
<p style="margin-top:36px">${L("Signature du client", "Client signature")} : ______________________ &nbsp; ${L("Date", "Date")} : ____________</p></body></html>`;
}
