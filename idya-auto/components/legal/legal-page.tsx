import type { LegalSection } from "@/lib/legal/content";

/** Legal page — no-red zone (brief §3.2), readable measure, sentence-case headings. */
export function LegalPage({ title, updated, validate, sections }: { title: string; updated: string; validate: string; sections: LegalSection[] }) {
  return (
    <article className="container-content pb-24 pt-32 md:pt-40">
      <div className="max-w-[72ch]">
        <h1 className="text-h1">{title}</h1>
        <p className="mt-3 text-small text-text-3">{updated}</p>
        <p className="mt-2 text-caption text-text-3">{validate}</p>
        <div className="mt-12 flex flex-col gap-10">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-h3">{s.title}</h2>
              {s.paragraphs.map((p, i) => (
                <p key={i} className="mt-3 text-body text-text-2">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
