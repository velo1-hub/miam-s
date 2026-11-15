/** Consentement aux témoins (Loi 25) : rien d'optionnel n'est activé par défaut. */
export type Consent = { necessary: true; analytics: boolean; maps: boolean; date: string; v: 1 };
const KEY = "ocpa-consent";
export const CONSENT_EVENT = "ocpa-consent-change";
export const OPEN_EVENT = "ocpa-open-cookies";

export function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

export function writeConsent(c: Partial<Pick<Consent, "analytics" | "maps">>) {
  const prev = readConsent();
  const next: Consent = {
    necessary: true,
    analytics: c.analytics ?? prev?.analytics ?? false,
    maps: c.maps ?? prev?.maps ?? false,
    date: new Date().toISOString(),
    v: 1,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: next }));
  return next;
}
