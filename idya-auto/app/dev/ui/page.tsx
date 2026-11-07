import { NextIntlClientProvider } from "next-intl";
import { Suspense } from "react";
import fr from "@/messages/fr.json";
import { ToastProvider } from "@/components/ui/toast";
import { Gallery } from "./gallery";

export const metadata = { title: "UI · Idya Auto", robots: { index: false } };

export default function DevUiPage() {
  return (
    <Suspense>
      <NextIntlClientProvider locale="fr" messages={fr} timeZone="America/Toronto">
        <ToastProvider>
          <Gallery />
        </ToastProvider>
      </NextIntlClientProvider>
    </Suspense>
  );
}
