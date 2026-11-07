import { describe, expect, it } from "vitest";
import { formatPhone, isValidCanadianPhone, toE164 } from "./phone";

describe("phone", () => {
  it("formats a Québec number nationally", () => {
    expect(formatPhone("5145550123")).toBe("(514) 555-0123");
    expect(formatPhone("+1 514 555 0123")).toBe("(514) 555-0123");
  });
  it("normalizes to E.164", () => {
    expect(toE164("514-555-0123")).toBe("+15145550123");
    expect(toE164("123")).toBeNull();
  });
  it("validates", () => {
    expect(isValidCanadianPhone("418 555 0199")).toBe(true);
    expect(isValidCanadianPhone("0000")).toBe(false);
  });
});
