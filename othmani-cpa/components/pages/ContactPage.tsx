import { dict } from "@/content/ui";
import { businessSchema } from "@/lib/schema";
import type { Lang } from "@/lib/site";
import { Breadcrumbs } from "../Breadcrumbs";
import { JsonLd } from "../JsonLd";
import { Shell } from "../Shell";
import { ContactSection } from "../home";

export function ContactPage({ lang }: { lang: Lang }) {
  const t = dict(lang);
  return (
    <Shell lang={lang} routeKey="contact">
      <JsonLd data={businessSchema(lang)} />
      <div className="container-site pt-32 sm:pt-36"><Breadcrumbs lang={lang} items={[{ name: t.nav.contact, key: "contact" }]} /></div>
      <div className="-mt-8"><ContactSection lang={lang} headingLevel={1} /></div>
    </Shell>
  );
}
