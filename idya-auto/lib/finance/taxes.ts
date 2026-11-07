/**
 * Québec sales taxes on a dealer vehicle sale — brief §14. Both taxes apply to the price after
 * the trade-in credit; QST is computed on the pre-GST amount (since 2013). Whole cents.
 * [CLIENT: à valider par le comptable]
 */
export interface TaxBreakdown {
  taxableBase: number;
  gst: number;
  qst: number;
  total: number;
}

export function quebecTaxes(priceCad: number, tradeInCad: number, gstPct = 5, qstPct = 9.975): TaxBreakdown {
  const taxableBase = Math.max(0, priceCad - Math.max(0, tradeInCad));
  const gst = round2((taxableBase * gstPct) / 100);
  const qst = round2((taxableBase * qstPct) / 100);
  return { taxableBase, gst, qst, total: round2(gst + qst) };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
