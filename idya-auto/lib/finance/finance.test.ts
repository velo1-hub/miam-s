import { describe, expect, it } from "vitest";
import { computeFinancing } from "./disclosure";
import { disclosedAnnualRatePct, paymentCount, periodicPayment } from "./payment";
import { quebecTaxes } from "./taxes";

describe("periodicPayment", () => {
  it("matches a known amortization value (20 000 $ at 6 % over 60 months ≈ 386.66 $)", () => {
    expect(periodicPayment(20_000, 6, 60, "monthly")).toBeCloseTo(386.66, 2);
  });
  it("handles a zero rate", () => {
    expect(periodicPayment(12_000, 0, 48, "monthly")).toBeCloseTo(250, 6);
    expect(periodicPayment(12_000, 0, 12, "biweekly")).toBeCloseTo(12_000 / 26, 6);
  });
  it("counts payments per frequency", () => {
    expect(paymentCount(72, "monthly")).toBe(72);
    expect(paymentCount(72, "biweekly")).toBe(156);
    expect(paymentCount(72, "weekly")).toBe(312);
  });
  it("weekly payments total less than 1/4 of monthly over the same term thanks to faster amortization", () => {
    const m = periodicPayment(30_000, 7.99, 60, "monthly") * 60;
    const w = periodicPayment(30_000, 7.99, 60, "weekly") * 260;
    expect(w).toBeLessThan(m);
  });
});

describe("quebecTaxes", () => {
  it("applies 5 % + 9,975 % on the price minus the trade-in", () => {
    const t = quebecTaxes(28_995, 5_000);
    expect(t.taxableBase).toBe(23_995);
    expect(t.gst).toBeCloseTo(1_199.75, 2);
    expect(t.qst).toBeCloseTo(2_393.5, 2);
    expect(t.total).toBeCloseTo(3_593.25, 2);
  });
  it("never goes negative", () => {
    expect(quebecTaxes(10_000, 15_000).total).toBe(0);
  });
});

describe("disclosedAnnualRatePct", () => {
  it("equals the nominal rate when there are no fees", () => {
    const p = periodicPayment(25_000, 7.99, 72, "monthly");
    expect(disclosedAnnualRatePct(25_000, p, 72, "monthly")).toBeCloseTo(7.99, 3);
  });
  it("rises above the nominal rate when fees are financed", () => {
    const financed = 25_000 + 499;
    const p = periodicPayment(financed, 7.99, 72, "monthly");
    expect(disclosedAnnualRatePct(25_000, p, 72, "monthly")).toBeGreaterThan(7.99);
  });
});

describe("computeFinancing", () => {
  it("produces a complete, internally consistent disclosure block", () => {
    const d = computeFinancing({
      priceCad: 28_995,
      downPaymentCad: 2_000,
      tradeInCad: 0,
      termMonths: 72,
      frequency: "biweekly",
      annualRatePct: 7.99,
    });
    expect(d.cashPrice).toBe(28_995);
    expect(d.paymentCount).toBe(156);
    expect(d.amountFinanced).toBeCloseTo(28_995 + d.taxes.total - 2_000, 2);
    expect(d.totalPayments).toBeCloseTo(d.payment * 156, 2);
    expect(d.costOfCredit).toBeCloseTo(d.totalPayments - d.amountFinanced, 1);
    expect(d.totalObligation).toBeCloseTo(d.totalPayments + 2_000, 2);
    expect(d.creditRatePct).toBe(7.99);
    expect(d.exampleTable).toHaveLength(5);
  });
  it("includes credit fees in both the financed amount and the disclosed rate", () => {
    const d = computeFinancing({
      priceCad: 20_000,
      downPaymentCad: 0,
      tradeInCad: 0,
      termMonths: 60,
      frequency: "monthly",
      annualRatePct: 6.49,
      creditFees: [{ labelFr: "Frais de dossier", labelEn: "File fee", amountCad: 399 }],
    });
    expect(d.creditFeesTotal).toBe(399);
    expect(d.creditRatePct).toBeGreaterThan(6.49);
    expect(d.costOfCredit).toBeGreaterThan(399);
  });
});
