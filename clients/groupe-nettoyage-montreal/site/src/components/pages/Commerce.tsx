import Link from "next/link";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { SERVICES, type ServiceId } from "@/content/services";
import { Section, PageHero, Check } from "@/components/ui";
import { QuoteRequest } from "@/components/QuoteRequest";
import { BookingFlow } from "@/components/BookingFlow";
import { BookingLookup } from "@/components/Forms";
import { AssistantOpen } from "@/components/AssistantOpen";
import { I } from "@/components/Icons";
import { BIZ } from "@/content/business";

const isService = (v?: string): v is ServiceId => !!v && SERVICES.some((s) => s.id === v);

export function QuotePage({ locale, service }: { locale: Locale; service?: string }) {
  const d = t(locale); const fr = locale === "fr";
  const steps = fr ? ["Vous décrivez vos locaux en deux minutes.", "Nous passons 20 minutes sur place, en semaine, gratuitement.", "Vous recevez une soumission écrite et détaillée dans les 24 heures.", "Vous décidez. Entente mensuelle, sans durée minimale."] : ["You describe your premises in two minutes.", "We spend 20 minutes on site, on a weekday, free of charge.", "You receive a detailed written quote within 24 hours.", "You decide. Month-to-month agreement, no minimum term."];
  return (
    <>
      <PageHero eyebrow={d.nav.quote} title={fr ? "Demander une soumission" : "Request a quote"} sub={fr ? "Pas de grille publique : chaque local est différent. Décrivez le vôtre, nous passons le voir et vous recevez un montant écrit, par passage et par mois, dans les 24 heures." : "No public price grid: every space is different. Describe yours, we come and see it, and you receive a written amount, per visit and per month, within 24 hours."}><Link href={`${pagePath(locale, "book")}${isService(service) ? `?service=${service}` : ""}`} className="btn btn-primary"><I.calendar width={18} height={18} />{d.common.bookNow}</Link><a href={`tel:${BIZ.phone}`} className="btn btn-light"><I.phone width={18} height={18} />{BIZ.phoneDisplay}</a></PageHero>
      <Section className="!pt-10"><div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]"><QuoteRequest locale={locale} initialService={isService(service) ? service : undefined} />
        <aside className="space-y-5">
          <div className="card p-5"><h2 className="text-[16px] font-semibold text-navy-950">{fr ? "Comment ça se passe" : "How it works"}</h2><ol className="mt-3 space-y-2.5">{steps.map((x, i) => <li key={x} className="flex gap-3 text-[14.5px] text-ink-700"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-950 text-[12px] font-semibold text-white">{i + 1}</span>{x}</li>)}</ol></div>
          <div className="card p-5"><h2 className="text-[16px] font-semibold text-navy-950">{fr ? "Ce que la soumission contient" : "What the quote contains"}</h2><ul className="mt-3 grid gap-2">{(fr ? ["Le montant par passage et par mois, avant taxes", "La liste exacte des tâches à chaque passage", "L'horaire et l'équipe attitrée", "Le certificat d'assurance et les références"] : ["The amount per visit and per month, before tax", "The exact task list for every visit", "The schedule and the dedicated team", "The insurance certificate and references"]).map((x) => <Check key={x}>{x}</Check>)}</ul></div>
          <div className="card p-5"><h2 className="text-[16px] font-semibold text-navy-950">{fr ? "Vous préférez parler?" : "Prefer to talk?"}</h2><p className="mt-2 text-[14.5px] text-ink-600">{fr ? "L'assistant répond 24 h sur 24 et planifie la visite pour vous. Un humain répond au téléphone de 7 h à 21 h." : "The assistant answers 24/7 and schedules the walkthrough for you. A human answers the phone 7 a.m. to 9 p.m."}</p><div className="mt-4 flex flex-wrap gap-2"><AssistantOpen className="btn btn-dark !min-h-10 !py-2">{d.hero.cta2}</AssistantOpen><a href={`tel:${BIZ.phone}`} className="btn btn-ghost !min-h-10 !py-2">{BIZ.phoneDisplay}</a></div></div>
        </aside></div></Section>
    </>
  );
}

export function BookPage({ locale, service }: { locale: Locale; service?: string }) {
  const d = t(locale); const fr = locale === "fr";
  return (
    <>
      <PageHero eyebrow={d.nav.book} title={fr ? "Planifier la visite d'évaluation gratuite" : "Schedule the free walkthrough"} sub={fr ? "20 minutes sur place, en semaine. Calendrier en direct, confirmation immédiate par courriel, soumission écrite dans les 24 heures qui suivent." : "20 minutes on site, on a weekday. Live calendar, instant confirmation by email, written quote within the following 24 hours."} />
      <Section className="!pt-10"><BookingFlow locale={locale} initialService={isService(service) ? service : undefined} /></Section>
    </>
  );
}

export function MyBookingPage({ locale }: { locale: Locale }) {
  const d = t(locale); const fr = locale === "fr";
  return (
    <>
      <PageHero eyebrow={d.nav.myBooking} title={fr ? "Retrouver ma visite" : "Find my walkthrough"} sub={fr ? "Entrez la référence reçue par courriel et votre adresse courriel." : "Enter the reference from your email and your email address."} />
      <Section className="!pt-10"><div className="max-w-3xl"><BookingLookup locale={locale} /><p className="mt-6 text-[14px] text-ink-600">{fr ? "Pour déplacer la visite, annulez puis planifiez de nouveau, ou écrivez-nous." : "To move the walkthrough, cancel and schedule again, or write to us."} <Link href={pagePath(locale, "contact")} className="underline">{d.nav.contact}</Link></p></div></Section>
    </>
  );
}
