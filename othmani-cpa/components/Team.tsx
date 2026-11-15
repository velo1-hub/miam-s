import { team } from "@/content/team";
import type { Lang } from "@/lib/site";
import { SectionHead } from "./blocks";

/** Grille de l'équipe (page À propos). */
export function Team({ lang }: { lang: Lang }) {
  const fr = lang === "fr";
  return (
    <section className="section" aria-labelledby="team-title">
      <div className="container-site">
        <SectionHead id="team-title" eyebrow={fr ? "L'équipe" : "The team"} title={fr ? "Les personnes derrière votre dossier" : "The people behind your file"} intro={fr ? "Une petite équipe, qui connaît votre dossier et vous répond directement." : "A small team that knows your file and answers you directly."} />
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:max-w-4xl">
          {team.map((m, i) => (
            <li key={m.id} className="reveal group" data-delay={String(i + 1)}>
              <div className="relative overflow-hidden rounded-[1.75rem] border border-line">
                <img src={m.photo} alt={`${m.name}, ${m[lang].role}, Othmani CPA`} width={800} height={1000} loading="lazy" decoding="async" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/70 bg-white/85 px-5 py-4 backdrop-blur-xl">
                  <h3 className="font-display text-lg font-semibold text-navy">{m.name}</h3>
                  <p className="text-sm text-ink/80">{m[lang].role}</p>
                </div>
              </div>
              <p className="mt-4 leading-relaxed text-muted">{m[lang].text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
