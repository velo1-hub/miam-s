import { describe, expect, it } from "vitest";
import { buildVehicleSlug, slugify } from "./slug";

describe("buildVehicleSlug", () => {
  it("matches the brief example", () => {
    expect(buildVehicleSlug({ year: 2022, make: "Toyota", model: "RAV4", trim: "XLE", stockNumber: "A1234" })).toBe(
      "2022-toyota-rav4-xle-a1234",
    );
  });
  it("drops a missing trim and strips accents and symbols", () => {
    expect(buildVehicleSlug({ year: 2021, make: "Citroën", model: "C4 Cactus+", trim: null, stockNumber: "B-77" })).toBe(
      "2021-citroen-c4-cactus-b-77",
    );
  });
  it("slugify collapses separators", () => {
    expect(slugify("  Hybride  rechargeable / 4×4 ")).toBe("hybride-rechargeable-4-4");
  });
});
