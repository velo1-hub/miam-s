export const FREQUENCIES = ["monthly", "biweekly", "weekly"] as const;
export type PaymentFrequency = (typeof FREQUENCIES)[number];
export const PAYMENTS_PER_YEAR: Record<PaymentFrequency, number> = { monthly: 12, biweekly: 26, weekly: 52 };

/**
 * Standard amortized payment: r × PV / (1 − (1 + r)^−N). Handles rate = 0. Brief §14.
 * @param principal amount financed
 * @param annualRatePct nominal annual rate in percent (7.99 = 7.99 %)
 * @param termMonths term in months
 */
export function periodicPayment(principal: number, annualRatePct: number, termMonths: number, frequency: PaymentFrequency): number {
  const perYear = PAYMENTS_PER_YEAR[frequency];
  const n = Math.round((termMonths / 12) * perYear);
  if (n <= 0) return 0;
  if (principal <= 0) return 0;
  const r = annualRatePct / 100 / perYear;
  if (r === 0) return principal / n;
  return (r * principal) / (1 - Math.pow(1 + r, -n));
}

export function paymentCount(termMonths: number, frequency: PaymentFrequency): number {
  return Math.round((termMonths / 12) * PAYMENTS_PER_YEAR[frequency]);
}

/**
 * Québec: the disclosed credit rate (taux de crédit) must include mandatory credit fees. It is
 * the rate at which the payment stream discounts to the amount actually received by the consumer
 * (principal minus fees). Solved with bisection; equals the nominal rate when fees are 0.
 * Returns an annual percentage, compounded per payment period like the nominal rate.
 */
export function disclosedAnnualRatePct(
  amountReceived: number,
  payment: number,
  n: number,
  frequency: PaymentFrequency,
): number {
  if (amountReceived <= 0 || n <= 0 || payment <= 0) return 0;
  const perYear = PAYMENTS_PER_YEAR[frequency];
  if (payment * n <= amountReceived + 1e-9) return 0; // no cost of credit
  const pv = (r: number) => (r === 0 ? payment * n : (payment * (1 - Math.pow(1 + r, -n))) / r);
  let lo = 0;
  let hi = 1; // 100 % per period — far above any legal rate
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (pv(mid) > amountReceived) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-12) break;
  }
  return ((lo + hi) / 2) * perYear * 100;
}
