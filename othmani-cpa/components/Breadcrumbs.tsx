import Link from "next/link";
import { dict } from "@/content/ui";
import { href } from "@/lib/routes";
import { breadcrumbSchema, type Crumb } from "@/lib/schema";
import type { Lang } from "@/lib/site";
import { JsonLd } from "./JsonLd";

/** Fil d'Ariane visible + BreadcrumbList. Le premier élément (Accueil) est ajouté automatiquement. */
export function Breadcrumbs({ lang, items }: { lang: Lang; items: Crumb[] }) {
  const t = dict(lang);
  const all: Crumb[] = [{ name: t.breadcrumbHome, key: "home" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbSchema(lang, all)} />
      <nav aria-label={t.breadcrumbLabel} className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.key} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="text-ink">{c.name}</span>
                ) : (
                  <>
                    <Link href={href(c.key, lang)} className="underline-offset-4 hover:text-navy hover:underline">{c.name}</Link>
                    <span aria-hidden="true" className="text-navy/40">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
