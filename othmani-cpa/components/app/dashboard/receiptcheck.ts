/**
 * Reçus : contrôles de cohérence calculés sur place, sans IA, et petits outils de saisie et d'export.
 * Fonctions pures, sans dépendance : essais dans receiptcheck.test.mjs (node --test).
 */
export type ReceiptLike = {
  id: string; dossier_id: string; created_at: string; vendor: string | null; receipt_date: string | null;
  total_cents: number | null; gst_cents: number | null; qst_cents: number | null; category: string | null;
  status: string; staff_note: string;
};
export type FlagCode = "taxes" | "total" | "futur" | "doublon";
export type Flag = { code: FlagCode; label: string; detail: string };

export const GST_RATE = 0.05;
export const QST_RATE = 0.09975;
/** Écart toléré sur une taxe, en cents : couvre l'arrondi au cent de chaque montant. */
export const TAX_TOLERANCE = 2;
export const MAX_CENTS = 100000000;

const fr = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} $`;

/**
 * Montant saisi en dollars → cents. Vide : null (« Non lu »). Illisible, négatif ou hors limites : undefined.
 * Accepte « 85 », « 85,5 », « 85.50 $ », « 1 234,56 » et « 1,234.56 ».
 */
export function parseDollars(raw: string): number | null | undefined {
  let t = raw.replace(/[\s$]/g, "");
  if (t === "") return null;
  if (t.includes(",") && t.includes(".")) t = t.replace(/,/g, "");
  else t = t.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return undefined;
  const cents = Math.round(Number(t) * 100);
  return Number.isFinite(cents) && cents >= 0 && cents <= MAX_CENTS ? cents : undefined;
}
/** Cents → texte du champ de saisie : « 85,00 ». Rien pour une valeur non lue. */
export const dollarsText = (cents: number | null) => (cents == null ? "" : (cents / 100).toFixed(2).replace(".", ","));

/** Montant avant taxes, quand le total et les deux taxes sont lus : total − TPS − TVQ. Sinon null. */
export function pretaxCents(r: Pick<ReceiptLike, "total_cents" | "gst_cents" | "qst_cents">): number | null {
  if (r.total_cents == null || r.gst_cents == null || r.qst_cents == null) return null;
  return r.total_cents - r.gst_cents - r.qst_cents;
}

/**
 * Cohérence des taxes et du total.
 * - Total et deux taxes lus : le montant avant taxes vaut total − taxes ; la TPS doit en valoir 5 %, la TVQ 9,975 %.
 * - Deux taxes lues sans total : elles doivent correspondre au même montant avant taxes (TVQ = 1,995 × TPS).
 * - Une seule taxe lue avec le total : elle ne peut pas dépasser sa part d'un total entièrement taxable.
 */
export function taxFlags(r: Pick<ReceiptLike, "total_cents" | "gst_cents" | "qst_cents">): Flag[] {
  const { total_cents: total, gst_cents: gst, qst_cents: qst } = r;
  if (gst != null && qst != null && total != null) {
    const base = total - gst - qst;
    if (base <= 0) return [{ code: "total", label: "Total à revérifier", detail: `Le total (${fr(total)}) ne dépasse pas la somme des taxes (${fr(gst + qst)}).` }];
    const g = Math.round(base * GST_RATE), q = Math.round(base * QST_RATE);
    if (Math.abs(gst - g) > TAX_TOLERANCE || Math.abs(qst - q) > TAX_TOLERANCE) {
      const coherent = Math.abs(qst - gst * (QST_RATE / GST_RATE)) <= TAX_TOLERANCE;
      return [{ code: "taxes", label: "Taxes à revérifier", detail: `Sur ${fr(base)} avant taxes, on attendrait une TPS de ${fr(g)} et une TVQ de ${fr(q)}.${coherent && gst < g ? " Possible si une partie de l'achat n'est pas taxable." : ""}` }];
    }
    return [];
  }
  if (gst != null && qst != null) {
    const q = Math.round(gst * (QST_RATE / GST_RATE));
    return Math.abs(qst - q) > TAX_TOLERANCE ? [{ code: "taxes", label: "Taxes à revérifier", detail: `Pour une TPS de ${fr(gst)}, on attendrait une TVQ de ${fr(q)}.` }] : [];
  }
  if (total != null && (gst != null || qst != null)) {
    const [name, tax, rate] = gst != null ? (["TPS", gst, GST_RATE] as const) : (["TVQ", qst!, QST_RATE] as const);
    // Plafond large : la part de cette taxe si elle était la seule appliquée au total.
    const max = Math.round((total * rate) / (1 + rate));
    return tax > max + TAX_TOLERANCE ? [{ code: "taxes", label: "Taxes à revérifier", detail: `La ${name} lue (${fr(tax)}) dépasse ce qu'un total de ${fr(total)} peut contenir (${fr(max)} au plus).` }] : [];
  }
  return [];
}

/** Vrai si la date du reçu (AAAA-MM-JJ) est après aujourd'hui (AAAA-MM-JJ, heure de Montréal). */
export const isFuture = (receiptDate: string | null, today: string) => !!receiptDate && receiptDate > today;

/** Commerçant comparable : sans accents, sans casse, sans ponctuation ni espaces superflus. */
export const vendorKey = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Doublons probables : même dossier, même commerçant, même total et même date, les trois étant lus.
 * Renvoie, pour chaque reçu concerné, les identifiants des autres reçus identiques.
 */
export function duplicatesOf(list: ReceiptLike[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const r of list) {
    if (!r.vendor || !vendorKey(r.vendor) || r.total_cents == null || !r.receipt_date) continue;
    const k = `${r.dossier_id}|${vendorKey(r.vendor)}|${r.total_cents}|${r.receipt_date}`;
    groups.set(k, [...(groups.get(k) ?? []), r.id]);
  }
  const out = new Map<string, string[]>();
  for (const ids of groups.values()) if (ids.length > 1) for (const id of ids) out.set(id, ids.filter((x) => x !== id));
  return out;
}

/** Tous les signalements d'un reçu. `dups` vient de `duplicatesOf`, calculé sur tous les reçus et non sur la liste filtrée. */
export function flagsOf(r: ReceiptLike, dups: Map<string, string[]>, today: string): Flag[] {
  const out = taxFlags(r);
  if (isFuture(r.receipt_date, today)) out.push({ code: "futur", label: "Date dans le futur", detail: "La date lue est postérieure à aujourd'hui." });
  const n = dups.get(r.id)?.length ?? 0;
  if (n) out.push({ code: "doublon", label: "Doublon probable", detail: n > 1 ? `${n} autres reçus du même dossier ont le même commerçant, le même total et la même date.` : "Un autre reçu du même dossier a le même commerçant, le même total et la même date." });
  return out;
}

export type Totals = { count: number; total: number; gst: number; qst: number; noTotal: number; otherYears: number; undated: number };
/**
 * Totaux des reçus CONFIRMÉS (statut « valide ») dont la date tombe dans l'année donnée.
 * Sans année (dossier sans année d'imposition), tous les reçus confirmés comptent.
 * `otherYears` et `undated` : reçus confirmés laissés de côté, pour le dire à l'écran. `noTotal` : comptés, mais sans total lu.
 */
export function confirmedTotals(list: ReceiptLike[], year: number | null): Totals {
  const t: Totals = { count: 0, total: 0, gst: 0, qst: 0, noTotal: 0, otherYears: 0, undated: 0 };
  for (const r of list) {
    if (r.status !== "valide") continue;
    if (year != null) {
      if (!r.receipt_date) { t.undated++; continue; }
      if (Number(r.receipt_date.slice(0, 4)) !== year) { t.otherYears++; continue; }
    }
    t.count++;
    if (r.total_cents == null) t.noTotal++;
    t.total += r.total_cents ?? 0;
    t.gst += r.gst_cents ?? 0;
    t.qst += r.qst_cents ?? 0;
  }
  return t;
}

/** Champ CSV : toujours entre guillemets, et un début de formule (=, +, -, @) est neutralisé pour les tableurs. Même règle que l'export des rappels. */
export const csvField = (s: string) => `"${(/^[=+\-@\t\r]/.test(s) ? "'" : "") + s.replace(/"/g, '""')}"`;
const amount = (cents: number | null) => (cents == null ? "" : (cents / 100).toFixed(2));
export const CSV_HEAD = "date,commercant,categorie,total,tps,tvq,note_au_client,envoye_le";
/** Export des reçus confirmés seulement, du plus ancien au plus récent. Montants en dollars, point décimal ; vide si non lu. */
export function receiptsCsv(list: ReceiptLike[]): string {
  const rows = list.filter((r) => r.status === "valide").sort((a, b) => (a.receipt_date ?? "9999").localeCompare(b.receipt_date ?? "9999") || a.created_at.localeCompare(b.created_at));
  return [CSV_HEAD, ...rows.map((r) => [r.receipt_date ?? "", r.vendor ?? "", r.category ?? "", amount(r.total_cents), amount(r.gst_cents), amount(r.qst_cents), r.staff_note, r.created_at.slice(0, 10)].map(csvField).join(","))].join("\n");
}
