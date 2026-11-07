import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Assistant } from "@/components/assistant/assistant";
import { ConsentBanner } from "@/components/consent/consent-banner";
import { Analytics } from "@/components/layout/analytics";
import { BookingProvider } from "@/components/booking/booking-context";
import { LeadDialogProvider } from "@/components/forms/lead-dialog-context";
import { DealerProvider } from "@/components/layout/dealer-context";
import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";
import { SkipLink } from "@/components/layout/skip-link";
import { MotionProvider } from "@/components/ui/motion";
import { ToastProvider } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { locale as rootLocale } from "next/root-params";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { env } from "@/lib/env";
import { inter } from "@/lib/fonts";
import { getSettings } from "@/lib/settings";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const raw = await rootLocale();
  const locale = (hasLocale(routing.locales, raw) ? raw : routing.defaultLocale) as AppLocale;
  const t = await getTranslations({ locale, namespace: "seo" });
  const settings = await getSettings();
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: t("homeTitle", { city: settings.business.city }), template: "%s | Idya Auto" },
    description: t("homeDescription", { city: settings.business.city }),
    applicationName: "Idya Auto",
    robots: env.demoMode ? { index: false, follow: false } : { index: true, follow: true },
    icons: { icon: "/icon" },
  };
}

export const viewport: Viewport = {
  themeColor: "#08080A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  // Root param (not the page's params promise) so unknown [slug] shells can still prerender the layout.
  const raw = await rootLocale();
  if (!hasLocale(routing.locales, raw)) notFound();
  const locale: AppLocale = raw;
  setRequestLocale(locale);
  const [settings, messages] = await Promise.all([getSettings(), import(`@/messages/${locale}.json`).then((m) => m.default)]);

  return (
    <html lang={locale === "fr" ? "fr-CA" : "en-CA"} className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="America/Toronto">
          <NuqsAdapter>
          <MotionProvider>
            <TooltipProvider>
              <ToastProvider>
                <DealerProvider value={{ phone: settings.business.phone, displayName: settings.business.displayName, assistantName: settings.assistant.name, chatRetentionDays: settings.retention.chatDays }}>
                <BookingProvider>
                <LeadDialogProvider>
                  <SkipLink />
                  <Nav phone={settings.business.phone} />
                  <main id="main" className="flex-1">
                    {children}
                  </main>
                  <Footer settings={settings} demoMode={env.demoMode} />
                  <Assistant locale={locale} enabled={settings.assistant.enabled} />
                  <ConsentBanner />
                </LeadDialogProvider>
                </BookingProvider>
                </DealerProvider>
              </ToastProvider>
            </TooltipProvider>
          </MotionProvider>
          </NuqsAdapter>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
