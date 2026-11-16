import { businessSchema } from "@/lib/schema";
import { portalOn, type Lang } from "@/lib/site";
import { JsonLd } from "../JsonLd";
import { HomeFaq, Services } from "../homeExtra";
import { ConcernBento, LandingHero, Manifesto, Process, Stats, Ticker } from "../landing";
import { Shell } from "../Shell";
import { ContactSection, Dates, Portal, Reviews, Why, Zouhaier } from "../home";

/**
 * Page d'accueil : héros en deux colonnes → bandeau → philosophie → préoccupations →
 * comment ça marche → services → dates → pourquoi nous → avis → Zouhaier et l'équipe → FAQ → contact.
 */
export function HomePage({ lang }: { lang: Lang }) {
  return (
    <Shell lang={lang} routeKey="home">
      <JsonLd data={businessSchema(lang)} />
      <LandingHero lang={lang} />
      <Ticker lang={lang} />
      <Stats lang={lang} />
      <Manifesto lang={lang} />
      <ConcernBento lang={lang} />
      <Process lang={lang} />
      {portalOn() && <Portal lang={lang} />}
      <Services lang={lang} />
      <Dates lang={lang} />
      <Why lang={lang} />
      <Reviews lang={lang} />
      <Zouhaier lang={lang} />
      <HomeFaq lang={lang} />
      <ContactSection lang={lang} />
    </Shell>
  );
}
