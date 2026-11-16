import { businessSchema } from "@/lib/schema";
import { portalOn, type Lang } from "@/lib/site";
import { JsonLd } from "../JsonLd";
import { HomeFaq, Services } from "../homeExtra";
import { LandingHero, Manifesto, MediaDoors, Process, StatsBand, TeamShowcase, Ticker } from "../landing";
import { Shell } from "../Shell";
import { ContactSection, Dates, Portal, Reviews } from "../home";

/**
 * Page d'accueil cinématique : héros plein écran animé → bandeau → grandes cartes photo des
 * préoccupations → philosophie → étapes → chiffres sur photo → services → dates → équipe →
 * avis → FAQ → contact.
 */
export function HomePage({ lang }: { lang: Lang }) {
  return (
    <Shell lang={lang} routeKey="home" overlayHeader>
      <JsonLd data={businessSchema(lang)} />
      <LandingHero lang={lang} />
      <Ticker lang={lang} />
      <MediaDoors lang={lang} />
      <Manifesto lang={lang} />
      <Process lang={lang} />
      {portalOn() && <Portal lang={lang} />}
      <StatsBand lang={lang} />
      <Services lang={lang} />
      <Dates lang={lang} />
      <TeamShowcase lang={lang} />
      <div className="pt-20 sm:pt-28"><Reviews lang={lang} /></div>
      <HomeFaq lang={lang} />
      <ContactSection lang={lang} />
    </Shell>
  );
}
