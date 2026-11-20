"use client";
import { QUESTIONS } from "./questionnaire";
/**
 * Mode démonstration (code 0000) : un faux client de base de données, en mémoire, avec des
 * données fictives. Rien n'est lu ni écrit dans la vraie base, et tout s'efface à la fermeture
 * de l'onglet. Sert aux présentations et à l'examen des magasins d'applications.
 * Le code 0000 ne donne JAMAIS accès aux vrais dossiers : ceux-ci exigent la connexion par courriel.
 */
export const DEMO_CODE = "0000";
const KEY = "ocpa-demo";
export type DemoRole = "cabinet" | "client";
export const demoRole = (): DemoRole | null => {
  try { const v = sessionStorage.getItem(KEY); return v === "cabinet" || v === "client" ? v : null; } catch { return null; }
};
export const setDemo = (r: DemoRole | null) => { try { if (r) sessionStorage.setItem(KEY, r); else sessionStorage.removeItem(KEY); } catch { /* stockage indisponible */ } };
export const DEMO_EMAIL = { cabinet: "demo@exemple.ca", client: "marie.tremblay@exemple.ca" };

type Row = Record<string, unknown>;
const ago = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

function seed(): Record<string, Row[]> {
  const year = new Date().getFullYear();
  const d = (id: string, client_name: string, client_email: string, title: string, kind: string, status: string, assignee: string, next_step: string, due: number | null, upd: number): Row =>
    ({ id, created_at: ago(upd + 9), updated_at: ago(upd), client_name, client_email, title, kind, tax_year: year - 1, status, assignee, next_step, due_date: due === null ? null : inDays(due), lead_id: null, savings_cents: id === "d1" ? 420000 : null, weather: id === "d1" ? "degage" : id === "d2" ? "nuageux" : null, weather_note: id === "d1" ? "Tout est à jour. Prochaine échéance : votre acompte de mars." : id === "d2" ? "Relevés bancaires à recevoir." : "" });
  return {
    staff: [{ email: DEMO_EMAIL.cabinet, name: "Démonstration", is_admin: true }, { email: "associe@exemple.ca", name: "Zouhaier Othmani" }, { email: "technicienne@exemple.ca", name: "Racha Ghazoini" }],
    leads: [
      { id: "l1", created_at: ago(0.1), source: "clara", lang: "fr", name: "Jean Lavoie", email: "jean.lavoie@exemple.ca", phone: "514 555-0142", audience: "moi", topic: "Lettre de Revenu Québec", message: "A reçu un avis de cotisation et souhaite être rappelé. Préfère la fin de journée (préférence notée, non confirmée).", status: "nouveau", notes: "" },
      { id: "l2", created_at: ago(1), source: "contact", lang: "en", name: "Sarah Cohen", email: "sarah.cohen@example.ca", phone: null, audience: "entreprise", topic: null, message: "We are incorporating next month and need help with GST/QST registration.", status: "contacte", notes: "Rappelée. Attend ses documents d'incorporation." },
      { id: "l3", created_at: ago(2), source: "telephone", lang: "fr", name: "Karim Benali", email: null, phone: "438 555-0177", audience: "moi", topic: "Travailleur autonome", message: "Chauffeur à son compte, première déclaration avec revenus d'entreprise.", status: "rdv_a_confirmer", notes: "" },
    ],
    dossiers: [
      d("d1", "Marie Tremblay", DEMO_EMAIL.client, `Déclarations de revenus ${year - 1}`, "impot_particulier", "en_preparation", "Racha Ghazoini", "Nous préparons vos déclarations. Il nous manque seulement votre Relevé 1.", 40, 0.2),
      d("d2", "Boulangerie du Coin inc.", "info@boulangerie-exemple.ca", `États financiers ${year - 1}`, "etats_financiers", "documents_attendus", "Zouhaier Othmani", "Merci de déposer vos relevés bancaires de fin d'exercice.", 21, 1),
      d("d3", "Marie Tremblay", DEMO_EMAIL.client, "Lettre de Revenu Québec", "lettre_fisc", "a_signer", "Zouhaier Othmani", "Votre réponse est prête. Merci de la relire et de nous confirmer votre accord.", 6, 0.5),
      d("d4", "Atelier Nord inc.", "compta@ateliernord-exemple.ca", "TPS/TVQ, 4e trimestre", "taxes", "en_revision", "Racha Ghazoini", "", 12, 3),
      d("d5", "Luc Gagnon", "luc.gagnon@exemple.ca", `Déclarations de revenus ${year - 1}`, "travailleur_autonome", "transmis", "Racha Ghazoini", "Vos déclarations ont été transmises. Nous attendons les avis de cotisation.", null, 6),
    ],
    document_requests: [
      { id: "r1", dossier_id: "d1", created_at: ago(8), label: "Relevé 1 et T4 de l'employeur", received: false },
      { id: "r2", dossier_id: "d1", created_at: ago(8), label: "Avis de cotisation de l'an dernier", received: true },
      { id: "r3", dossier_id: "d1", created_at: ago(8), label: "Reçus de cotisations REER", received: true },
      { id: "r4", dossier_id: "d2", created_at: ago(5), label: "Relevés bancaires de fin d'exercice", received: false },
      { id: "r5", dossier_id: "d3", created_at: ago(4), label: "La lettre reçue, toutes les pages", received: true },
    ],
    documents: [
      { id: "f1", dossier_id: "d1", created_at: ago(3), uploader_role: "client", path: "d1/t4.pdf", name: "T4.pdf", size: 184000 },
      { id: "f2", dossier_id: "d3", created_at: ago(1), uploader_role: "cabinet", path: "d3/reponse.pdf", name: "Projet de réponse.pdf", size: 96000 },
    ],
    messages: [
      { id: "m1", dossier_id: "d1", created_at: ago(3), author_role: "client", author_name: "Marie Tremblay", body: "Bonjour, j'ai déposé mon T4. Est-ce qu'il vous manque autre chose ?" },
      { id: "m2", dossier_id: "d1", created_at: ago(2.9), author_role: "cabinet", author_name: "Racha Ghazoini", body: "Bien reçu, merci ! Il nous manque seulement votre Relevé 1." },
      { id: "m3", dossier_id: "d2", created_at: ago(0.3), author_role: "client", author_name: "Boulangerie du Coin inc.", body: "Bonjour, notre banque nous envoie les relevés demain. Est-ce trop tard ?" },
    ],
    dossier_notes: [{ id: "n1", dossier_id: "d1", created_at: ago(2), author: "Racha Ghazoini", body: "Feuillets REER reçus par courriel, classés au dossier." }],
    tasks: [
      { id: "t1", dossier_id: "d1", created_at: ago(2), label: "Rappeler la cliente pour le Relevé 1", assignee: "Démonstration", due_date: inDays(2), done: false },
      { id: "t2", dossier_id: "d1", created_at: ago(3), label: "Vérifier les reçus REER", assignee: "Zouhaier Othmani", due_date: null, done: true },
      { id: "t3", dossier_id: "d4", created_at: ago(4), label: "Réviser la déclaration avant transmission", assignee: "Zouhaier Othmani", due_date: inDays(-1), done: false },
    ],
    invoices: [
      { id: "i1", dossier_id: "d3", created_at: ago(1), label: "Réponse à la lettre de Revenu Québec", amount_cents: 28744, status: "a_payer", pay_url: null, paid_at: null },
      { id: "i2", dossier_id: "d5", created_at: ago(6), label: `Déclarations de revenus ${year - 1}`, amount_cents: 40241, status: "payee", pay_url: null, paid_at: ago(4) },
    ],
    activity: [
      { id: 3, dossier_id: "d1", created_at: ago(2.9), actor: "Racha Ghazoini", actor_role: "cabinet", kind: "message", detail: "Bien reçu, merci ! Il nous manque seulement votre Relevé 1." },
      { id: 2, dossier_id: "d1", created_at: ago(3), actor: "Marie Tremblay", actor_role: "client", kind: "document_depose", detail: "T4.pdf" },
      { id: 1, dossier_id: "d1", created_at: ago(9), actor: "Racha Ghazoini", actor_role: "cabinet", kind: "dossier_ouvert", detail: "Déclarations de revenus" },
    ],
    appointment_requests: [{ id: "ap1", dossier_id: "d3", created_at: ago(1), preference: "En fin de journée, si possible", mode: "telephone", status: "demande", confirmed_at: null, staff_note: "" }],
    signatures: [
      { id: "sg1", dossier_id: "d3", created_at: ago(1), title: "Autorisation de transmettre la réponse à Revenu Québec", body: "J'ai lu le projet de réponse préparé par Othmani CPA Inc. J'autorise le cabinet à le transmettre en mon nom à Revenu Québec.", status: "a_signer", signed_at: null, signed_name: null },
      { id: "sg2", dossier_id: "d1", created_at: ago(9), title: "Lettre de mission", body: "J'accepte la lettre de mission décrivant les services, les honoraires estimés et les responsabilités de chacun.", status: "signe", signed_at: ago(8), signed_name: "Marie Tremblay" },
    ],
    questionnaires: [],
    feedback: [{ id: "fb1", dossier_id: "d5", created_at: ago(3), rating: 5, comment: "Tout a été clair et rapide. Merci !" }],
    reminder_subscribers: [
      { id: "s1", email: "abonne@exemple.ca", lang: "fr", consent_at: ago(12), unsubscribed_at: null },
      { id: "s2", email: "subscriber@example.ca", lang: "en", consent_at: ago(30), unsubscribed_at: null },
    ],
  };
}

let db: Record<string, Row[]> | null = null;
const files = new Map<string, string>();
const data = () => (db ??= seed());

class Query implements PromiseLike<{ data: unknown; error: null | { message: string }; count: number | null }> {
  private filters: ((r: Row) => boolean)[] = [];
  private sorts: [string, boolean][] = [];
  private max = Infinity;
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private payload: Row | Row[] | null = null;
  private one: "single" | "maybe" | null = null;
  private head = false;
  constructor(private table: string, private role: DemoRole) {}
  select(_c?: string, o?: { head?: boolean }) { if (o?.head) this.head = true; return this; }
  insert(p: Row | Row[]) { this.mode = "insert"; this.payload = p; return this; }
  update(p: Row) { this.mode = "update"; this.payload = p; return this; }
  delete() { this.mode = "delete"; return this; }
  eq(k: string, v: unknown) { this.filters.push((r) => r[k] === v); return this; }
  neq(k: string, v: unknown) { this.filters.push((r) => r[k] !== v); return this; }
  gte(k: string, v: string) { this.filters.push((r) => r[k] != null && String(r[k]) >= v); return this; }
  lte(k: string, v: string) { this.filters.push((r) => r[k] != null && String(r[k]) <= v); return this; }
  order(k: string, o?: { ascending?: boolean }) { this.sorts.push([k, o?.ascending !== false]); return this; }
  limit(n: number) { this.max = n; return this; }
  single() { this.one = "single"; return this; }
  maybeSingle() { this.one = "maybe"; return this; }
  private run() {
    const all = (data()[this.table] ??= []);
    // Le client de démonstration ne voit que ses propres dossiers, comme dans la vraie base.
    const mine = new Set(data().dossiers.filter((x) => x.client_email === DEMO_EMAIL.client).map((x) => x.id));
    const visible = (r: Row) => this.role === "cabinet" || (this.table === "dossiers" ? mine.has(r.id) : "dossier_id" in r ? mine.has(r.dossier_id) : false);
    const match = (r: Row) => visible(r) && this.filters.every((f) => f(r));
    if (this.mode === "insert") {
      const rows = (Array.isArray(this.payload) ? this.payload : [this.payload!]).map((p) => ({ id: uid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...p }));
      all.push(...rows);
      if (this.table === "documents") for (const r of rows) { const req = (data().document_requests ?? []).find((x) => x.id === (r as Row).request_id); if (req) req.received = true; }
      return { data: this.one ? rows[0] : rows, error: null, count: rows.length };
    }
    if (this.mode === "update") { all.filter(match).forEach((r) => Object.assign(r, this.payload, "updated_at" in r ? { updated_at: new Date().toISOString() } : {})); return { data: null, error: null, count: null }; }
    if (this.mode === "delete") { data()[this.table] = all.filter((r) => !match(r)); return { data: null, error: null, count: null }; }
    let rows = all.filter(match);
    for (const [k, asc] of [...this.sorts].reverse()) rows = [...rows].sort((a, b) => (String(a[k] ?? "") < String(b[k] ?? "") ? -1 : String(a[k] ?? "") > String(b[k] ?? "") ? 1 : 0) * (asc ? 1 : -1));
    const count = rows.length;
    rows = rows.slice(0, this.max);
    if (this.head) return { data: null, error: null, count };
    if (this.one) return { data: rows[0] ?? null, error: null, count };
    return { data: rows, error: null, count };
  }
  then<A = { data: unknown; error: null | { message: string }; count: number | null }, B = never>(ok?: ((v: { data: unknown; error: null | { message: string }; count: number | null }) => A | PromiseLike<A>) | null, ko?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return Promise.resolve().then(() => this.run()).then(ok, ko);
  }
}

export function demoClient(role: DemoRole) {
  return {
    from: (t: string) => new Query(t, role),
    rpc: async (fn: string, args?: Record<string, unknown>) => {
      if (fn === "sign_document") {
        const row = (data().signatures ?? []).find((x) => x.id === args?.p_id && x.status === "a_signer");
        if (!row) return { data: null, error: { message: "not_allowed" } };
        Object.assign(row, { status: "signe", signed_at: new Date().toISOString(), signed_name: String(args?.p_name ?? "") });
        return { data: null, error: null };
      }
      if (fn === "submit_questionnaire") {
        const dossier = String(args?.p_dossier ?? "");
        const answers = (args?.p_answers ?? {}) as Record<string, string>;
        const reqs = (data().document_requests ??= []);
        let added = 0;
        for (const q of QUESTIONS) {
          if (answers[q.key] === "true" && !reqs.some((r) => r.dossier_id === dossier && r.label === q.doc)) { reqs.push({ id: uid(), dossier_id: dossier, created_at: new Date().toISOString(), label: q.doc, received: false }); added++; }
        }
        const list = (data().questionnaires ??= []);
        const old = list.find((x) => x.dossier_id === dossier);
        const row = { dossier_id: dossier, answers, note: String(args?.p_note ?? ""), submitted_at: new Date().toISOString() };
        if (old) Object.assign(old, row); else list.push({ id: uid(), ...row });
        return { data: added, error: null };
      }
      if (fn !== "dossiers_a_repondre") return { data: null, error: null };
      const last = new Map<string, Row>();
      for (const m of [...(data().messages ?? [])].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))) last.set(String(m.dossier_id), m);
      return { data: [...last.entries()].filter(([, m]) => m.author_role === "client").map(([id]) => id), error: null };
    },
    storage: {
      from: () => ({
        upload: async (path: string, f: File) => { files.set(path, URL.createObjectURL(f)); return { error: null }; },
        createSignedUrl: async (path: string) => ({ data: files.has(path) ? { signedUrl: files.get(path)! } : null }),
        remove: async (paths: string[]) => { paths.forEach((p) => files.delete(p)); return { error: null }; },
      }),
    },
  };
}
