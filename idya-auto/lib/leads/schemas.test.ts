import { describe, expect, it } from "vitest";
import { sellCarSchema } from "./schemas";

const valid = {
  year: "2020",
  make: "Mazda",
  model: "CX-5",
  km: "68500",
  condition: "4",
  accidents: "no",
  balance: "no",
  askingPrice: "24500",
  flexibility: "negotiable",
  timeline: "asap",
  owner: true,
  firstName: "Marie",
  lastName: "Tremblay",
  email: "marie@example.com",
  phone: "514 555 0188",
  consent: true,
};

describe("sellCarSchema (« Vendre mon auto »)", () => {
  it("accepts a complete offer and coerces numbers", () => {
    const r = sellCarSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.askingPrice).toBe(24500);
      expect(r.data.year).toBe(2020);
      expect(r.data.km).toBe(68500);
    }
  });

  it("requires an asking price within range", () => {
    for (const askingPrice of ["", "0", "499", "500001", "abc"]) {
      const r = sellCarSchema.safeParse({ ...valid, askingPrice });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues.some((i) => i.path[0] === "askingPrice" && i.message === "price")).toBe(true);
    }
  });

  it("tolerates spaces, dollar signs and separators in the price", () => {
    for (const askingPrice of ["24 500 $", "$24,500", "24\u00a0500"]) {
      const r = sellCarSchema.safeParse({ ...valid, askingPrice });
      expect(r.success && r.data.askingPrice).toBe(24500);
    }
  });

  it("requires the registered-owner statement and consent", () => {
    const owner = sellCarSchema.safeParse({ ...valid, owner: false });
    expect(owner.success).toBe(false);
    if (!owner.success) expect(owner.error.issues[0]?.message).toBe("owner");
    expect(sellCarSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it("requires year, make and model even without a VIN", () => {
    expect(sellCarSchema.safeParse({ ...valid, make: "" }).success).toBe(false);
    expect(sellCarSchema.safeParse({ ...valid, year: "" }).success).toBe(false);
  });

  it("rejects an invalid VIN but accepts an empty one", () => {
    expect(sellCarSchema.safeParse({ ...valid, vin: "123" }).success).toBe(false);
    expect(sellCarSchema.safeParse({ ...valid, vin: "" }).success).toBe(true);
    expect(sellCarSchema.safeParse({ ...valid, vin: "JM3KFBCM1L0123456" }).success).toBe(true);
  });
});
