import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, pageSlugs, pagePath, type Locale, type PageKey } from "@/i18n/config";
import { SERVICES, serviceBySlug } from "@/content/services";
import { ZONES, zoneBySlug } from "@/content/zones";
import { POSTS, postBySlug } from "@/content/posts";
import { ServicesIndex, ServicePage } from "@/components/pages/Services";
import { ZonesIndex, ZonePage } from "@/components/pages/Zones";
import { QuotePage, BookPage, MyBookingPage } from "@/components/pages/Commerce";
import { AboutPage, MethodPage, ReviewsPage, WorkPage, CareersPage, ContactPage } from "@/components/pages/Company";
import { BlogIndex, PostPage } from "@/components/pages/Blog";
import { LegalPage } from "@/components/pages/Legal";

type Params = { locale: string; slug: string[] };
type Props = { params: Promise<Params>; searchParams: Promise<Record<string, string | string[] | undefined>> };

function keyFor(locale: Locale, first: string): PageKey | null {
  return (Object.keys(pageSlugs) as PageKey[]).find((k) => pageSlugs[k][locale] === first) ?? null;
}

export function generateStaticParams(): Params[] {
  const out: Params[] = [];
  for (const locale of locales) {
    for (const k of Object.keys(pageSlugs) as PageKey[]) if (k !== "confirmation") out.push({ locale, slug: [pageSlugs[k][locale]] });
    SERVICES.forEach((s) => out.push({ locale, slug: [pageSlugs.services[locale], s.slug[locale]] }));
    ZONES.forEach((z) => out.push({ locale, slug: [pageSlugs.zones[locale], z.slug[locale]] }));
    POSTS.forEach((p) => out.push({ locale, slug: [pageSlugs.blog[locale], p.slug[locale]] }));
  }
  return out;
}
export const dynamicParams = false;

const TITLES: Record<PageKey, Record<Locale, [string, string]>> = {
  services: { fr: ["Services d'entretien commercial à Montréal", "Bureaux, restaurants, immeubles, locations court terme, chantiers. Visite gratuite, soumission écrite en 24 h, équipe attitrée."], en: ["Commercial cleaning services in Montréal", "Offices, restaurants, buildings, short-term rentals, construction sites. Free walkthrough, written quote within 24 h, dedicated team."] },
  zones: { fr: ["Zones desservies", "Montréal, Plateau, centre-ville, Laval, Longueuil, Brossard et Ouest-de-l'Île."], en: ["Areas we serve", "Montréal, Plateau, downtown, Laval, Longueuil, Brossard and the West Island."] },
  quote: { fr: ["Demander une soumission", "Décrivez vos locaux, nous passons les voir, vous recevez une soumission écrite en 24 heures. Entreprises et gestionnaires seulement."], en: ["Request a quote", "Describe your premises, we come and see them, you receive a written quote within 24 hours. Businesses and managers only."] },
  book: { fr: ["Planifier une visite d'évaluation gratuite", "20 minutes sur place, en semaine. Choisissez un créneau en direct, confirmation immédiate par courriel."], en: ["Schedule a free walkthrough", "20 minutes on site, on a weekday. Pick a live slot, instant confirmation by email."] },
  about: { fr: ["À propos de Groupe Nettoyage Montréal", "Qui nous sommes, comment nous travaillons, assurances et engagements."], en: ["About Groupe Nettoyage Montréal", "Who we are, how we work, insurance and commitments."] },
  method: { fr: ["Notre méthode", "Liste de vérification, équipe attitrée, rapport photo, garantie 24 h."], en: ["Our method", "Checklist, dedicated team, photo report, 24-hour guarantee."] },
  reviews: { fr: ["Avis clients", "Avis Google vérifiés de nos clients commerciaux."], en: ["Client reviews", "Verified Google reviews from our commercial clients."] },
  work: { fr: ["Réalisations", "Avant / après et études de cas."], en: ["Our work", "Before / after and case studies."] },
  careers: { fr: ["Carrières en entretien ménager à Montréal", "Postes à temps plein et partiel, salaire au-dessus du décret, même équipe, horaires stables."], en: ["Cleaning jobs in Montréal", "Full and part-time positions, above-decree pay, stable teams and schedules."] },
  blog: { fr: ["Blogue", "Guides, checklists et conseils d'entretien commercial pour Montréal."], en: ["Blog", "Guides, checklists and commercial cleaning advice for Montréal."] },
  contact: { fr: ["Contact", "Appelez, écrivez ou planifiez une visite en ligne. Réponse sous 24 heures ouvrables."], en: ["Contact", "Call, write or schedule a walkthrough online. Reply within 24 business hours."] },
  privacy: { fr: ["Politique de confidentialité", "Loi 25 : renseignements collectés, témoins, responsable de la protection."], en: ["Privacy policy", "Law 25: information collected, cookies, privacy officer."] },
  terms: { fr: ["Conditions d'utilisation et de service", "Visites, soumissions, annulations, garantie, paiement."], en: ["Terms of use and service", "Walkthroughs, quotes, cancellations, guarantee, payment."] },
  accessibility: { fr: ["Accessibilité", "Notre engagement WCAG 2.1 AA."], en: ["Accessibility", "Our WCAG 2.1 AA commitment."] },
  myBooking: { fr: ["Ma visite", "Retrouver, déplacer ou annuler une visite d'évaluation."], en: ["My walkthrough", "Find, move or cancel a walkthrough."] },
  confirmation: { fr: ["Confirmation", ""], en: ["Confirmation", ""] },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params; if (!isLocale(raw)) return {}; const locale = raw;
  const key = keyFor(locale, slug[0]); if (!key) return {};
  const other: Locale = locale === "fr" ? "en" : "fr";
  const alt = (frPath: string, enPath: string) => ({ canonical: locale === "fr" ? frPath : enPath, languages: { "fr-CA": frPath, "en-CA": enPath, "x-default": frPath } });
  if (slug.length === 2) {
    if (key === "services") { const s = serviceBySlug(locale, slug[1]); if (!s) return {}; return { title: `${s.name[locale]} · ${locale === "fr" ? "Montréal" : "Montréal"}`, description: s.intro[locale].slice(0, 155), alternates: alt(pagePath("fr", "services", s.slug.fr), pagePath("en", "services", s.slug.en)) }; }
    if (key === "zones") { const z = zoneBySlug(locale, slug[1]); if (!z) return {}; return { title: locale === "fr" ? `Entretien commercial ${z.name.fr}` : `Commercial cleaning ${z.name.en}`, description: z.intro[locale], alternates: alt(pagePath("fr", "zones", z.slug.fr), pagePath("en", "zones", z.slug.en)) }; }
    if (key === "blog") { const p = postBySlug(locale, slug[1]); if (!p) return {}; return { title: p.title[locale], description: p.excerpt[locale], alternates: alt(pagePath("fr", "blog", p.slug.fr), pagePath("en", "blog", p.slug.en)), openGraph: { type: "article", publishedTime: p.date } }; }
  }
  const [title, description] = TITLES[key][locale]; void other;
  return { title, description, alternates: alt(pagePath("fr", key), pagePath("en", key)), robots: key === "myBooking" || key === "confirmation" ? { index: false } : undefined };
}

export default async function Page({ params, searchParams }: Props) {
  const { locale: raw, slug } = await params; if (!isLocale(raw)) notFound(); const locale: Locale = raw; const sp = await searchParams;
  const key = keyFor(locale, slug[0]); if (!key || slug.length > 2) notFound();
  if (slug.length === 2) {
    if (key === "services") { const s = serviceBySlug(locale, slug[1]); if (!s) notFound(); return <ServicePage locale={locale} s={s} />; }
    if (key === "zones") { const z = zoneBySlug(locale, slug[1]); if (!z) notFound(); return <ZonePage locale={locale} z={z} />; }
    if (key === "blog") { const p = postBySlug(locale, slug[1]); if (!p) notFound(); return <PostPage locale={locale} p={p} />; }
    notFound();
  }
  const svcParam = typeof sp.service === "string" ? sp.service : undefined;
  switch (key) {
    case "services": return <ServicesIndex locale={locale} />;
    case "zones": return <ZonesIndex locale={locale} />;
    case "quote": return <QuotePage locale={locale} service={svcParam} />;
    case "book": return <BookPage locale={locale} service={svcParam} />;
    case "myBooking": case "confirmation": return <MyBookingPage locale={locale} />;
    case "about": return <AboutPage locale={locale} />;
    case "method": return <MethodPage locale={locale} />;
    case "reviews": return <ReviewsPage locale={locale} />;
    case "work": return <WorkPage locale={locale} />;
    case "careers": return <CareersPage locale={locale} />;
    case "contact": return <ContactPage locale={locale} />;
    case "blog": return <BlogIndex locale={locale} />;
    case "privacy": case "terms": case "accessibility": return <LegalPage locale={locale} kind={key} />;
  }
}
