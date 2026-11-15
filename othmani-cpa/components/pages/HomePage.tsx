import { businessSchema } from "@/lib/schema";
import type { Lang } from "@/lib/site";
import { JsonLd } from "../JsonLd";
import { Shell } from "../Shell";
import { ContactSection, Dates, Doors, Hero, Portal, Reviews, Steps, Why, Zouhaier } from "../home";

export function HomePage({ lang }: { lang: Lang }) {
  return (
    <Shell lang={lang} routeKey="home" overlayHeader>
      <JsonLd data={businessSchema(lang)} />
      <Hero lang={lang} />
      <Doors lang={lang} />
      <Steps lang={lang} />
      <Portal lang={lang} />
      <Dates lang={lang} />
      <Why lang={lang} />
      <Reviews lang={lang} />
      <Zouhaier lang={lang} />
      <ContactSection lang={lang} />
    </Shell>
  );
}
