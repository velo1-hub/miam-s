// Client dossier: the structured record the assistant fills in during the conversation.
// Pure module (no I/O) so it runs in Supabase Edge (Deno) and in Node tests alike.

export const CLIENT_TYPES = ["condo", "coop", "building_owner", "homeowner", "other"] as const;
export const ROLES = ["board_member", "property_manager", "owner", "tenant", "other"] as const;
export const APPROVAL = ["approved", "pending_board", "pending_agm", "unknown"] as const;
export const WORK_TYPES = ["paint", "weld", "both", "unknown"] as const;
export const STRUCTURE_TYPES = ["balcony", "service_stair", "spiral", "facade_stair", "railing", "fence", "other"] as const;
export const CONDITIONS = ["good", "flaking", "rusted", "rust_through", "unknown"] as const;
export const URGENCY = ["asap", "1_3_months", "this_season", "planning", "unknown"] as const;
export const CONTACT_PREF = ["phone", "email", "sms"] as const;

export type Structure = { type: (typeof STRUCTURE_TYPES)[number]; qty: number; storeys?: number; linear_m?: number; notes?: string };

export type Dossier = {
  contact?: { name?: string; phone?: string; email?: string; preferred_contact?: (typeof CONTACT_PREF)[number]; best_time?: string };
  org?: {
    client_type?: (typeof CLIENT_TYPES)[number]; org_name?: string; role?: (typeof ROLES)[number];
    is_decision_maker?: boolean; approval_status?: (typeof APPROVAL)[number]; decision_date?: string;
  };
  site?: { address?: string; city?: string; postal?: string; borough?: string; access_notes?: string; height_storeys?: number };
  project?: {
    work_type?: (typeof WORK_TYPES)[number]; structures?: Structure[]; condition?: (typeof CONDITIONS)[number];
    safety_concern?: boolean; safety_notes?: string; photos_promised?: boolean; description?: string;
  };
  timing?: { urgency?: (typeof URGENCY)[number]; deadline?: string };
  budget?: { range?: string; has_competing_quotes?: boolean; competing_quotes_count?: number };
  notes?: string;
};

const str = (v: unknown, max = 300) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
const oneOf = <T extends readonly string[]>(v: unknown, list: T) => (typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T[number]) : undefined);
const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);
const num = (v: unknown, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? Math.round(v * 10) / 10 : undefined);
const clean = <T extends Record<string, unknown>>(o: T) => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return Object.keys(out).length ? (out as T) : undefined;
};

export function normalizePhone(v: unknown): string | undefined {
  const s = str(v, 40);
  if (!s) return undefined;
  const d = s.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return d.length >= 8 && d.length <= 15 ? `+${d}` : undefined;
}
export function normalizeEmail(v: unknown): string | undefined {
  const s = str(v, 200)?.toLowerCase();
  return s && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? s : undefined;
}
export function normalizePostal(v: unknown): string | undefined {
  const s = str(v, 10)?.toUpperCase().replace(/\s|-/g, "");
  return s && /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(s) ? `${s.slice(0, 3)} ${s.slice(3)}` : undefined;
}

/** Validate an untrusted patch (model tool input). Unknown keys and bad values are dropped, never stored. */
export function sanitizePatch(p: unknown): Dossier {
  const o = (p && typeof p === "object" ? p : {}) as Record<string, any>;
  const structures = Array.isArray(o.project?.structures)
    ? o.project.structures.slice(0, 20).map((s: any) => clean({
        type: oneOf(s?.type, STRUCTURE_TYPES) ?? "other", qty: num(s?.qty, 1, 500) ?? 1,
        storeys: num(s?.storeys, 1, 10), linear_m: num(s?.linear_m, 1, 2000), notes: str(s?.notes, 200),
      }) as Structure)
    : undefined;
  return clean({
    contact: o.contact && clean({
      name: str(o.contact.name, 120), phone: normalizePhone(o.contact.phone), email: normalizeEmail(o.contact.email),
      preferred_contact: oneOf(o.contact.preferred_contact, CONTACT_PREF), best_time: str(o.contact.best_time, 120),
    }),
    org: o.org && clean({
      client_type: oneOf(o.org.client_type, CLIENT_TYPES), org_name: str(o.org.org_name, 160), role: oneOf(o.org.role, ROLES),
      is_decision_maker: bool(o.org.is_decision_maker), approval_status: oneOf(o.org.approval_status, APPROVAL), decision_date: str(o.org.decision_date, 60),
    }),
    site: o.site && clean({
      address: str(o.site.address, 200), city: str(o.site.city, 80), postal: normalizePostal(o.site.postal), borough: str(o.site.borough, 80),
      access_notes: str(o.site.access_notes, 300), height_storeys: num(o.site.height_storeys, 1, 10),
    }),
    project: o.project && clean({
      work_type: oneOf(o.project.work_type, WORK_TYPES), structures, condition: oneOf(o.project.condition, CONDITIONS),
      safety_concern: bool(o.project.safety_concern), safety_notes: str(o.project.safety_notes, 300),
      photos_promised: bool(o.project.photos_promised), description: str(o.project.description, 600),
    }),
    timing: o.timing && clean({ urgency: oneOf(o.timing.urgency, URGENCY), deadline: str(o.timing.deadline, 80) }),
    budget: o.budget && clean({
      range: str(o.budget.range, 80), has_competing_quotes: bool(o.budget.has_competing_quotes), competing_quotes_count: num(o.budget.competing_quotes_count, 0, 20),
    }),
    notes: str(o.notes, 1000),
  }) ?? {};
}

/** Deep-merge a sanitized patch. Arrays (structures) replace; scalars overwrite; missing keys keep old values. */
export function mergeDossier(base: Dossier, patch: Dossier): Dossier {
  const out: any = structuredClone(base ?? {});
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === "object" && !Array.isArray(v)) out[k] = { ...(out[k] ?? {}), ...v };
    else out[k] = v;
  }
  return out;
}

/** The ordered list of what is still missing. The assistant asks for the first items next. */
export function missingFields(d: Dossier): string[] {
  const m: string[] = [];
  const located = !!(d.site?.city || d.site?.borough || d.site?.postal || d.site?.address);
  if (!d.org?.client_type) m.push("org.client_type");
  if (!d.project?.work_type || d.project.work_type === "unknown") m.push("project.work_type");
  if (!located) m.push("site.location"); // neighbourhood / city / postal code: asked early to confirm the service area
  if (!d.project?.structures?.length) m.push("project.structures");
  if (!d.project?.condition) m.push("project.condition");
  if (!d.timing?.urgency) m.push("timing.urgency");
  if (d.org?.client_type && ["condo", "coop"].includes(d.org.client_type) && d.org.approval_status === undefined) m.push("org.approval_status");
  if (d.org?.is_decision_maker === undefined) m.push("org.is_decision_maker");
  if (!d.contact?.name) m.push("contact.name");
  if (!d.contact?.phone && !d.contact?.email) m.push("contact.phone_or_email");
  if (!d.site?.address) m.push("site.address"); // full street address, needed for the visit
  return m;
}

/** A visit needs a name, a way to reach the client and the street address. */
export const canBook = (d: Dossier) => !!(d.contact?.name && (d.contact.phone || d.contact.email) && d.site?.address);
export const canComplete = (d: Dossier) => canBook(d) && !!d.project?.structures?.length;
