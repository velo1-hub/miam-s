import "server-only";

export const LIMITS = {
  messagesPerSession: 30,
  messagesPerIpPerHour: 60,
  maxUserChars: 2000,
  maxHistory: 40,
} as const;

/** Light pre-screen: obvious prompt-injection scaffolding is stripped of authority by rule 7; we only cap size here. */
export function sanitizeUserText(text: string): string {
  return text.replace(/\u0000/g, "").slice(0, LIMITS.maxUserChars);
}

/** Sensitive data the assistant must never collect (brief §17.6). Returns a locale-aware refusal line or null. */
export function detectSensitiveData(text: string, locale: "fr" | "en"): string | null {
  const sin = /\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/.test(text) && /\b(nas|sin|assurance sociale|social insurance)\b/i.test(text);
  const card = /\b(?:\d[ -]?){13,19}\b/.test(text);
  if (sin || card) {
    return locale === "fr"
      ? "Par sécurité, ne partagez jamais de NAS, de numéro de carte ou de renseignements bancaires ici. Un conseiller recueillera ce qui est nécessaire en personne."
      : "For your safety, never share a SIN, card number or banking details here. An advisor will collect what is needed in person.";
  }
  return null;
}
