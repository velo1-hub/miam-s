"use client";

import { Suspense } from "react";
import { AssistantProvider } from "./assistant-context";
import { AssistantLauncher } from "./launcher";

/** Mounted once in the locale layout. Suspense: the provider reads search params. */
export function Assistant({ locale, enabled }: { locale: "fr" | "en"; enabled: boolean }) {
  if (!enabled) return null;
  return (
    <Suspense>
      <AssistantProvider locale={locale}>
        <AssistantLauncher />
      </AssistantProvider>
    </Suspense>
  );
}
