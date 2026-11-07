import { describe, expect, it } from "vitest";
import { formatDateLong, formatHoursLabel, formatTime, weekdayName } from "./date";

describe("date formatting in America/Toronto", () => {
  const iso = "2026-11-12T14:00:00.000Z"; // 09:00 EST
  it("formats long dates", () => {
    expect(formatDateLong(iso, "fr")).toBe("jeudi 12 novembre 2026");
    expect(formatDateLong(iso, "en")).toBe("Thursday, November 12, 2026");
  });
  it("formats times", () => {
    expect(formatTime(iso, "fr")).toBe("9 h 00");
    expect(formatTime(iso, "en")).toBe("9:00 AM");
  });
  it("formats hours labels and weekdays", () => {
    expect(formatHoursLabel("09:00", "fr")).toBe("9 h");
    expect(formatHoursLabel("20:00", "en")).toBe("8 p.m.");
    expect(weekdayName(1, "fr")).toBe("lundi");
    expect(weekdayName(6, "en", "short")).toBe("Sat");
  });
});
