import { describe, expect, it } from "vitest";
import { formatKm, formatPrice } from "./number";

/** Intl uses U+00A0 (fr-CA group) / U+202F (fr-CA before $). Normalise for readable assertions. */
const plain = (s: string) => s.replace(/[  ]/g, " ");

describe("formatPrice", () => {
  it("formats Québec French with a trailing dollar sign and spaced thousands", () => {
    expect(plain(formatPrice(28995, "fr"))).toBe("28 995 $");
  });
  it("formats Canadian English with a leading dollar sign and comma thousands", () => {
    expect(formatPrice(28995, "en")).toBe("$28,995");
  });
  it("never shows decimals", () => {
    expect(plain(formatPrice(28995.49, "fr"))).toBe("28 995 $");
    expect(formatPrice(28995.5, "en")).toBe("$28,996");
  });
});

describe("formatKm", () => {
  it("formats km in both locales with a non-breaking space before the unit", () => {
    expect(plain(formatKm(45200, "fr"))).toBe("45 200 km");
    expect(plain(formatKm(45200, "en"))).toBe("45,200 km");
  });
});
