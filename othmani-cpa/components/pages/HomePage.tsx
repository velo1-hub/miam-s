import { businessSchema } from "@/lib/schema";
import { portalOn, type Lang } from "@/lib/site";
import { JsonLd } from "../JsonLd";
import { FirstMeeting, HomeFaq, Services } from "../homeExtra";
import { Shell } from "../Shell";
import { ContactSection, Dates, Doors, Hero, Portal, Reviews, Steps, Why, Zouhaier } from "../home";

export function HomePage({ lang }: { lang: Lang }) {
  return (
    <Shell lang={lang} routeKey="home">
      <JsonLd data={businessSchema(lang)} />
      <Hero lang={lang} />
      <Doors lang={lang} />
      <Services lang={lang} />
      <Steps lang={lang} />
      <FirstMeeting lang={lang} />
      {portalOn() && <Portal lang={lang} />}
      <Dates lang={lang} />
      <Why lang={lang} />
      <Reviews lang={lang} />
      <Zouhaier lang={lang} />
      <HomeFaq lang={lang} />
      <ContactSection lang={lang} />
    </Shell>
  );
}
