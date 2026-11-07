import { Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/forms/forms";
import { HoursStatus } from "@/components/layout/hours-status";
import { HoursTable } from "@/components/layout/hours-table";
import { Reveal } from "@/components/ui/reveal";
import { resolveLocale } from "@/i18n/server";
import { env } from "@/lib/env";
import { formatPhone } from "@/lib/format/phone";
import { dealerJsonLd } from "@/lib/seo/jsonld";
import { getSettings } from "@/lib/settings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "contactPage" });
  return { title: t("title"), description: t("metaDescription"), alternates: { canonical: `/${locale}/contact`, languages: { "fr-CA": "/fr/contact", "en-CA": "/en/contact" } } };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  await resolveLocale(params);
  const t = await getTranslations("contactPage");
  const settings = await getSettings();
  const b = settings.business;
  const mapQuery = encodeURIComponent(`${b.addressLine1}, ${b.city}, ${b.province} ${b.postalCode}`);
  return (
    <div className="container-content pb-24 pt-32 md:pt-40">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dealerJsonLd(settings, env.siteUrl)) }} />
      <div className="max-w-[760px]">
        <p className="eyebrow mb-3">{t("title")}</p>
        <h1 className="text-h1">{t("headline")}</h1>
        <p className="mt-5 text-body-lg text-text-2">{t("intro")}</p>
      </div>
      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <Reveal className="flex flex-col gap-8">
          <div className="flex gap-4">
            <MapPin className="mt-1 size-5 shrink-0 text-titanium" strokeWidth={1.5} aria-hidden />
            <div>
              <p className="eyebrow mb-1">{t("address")}</p>
              <address className="not-italic text-body text-text">
                {b.addressLine1}
                <br />
                {b.city}, {b.province} {b.postalCode}
              </address>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-small text-text-2 underline-offset-4 hover:text-text hover:underline">{b.mapsUrl ? "Google Maps" : ""}</a>
            </div>
          </div>
          <div className="flex gap-4">
            <Phone className="mt-1 size-5 shrink-0 text-titanium" strokeWidth={1.5} aria-hidden />
            <div>
              <p className="eyebrow mb-1">{t("phone")}</p>
              <a href={`tel:${b.phone}`} className="text-body text-text hover:underline">{formatPhone(b.phone)}</a>
            </div>
          </div>
          <div className="flex gap-4">
            <Mail className="mt-1 size-5 shrink-0 text-titanium" strokeWidth={1.5} aria-hidden />
            <div>
              <p className="eyebrow mb-1">{t("email")}</p>
              <a href={`mailto:${b.email}`} className="text-body text-text hover:underline">{b.email}</a>
            </div>
          </div>
          <div>
            <p className="eyebrow mb-3">{t("hours")}</p>
            <HoursStatus settings={settings} className="mb-3" />
            <HoursTable hours={settings.hours} />
          </div>
        </Reveal>
        <Reveal delay={0.05} className="glass-lite rounded-card p-6 md:p-10">
          <ContactForm phone={b.phone} />
        </Reveal>
      </div>
    </div>
  );
}
