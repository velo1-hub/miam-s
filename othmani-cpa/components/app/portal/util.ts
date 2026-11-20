import type { Lang } from "@/lib/site";
import type { Appointment, Doc, DocRequest, Dossier, Invoice, Message, Signature } from "../shared";

export type Tab = "home" | "track" | "docs" | "quest" | "messages" | "sign" | "pay" | "appt" | "profile";
/** Questionnaire annuel (réponses « true » / « false » par clé) et avis privé de fin de dossier. */
export type Questionnaire = { id: string; dossier_id: string; submitted_at: string; answers: Record<string, string>; note: string };
/** On ne lit jamais la note ni le commentaire : seule l'existence de l'avis compte ici. */
export type Feedback = { id: string; dossier_id: string; created_at: string };
export type Upload = { key: string; name: string; state: "busy" | "ok" | "error"; note?: string };
/** `null` pour une liste secondaire = le chargement a échoué (à distinguer d'une liste vide). */
export type PortalData = {
  id: string; reqs: DocRequest[]; msgs: Message[]; docs: Doc[];
  sigs: Signature[] | null; invoices: Invoice[] | null; appts: Appointment[] | null;
  quests: Questionnaire[] | null; feedback: Feedback[] | null;
};
export type Go = (tab: Tab) => void;
export type UploadFn = (files: File[], requestId: string | null) => void;
export type { Dossier };

export const MAX_BYTES = 25 * 1024 * 1024;
export const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.csv,.xls,.xlsx,.docx";

export const fmtSize = (n: number, lang: Lang) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} ${lang === "fr" ? "Mo" : "MB"}` : `${Math.max(1, Math.round(n / 1024))} ${lang === "fr" ? "ko" : "KB"}`);
export const safeName = (n: string) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
export const uuid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${String(Math.random()).slice(2)}`);
export const time = (iso: string | undefined | null) => (iso ? Date.parse(iso) || 0 : 0);
export const safePayUrl = (u: string | null | undefined) => (typeof u === "string" && u.startsWith("https://") ? u : null);
/** Liens construits à partir de données : téléphone réduit aux chiffres, courriel et champs encodés. */
export const telHref = (n: string) => `tel:${n.trim().startsWith("+") ? "+" : ""}${n.replace(/\D/g, "")}`;
export const mailHref = (to: string, subject?: string, body?: string) =>
  `mailto:${encodeURIComponent(to.trim()).replace(/%40/g, "@")}${subject ? `?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}` : ""}`;
const isCompany = (n: string) => /\d|\b(inc|lt[ée]e|ltd|enr|corp|llc|senc)\b/i.test(n);
/** Prénom pour la salutation ; les noms d'entreprise sont gardés entiers. */
export const firstName = (name: string) => {
  const n = name.trim();
  if (!n) return "";
  return isCompany(n) ? n : n.split(/\s+/)[0];
};
export const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
export const store = {
  get: (k: string) => { try { return window.localStorage.getItem(k) ?? ""; } catch { return ""; } },
  set: (k: string, v: string) => { try { window.localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
};
export const SEEN = (id: string) => `ocpa-portal-seen-${id}`;
export const CURRENT = "ocpa-portal-dossier";
export const hasSavings = (d: Dossier) => typeof d.savings_cents === "number" && Number.isFinite(d.savings_cents) && d.savings_cents > 0;
/** Titre du dossier, avec l'année si elle n'y figure pas déjà. */
export const dossierLabel = (d: Dossier) => (d.tax_year && !d.title.includes(String(d.tax_year)) ? `${d.title} ${d.tax_year}` : d.title);

/** Date du jour à Montréal (AAAA-MM-JJ) : sert aux échéances et au nom du fichier d'export. */
export const todayMtl = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montreal" }).format(new Date());
/** Le questionnaire annuel porte sur la situation d'un particulier. */
export const QUEST_KINDS = ["impot_particulier", "travailleur_autonome"];
export const hasQuest = (d: Dossier) => QUEST_KINDS.includes(d.kind);
const INDIVIDUAL = ["impot_particulier", "travailleur_autonome", "lettre_fisc"];
const BUSINESS = ["impot_societe", "taxes", "etats_financiers", "tenue_de_livres"];
/** Public visé par les échéances officielles, selon le type de dossier. `undefined` : toutes les dates. */
export const audienceOf = (kind: string): "individuals" | "businesses" | undefined => (INDIVIDUAL.includes(kind) ? "individuals" : BUSINESS.includes(kind) ? "businesses" : undefined);
export const isClosed = (d: Dossier) => d.status === "transmis" || d.status === "ferme";
/** Dossier terminé pour lequel le client n'a pas encore donné son avis. `null` si la lecture des avis a échoué. */
export const feedbackTarget = (dossiers: Dossier[], current: Dossier, feedback: Feedback[] | null): Dossier | null => {
  if (!feedback) return null;
  const open = (d: Dossier) => isClosed(d) && !feedback.some((f) => f.dossier_id === d.id);
  return open(current) ? current : dossiers.find(open) ?? null;
};
/** Fait télécharger un fichier construit dans le navigateur. */
export function downloadFile(content: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const icsEsc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const ymd = (iso: string) => iso.replace(/-/g, "");
const dayAfter = (iso: string) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return ymd(d.toISOString().slice(0, 10)); };
/** Fichier iCalendar d'une journée entière, avec un rappel 3 jours avant (même forme que le calendrier fiscal du site). */
export function icsDay(date: string, title: string, detail: string, uidKey: string) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Othmani CPA//Pilote Fiscal//FR", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${ymd(date)}-${uidKey}@othmanicpa.ca`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(date)}`, `DTEND;VALUE=DATE:${dayAfter(date)}`,
    `SUMMARY:${icsEsc(title)}`, `DESCRIPTION:${icsEsc(detail)}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", "TRIGGER:-P3D", `DESCRIPTION:${icsEsc(title)}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}
