import { businessSchema } from "@/lib/schema";
import { portalOn, type Lang } from "@/lib/site";
import { JsonLd } from "../JsonLd";
import { ConcernT, ContactLedger, DatesLedger, LandingHero, Manifesto, Process, ReviewsFaq, ServicesLedger, Ticker, WhyTeam } from "../landing";
import { Shell } from "../Shell";
import { Portal } from "../home";

/**
 * Page d'accueil, style « Grand livre » : héros → bandeau → compte en T des préoccupations →
 * philosophie → étapes → services → dates → pourquoi nous et équipe → FAQ et avis → contact.
 */
export function HomePage({ lang }: { lang: Lang }) {
  return (
    <Shell lang={lang} routeKey="home">
      <JsonLd data={businessSchema(lang)} />
      <LandingHero lang={lang} />
      <Ticker lang={lang} />
      <ConcernT lang={lang} />
      <Manifesto lang={lang} />
      <Process lang={lang} />
      {portalOn() && <Portal lang={lang} />}
      <ServicesLedger lang={lang} />
      <DatesLedger lang={lang} />
      <WhyTeam lang={lang} />
      <ReviewsFaq lang={lang} />
      <ContactLedger lang={lang} />
    </Shell>
  );
}
