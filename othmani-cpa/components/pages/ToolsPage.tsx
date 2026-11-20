import { toolsText } from "@/content/tools";
import { dict } from "@/content/ui";
import type { Lang } from "@/lib/site";
import { CtaBand, PageHeader, SectionHead } from "../blocks";
import { Icon } from "../Icon";
import { Shell } from "../Shell";
import { DocChecklist } from "../tools/DocChecklist";
import { TaxCalculator } from "../tools/TaxCalculator";
import { ThresholdCheck } from "../tools/ThresholdCheck";

export function ToolsPage({ lang }: { lang: Lang }) {
  const t = toolsText[lang];
  const d = dict(lang);
  const jump = [
    ["documents", t.checklist.h2, "receipt"],
    ["calculatrice", t.calc.h2, "percent"],
    ["seuil", t.threshold.h2, "chart"],
  ] as const;
  return (
    <Shell lang={lang} routeKey="tools">
      <PageHeader lang={lang} crumbs={[{ name: d.nav.tools, key: "tools" }]} eyebrow={lang === "fr" ? "Gratuit · Sans inscription" : "Free · No sign-up"} title={t.h1} intro={<p>{t.intro}</p>}>
        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {jump.map(([id, label, icon]) => (
            <li key={id}>
              <a href={`#${id}`} className="glass group flex h-full items-center gap-3 rounded-2xl p-4 font-medium text-navy transition-transform hover:-translate-y-0.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-white"><Icon name={icon} className="h-5 w-5" /></span>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </PageHeader>

      <section id="documents" className="section" aria-labelledby="tool-docs">
        <div className="container-site">
          <SectionHead id="tool-docs" eyebrow="01" title={t.checklist.h2} intro={t.checklist.intro} />
          <div className="mt-10"><DocChecklist lang={lang} /></div>
        </div>
      </section>

      <section className="section mesh" aria-label={`${t.calc.h2} · ${t.threshold.h2}`}>
        <div className="container-site grid gap-12 lg:grid-cols-2">
          <div id="calculatrice">
            <SectionHead id="tool-calc" eyebrow="02" title={t.calc.h2} intro={t.calc.intro} />
            <div className="mt-8"><TaxCalculator lang={lang} /></div>
          </div>
          <div id="seuil">
            <SectionHead id="tool-threshold" eyebrow="03" title={t.threshold.h2} intro={t.threshold.intro} />
            <div className="mt-8"><ThresholdCheck lang={lang} /></div>
          </div>
        </div>
      </section>
      <CtaBand lang={lang} />
    </Shell>
  );
}
