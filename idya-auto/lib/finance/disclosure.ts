import { disclosedAnnualRatePct, paymentCount, periodicPayment, type PaymentFrequency } from "./payment";
import { quebecTaxes, round2 } from "./taxes";
import type { CreditFee } from "@/lib/settings/types";

export interface FinancingInput {
  priceCad: number;
  downPaymentCad: number;
  tradeInCad: number;
  termMonths: number;
  frequency: PaymentFrequency;
  annualRatePct: number;
  creditFees?: CreditFee[];
  gstPct?: number;
  qstPct?: number;
}

/** Every mandatory mention of brief §14 in one object, so no UI can show a payment without them. */
export interface FinancingDisclosure {
  cashPrice: number;
  taxes: { gst: number; qst: number; total: number; taxableBase: number };
  downPayment: number;
  tradeIn: number;
  creditFees: CreditFee[];
  creditFeesTotal: number;
  /** amount financed (price + taxes + fees − down − trade-in) */
  amountFinanced: number;
  nominalRatePct: number;
  /** disclosed taux de crédit including fees */
  creditRatePct: number;
  termMonths: number;
  frequency: PaymentFrequency;
  paymentCount: number;
  payment: number;
  totalPayments: number;
  /** frais de crédit: total paid − amount received by the consumer */
  costOfCredit: number;
  /** obligation totale: total payments + down + trade-in */
  totalObligation: number;
  /** example table at the same inputs for 36/48/60/72/84 months */
  exampleTable: { termMonths: number; payment: number; costOfCredit: number; totalObligation: number }[];
}

export function computeFinancing(input: FinancingInput): FinancingDisclosure {
  const fees = input.creditFees ?? [];
  const creditFeesTotal = round2(fees.reduce((s, f) => s + f.amountCad, 0));
  const taxes = quebecTaxes(input.priceCad, input.tradeInCad, input.gstPct, input.qstPct);
  const down = Math.max(0, input.downPaymentCad);
  const trade = Math.max(0, input.tradeInCad);
  const amountReceived = Math.max(0, round2(input.priceCad + taxes.total - down - trade));
  const amountFinanced = round2(amountReceived + creditFeesTotal);

  const build = (term: number) => {
    const n = paymentCount(term, input.frequency);
    const payment = round2(periodicPayment(amountFinanced, input.annualRatePct, term, input.frequency));
    const totalPayments = round2(payment * n);
    const costOfCredit = round2(Math.max(0, totalPayments - amountReceived));
    const totalObligation = round2(totalPayments + down + trade);
    return { n, payment, totalPayments, costOfCredit, totalObligation };
  };

  const main = build(input.termMonths);
  const creditRatePct =
    creditFeesTotal > 0
      ? disclosedAnnualRatePct(amountReceived, main.payment, main.n, input.frequency)
      : input.annualRatePct;

  return {
    cashPrice: input.priceCad,
    taxes,
    downPayment: down,
    tradeIn: trade,
    creditFees: fees,
    creditFeesTotal,
    amountFinanced,
    nominalRatePct: input.annualRatePct,
    creditRatePct: round2(creditRatePct),
    termMonths: input.termMonths,
    frequency: input.frequency,
    paymentCount: main.n,
    payment: main.payment,
    totalPayments: main.totalPayments,
    costOfCredit: main.costOfCredit,
    totalObligation: main.totalObligation,
    exampleTable: [36, 48, 60, 72, 84].map((t) => {
      const b = build(t);
      return { termMonths: t, payment: b.payment, costOfCredit: b.costOfCredit, totalObligation: b.totalObligation };
    }),
  };
}
