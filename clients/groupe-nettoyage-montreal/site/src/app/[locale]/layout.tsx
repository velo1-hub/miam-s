import type { Metadata } from "next";
import "../globals.css";
import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Consent } from "@/components/Consent";
import { Assistant } from "@/components/Assistant";
import { StickyBar } from "@/components/StickyBar";
import { JsonLd, businessJsonLd } from "@/components/JsonLd";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { BIZ } from "@/content/business";

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params; const fr = locale === "fr";
  return {
    metadataBase: new URL(BIZ.url),
    title: { default: fr ? "Groupe Nettoyage Montréal · Entretien ménager résidentiel et commercial" : "Groupe Nettoyage Montréal · Residential and commercial cleaning", template: "%s · Groupe Nettoyage Montréal" },
    description: fr ? "Nettoyage de maisons, condos, Airbnb, bureaux et immeubles à Montréal, Laval et sur la Rive-Sud. Prix ferme en ligne, réservation en deux minutes, même équipe à chaque visite." : "Cleaning for homes, condos, Airbnbs, offices and buildings in Montréal, Laval and the South Shore. Firm online price, two-minute booking, same team every visit.",
    applicationName: BIZ.name, openGraph: { siteName: BIZ.name, locale: fr ? "fr_CA" : "en_CA", type: "website" }, twitter: { card: "summary_large_image" }, robots: { index: true, follow: true }, manifest: "/manifest.webmanifest",
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params; if (!isLocale(raw)) notFound(); const locale: Locale = raw;
  return (
    <html lang={locale === "fr" ? "fr-CA" : "en-CA"}>
      <head><noscript><style>{`.reveal{opacity:1!important;transform:none!important}.hero-video{display:none}`}</style></noscript></head>
      <body>
        <a href="#main" className="sr-only sr-only-focusable">{locale === "fr" ? "Aller au contenu" : "Skip to content"}</a>
        <JsonLd data={businessJsonLd(locale)} />
        <ScrollProgress />
        <Header locale={locale} />
        <main id="main">{children}</main>
        <Footer locale={locale} />
        <StickyBar locale={locale} />
        <Assistant locale={locale} />
        <Consent locale={locale} />
      </body>
    </html>
  );
}
