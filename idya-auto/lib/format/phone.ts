import { parsePhoneNumberFromString } from "libphonenumber-js";

/** Canadian display format `(514) 555-0123`; returns the input unchanged when it cannot be parsed. */
export function formatPhone(input: string): string {
  const p = parsePhoneNumberFromString(input, "CA");
  return p?.isValid() ? p.formatNational() : input;
}

export function toE164(input: string): string | null {
  const p = parsePhoneNumberFromString(input, "CA");
  return p?.isValid() ? p.number : null;
}

export function isValidCanadianPhone(input: string): boolean {
  const p = parsePhoneNumberFromString(input, "CA");
  return Boolean(p?.isValid() && (p.country === "CA" || p.country === "US"));
}
