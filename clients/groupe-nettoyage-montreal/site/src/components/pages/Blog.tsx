import Link from "next/link";
import { pagePath, type Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { POSTS, type Post } from "@/content/posts";
import { BIZ } from "@/content/business";
import { Section, CtaBand, PageHero, Breadcrumbs } from "@/components/ui";
import { JsonLd, breadcrumbJsonLd } from "@/components/JsonLd";

const fmt = (iso: string, locale: Locale) => new Date(`${iso}T12:00:00`).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", { day: "numeric", month: "long", year: "numeric" });

export function BlogIndex({ locale }: { locale: Locale }) {
  const d = t(locale);
  return (
    <>
      <PageHero eyebrow={d.nav.blog} title={locale === "fr" ? "Prix, checklists et conseils" : "Prices, checklists and advice"} sub={locale === "fr" ? "Ce que nous expliquons à nos clients au téléphone, écrit une fois pour tous." : "What we explain to clients on the phone, written once for everyone."} />
      <Section><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{POSTS.map((p) => <Link key={p.id} href={pagePath(locale, "blog", p.slug[locale])} className="card flex flex-col p-6 hover:shadow-soft"><p className="text-[12.5px] text-ink-500">{fmt(p.date, locale)} · {p.readMin} {d.common.minRead}</p><h2 className="mt-2 text-[19px] font-semibold leading-snug text-navy-950">{p.title[locale]}</h2><p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-600">{p.excerpt[locale]}</p><span className="mt-4 text-[14px] font-semibold text-amber-600">{d.common.readMore} →</span></Link>)}</div></Section>
      <CtaBand locale={locale} />
    </>
  );
}

export function PostPage({ locale, p }: { locale: Locale; p: Post }) {
  const d = t(locale);
  const blocks = p.body[locale];
  const items: React.ReactNode[] = []; let list: string[] = [];
  const flush = () => { if (list.length) { items.push(<ul key={`l${items.length}`}>{list.map((x) => <li key={x}>{x}</li>)}</ul>); list = []; } };
  blocks.forEach((b, i) => { if (b.startsWith("- ")) list.push(b.slice(2)); else { flush(); if (b.startsWith("## ")) items.push(<h2 key={i}>{b.slice(3)}</h2>); else items.push(<p key={i}>{b}</p>); } }); flush();
  const others = POSTS.filter((x) => x.id !== p.id).slice(0, 3);
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: p.title[locale], description: p.excerpt[locale], datePublished: p.date, dateModified: p.date, inLanguage: locale === "fr" ? "fr-CA" : "en-CA", author: { "@type": "Organization", name: BIZ.name }, publisher: { "@id": `${BIZ.url}/#business` }, mainEntityOfPage: `${BIZ.url}${pagePath(locale, "blog", p.slug[locale])}` }} />
      <JsonLd data={breadcrumbJsonLd(locale, [{ name: d.nav.blog, path: pagePath(locale, "blog") }, { name: p.title[locale], path: pagePath(locale, "blog", p.slug[locale]) }])} />
      <div className="pt-20 sm:pt-24" /><Breadcrumbs items={[{ name: locale === "fr" ? "Accueil" : "Home", href: locale === "fr" ? "/" : "/en" }, { name: d.nav.blog, href: pagePath(locale, "blog") }, { name: p.title[locale] }]} />
      <article className="container-x pb-16 pt-6"><div className="mx-auto max-w-3xl"><p className="eyebrow">{d.nav.blog}</p><h1 className="h-display mt-3 text-3xl sm:text-5xl">{p.title[locale]}</h1><p className="mt-4 text-[14px] text-ink-500">{d.common.publishedOn} {fmt(p.date, locale)} · {p.readMin} {d.common.minRead} · {BIZ.name}</p><p className="mt-6 text-[19px] leading-relaxed text-ink-700">{p.excerpt[locale]}</p><div className="prose-gnm mt-8">{items}</div>
        <div className="mt-12 rounded-2xl bg-navy-950 p-6 text-white"><p className="text-[18px] font-semibold">{locale === "fr" ? "Votre prix en deux minutes" : "Your price in two minutes"}</p><p className="mt-1 text-white/75">{locale === "fr" ? "La grille de cet article est celle de notre outil de soumission." : "The grid in this article is the one our quote tool uses."}</p><Link href={pagePath(locale, "quote")} className="btn btn-primary mt-4">{d.hero.cta}</Link></div></div></article>
      <Section tone="sand" className="!py-14"><h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-500">{locale === "fr" ? "À lire aussi" : "Also read"}</h2><div className="mt-5 grid gap-5 md:grid-cols-3">{others.map((o) => <Link key={o.id} href={pagePath(locale, "blog", o.slug[locale])} className="card p-5 hover:shadow-soft"><h3 className="text-[16px] font-semibold text-navy-950">{o.title[locale]}</h3><p className="mt-2 text-[14px] text-ink-600">{o.excerpt[locale]}</p></Link>)}</div></Section>
    </>
  );
}
