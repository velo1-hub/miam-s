"use client";

import { useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/dialog";
import { useDealerPhone } from "@/components/layout/dealer-context";
import type { LeadDialogState } from "./lead-dialog-context";
import { AlertForm, ContactForm, FinancingForm, HumanForm, QuestionForm, TradeInForm } from "./forms";

export function LeadDialog({ state, onOpenChange }: { state: LeadDialogState; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("forms");
  const ta = useTranslations("assistant");
  const tc = useTranslations("common");
  const phone = useDealerPhone();
  const titles: Record<LeadDialogState["type"], string> = {
    question: t("question.title"),
    financing: t("financing.title"),
    trade_in: t("tradeIn.title"),
    contact: t("contact.title"),
    inventory_alert: t("alert.title"),
    human: ta("human"),
  };
  const common = { phone, context: state.context };
  return (
    <Dialog open={state.open} onOpenChange={onOpenChange} title={titles[state.type]} closeLabel={tc("close")} className="md:max-w-[640px]">
      {state.type === "question" && <QuestionForm {...common} />}
      {state.type === "financing" && <FinancingForm {...common} />}
      {state.type === "trade_in" && <TradeInForm {...common} />}
      {state.type === "contact" && <ContactForm {...common} />}
      {state.type === "inventory_alert" && <AlertForm {...common} />}
      {state.type === "human" && <HumanForm {...common} />}
    </Dialog>
  );
}
