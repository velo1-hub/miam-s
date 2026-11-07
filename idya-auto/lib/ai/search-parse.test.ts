import { describe, expect, it } from "vitest";
import { parseSearchWithRules } from "./search-parse";

const known = { makes: ["Toyota", "Honda", "Ford"], models: ["RAV4", "Civic", "F-150"] };

describe("parseSearchWithRules", () => {
  it("parses the brief's hero examples", () => {
    expect(parseSearchWithRules("VUS 7 places sous 35 000 $").filters).toMatchObject({ bodyType: ["suv"], seatsMin: 7, priceMax: 35000 });
    expect(parseSearchWithRules("Hybride avec démarreur à distance").filters).toMatchObject({ fuel: ["hybrid"], features: ["remote_start"] });
    expect(parseSearchWithRules("Camionnette 4×4, moins de 80 000 km").filters).toMatchObject({ bodyType: ["truck"], drivetrain: ["4wd"], kmMax: 80000 });
  });
  it("understands Québec expressions and English", () => {
    expect(parseSearchWithRules("un char avec 4 roues motrices pas cher").filters).toMatchObject({ drivetrain: ["awd"] });
    expect(parseSearchWithRules("pick-up under $50,000 with tow package").filters).toMatchObject({ bodyType: ["truck"], priceMax: 50000, features: ["tow_package"] });
  });
  it("maps makes and models from the inventory and keeps residual terms", () => {
    const r = parseSearchWithRules("Toyota RAV4 rouge", known);
    expect(r.filters).toMatchObject({ make: ["Toyota"], model: ["RAV4"] });
    expect(r.residual).toBe("rouge");
  });
  it("never invents filters for unknown words", () => {
    expect(parseSearchWithRules("quelque chose de bien").filters).toEqual({});
  });
});
