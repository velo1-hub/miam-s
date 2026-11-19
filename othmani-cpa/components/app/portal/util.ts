import type { Lang } from "@/lib/site";
import type { Appointment, Doc, DocRequest, Dossier, Invoice, Message, Signature } from "../shared";

export type Tab = "home" | "track" | "docs" | "messages" | "sign" | "pay" | "appt" | "profile";
export type Upload = { key: string; name: string; state: "busy" | "ok" | "error"; note?: string };
/** `null` pour une liste secondaire = le chargement a échoué (à distinguer d'une liste vide). */
export type PortalData = {
  id: string; reqs: DocRequest[]; msgs: Message[]; docs: Doc[];
  sigs: Signature[] | null; invoices: Invoice[] | null; appts: Appointment[] | null;
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
