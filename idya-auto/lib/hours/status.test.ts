import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/lib/settings/defaults";
import { openStatus } from "./status";

describe("openStatus", () => {
  it("is open on a weekday afternoon", () => {
    const s = openStatus(defaultSettings, new Date("2026-11-11T19:00:00Z")); // Wed 14:00 EST
    expect(s.open).toBe(true);
    expect(s.nextChange).toBe("20:00");
  });
  it("is closed late evening and reports tomorrow's opening", () => {
    const s = openStatus(defaultSettings, new Date("2026-11-12T02:30:00Z")); // Wed 21:30 EST
    expect(s.open).toBe(false);
    expect(s.nextChange).toBe("09:00");
    expect(s.nextOpenDay).toBe(4);
  });
  it("is closed on Sunday and points to Monday", () => {
    const s = openStatus(defaultSettings, new Date("2026-11-15T17:00:00Z")); // Sun
    expect(s.open).toBe(false);
    expect(s.nextOpenDay).toBe(1);
  });
  it("respects closures", () => {
    const s = openStatus(defaultSettings, new Date("2026-12-25T17:00:00Z"));
    expect(s.open).toBe(false);
    expect(s.closedForHoliday).toBe("Noël");
  });
});
