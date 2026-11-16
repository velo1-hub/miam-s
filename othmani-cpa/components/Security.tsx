import Link from "next/link";
import { security } from "@/content/security";
import { href } from "@/lib/routes";
import { site, type Lang } from "@/lib/site";
import { SectionHead } from "./blocks";
import { Icon } from "./Icon";

/** Sécurité et confidentialité : ce qui protège les renseignements des clients. */
export function Security({ lang }: { lang: Lang }) {
  const s = security[lang];
  return (
    <section id="securite" className="section mesh overflow-hidden" aria-labelledby="security-title">
      <div className="container-site">
        <SectionHead id="security-title" eyebrow={s.eyebrow} title={s.h2} intro={s.intro} />

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.05fr_2fr]">
          {/* Le pilier : le secret professionnel */}
          <div className="reveal on-dark mesh-dark relative flex flex-col overflow-hidden rounded-[2rem] p-8 text-white sm:p-10">
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-sky/25 blur-3xl" aria-hidden="true" />
            <div className="absolute -right-12 -bottom-12 text-white/[0.05]" aria-hidden="true"><Icon name="shield" className="h-72 w-72" strokeWidth={1} /></div>
            <div className="relative flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky text-navy"><Icon name="shield" className="h-7 w-7" /></span>
              <h3 className="text-2xl leading-tight font-semibold text-white sm:text-3xl">{s.pillar.t}</h3>
            </div>
            <p className="relative mt-6 text-lg leading-relaxed text-white/85">{s.pillar.d}</p>
            <div className="relative mt-8 flex-1 border-t border-white/15 pt-7">
              <p className="text-xs font-semibold tracking-[0.14em] text-sky uppercase">{s.pillar.coversTitle}</p>
              <ul className="mt-4 space-y-3.5">
                {s.pillar.covers.map((c) => (
                  <li key={c} className="flex items-start gap-3 leading-snug text-white/90">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-sky"><Icon name="check" className="h-3 w-3" strokeWidth={3} /></span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <p className="glass-dark relative mt-8 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/85">
              <Icon name="badge" className="h-5 w-5 shrink-0 text-sky" /> {s.pillar.foot}
            </p>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2">
            {s.items.map((it, i) => (
              <li key={it.t} className="glass reveal rounded-[1.5rem] p-6" data-delay={String((i % 3) + 1)}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white"><Icon name={it.icon} className="h-5 w-5" /></span>
                <h3 className="mt-5 text-lg leading-snug font-semibold">{it.t}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{it.d}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Prévention de la fraude */}
        <div className="reveal mt-5 grid gap-6 rounded-[2rem] border border-navy/15 bg-white p-7 sm:p-9 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-navy"><Icon name="bell" className="h-5 w-5" /></span>
            <h3 className="mt-5 text-2xl leading-snug font-semibold">{s.fraud.t}</h3>
            <p className="mt-3 leading-relaxed text-muted">{s.fraud.d}</p>
            <a href={`tel:${site.phone.tel}`} className="btn-primary mt-6"><Icon name="phone" className="h-5 w-5" /> {site.phone.display}</a>
          </div>
          <ul className="space-y-4 self-center">
            {s.fraud.list.map((l) => (
              <li key={l} className="flex items-start gap-3 leading-relaxed">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-white"><Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} /></span>
                {l}
              </li>
            ))}
          </ul>
        </div>

        <Link href={href("privacy", lang)} className="reveal mt-8 inline-flex items-center gap-2 font-semibold text-navy underline-offset-4 hover:underline">
          {s.link} <Icon name="arrow" className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}
