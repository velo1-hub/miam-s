import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/lib/settings/defaults";
import { generateSlots } from "./slots";

// Wednesday 2026-11-11 14:00 America/Toronto = 19:00Z (EST)
const NOW = new Date("2026-11-11T19:00:00Z");

describe("generateSlots", () => {
  const days = generateSlots(defaultSettings, [], NOW);

  it("covers the configured horizon", () => {
    expect(days).toHaveLength(defaultSettings.booking.horizonDays);
    expect(days[0].day).toBe("2026-11-11");
  });

  it("skips slots less than minLeadHours away and before opening", () => {
    const today = days[0];
    // 14:00 + 2 h → first slot 16:00
    expect(today.slots[0]?.label).toBe("16:00");
    // last slot starts 30 min before 20:00 close
    expect(today.slots.at(-1)?.label).toBe("19:30");
  });

  it("has no slots on Sundays or on closures", () => {
    const sunday = days.find((d) => d.weekday === 0);
    expect(sunday?.slots).toHaveLength(0);
    const xmas = generateSlots(defaultSettings, [], new Date("2026-12-20T15:00:00Z")).find((d) => d.day === "2026-12-25");
    expect(xmas?.slots).toHaveLength(0);
  });

  it("reduces remaining capacity with existing bookings", () => {
    const target = days[1].slots[0];
    const withBooking = generateSlots(defaultSettings, [{ startsAt: target.startsAt }, { startsAt: target.startsAt }], NOW);
    expect(withBooking[1].slots[0].remaining).toBe(0);
    expect(withBooking[1].slots[1].remaining).toBe(2);
  });

  it("emits slots as instants in the correct offset", () => {
    // 2026-11-12 09:00 EST = 14:00Z
    expect(days[1].slots[0].startsAt).toBe("2026-11-12T14:00:00.000Z");
  });
});
