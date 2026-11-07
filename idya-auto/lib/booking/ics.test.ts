import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";

describe("buildIcs", () => {
  it("produces a valid 30-minute event with escaped text", () => {
    const ics = buildIcs({ uid: "b1", startsAt: "2026-11-12T14:00:00.000Z", durationMinutes: 30, title: "Essai routier, RAV4", description: "Ligne 1\nLigne 2", location: "Idya Auto" });
    expect(ics).toContain("DTSTART:20261112T140000Z");
    expect(ics).toContain("DTEND:20261112T143000Z");
    expect(ics).toContain("SUMMARY:Essai routier\\, RAV4");
    expect(ics).toContain("DESCRIPTION:Ligne 1\\nLigne 2");
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
  });
});
