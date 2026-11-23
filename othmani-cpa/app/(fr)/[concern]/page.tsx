import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConcernPage } from "@/components/ConcernPage";
import { concerns } from "@/content/concerns";
import { slugOf } from "@/lib/routes";
import { pageMeta } from "@/lib/seo";

const LANG = "fr" as const;
export const dynamicParams = false;

export function generateStaticParams() {
  return concerns.map((c) => ({ concern: slugOf(c.key, LANG) }));
}

const find = (slug: string) => concerns.find((c) => slugOf(c.key, LANG) === slug);

export async function generateMetadata({ params }: { params: Promise<{ concern: string }> }): Promise<Metadata> {
  const c = find((await params).concern);
  if (!c) return {};
  return pageMeta(c.key, LANG, c[LANG].title, c[LANG].description);
}

export default async function Page({ params }: { params: Promise<{ concern: string }> }) {
  const c = find((await params).concern);
  if (!c) notFound();
  return <ConcernPage lang={LANG} routeKey={c.key} />;
}
