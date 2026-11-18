import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { getDB } from "@/lib/db";
import { Section, Heading } from "./ui";
import { I } from "./Icons";
export async function Reviews({ locale }: { locale: Locale }) {
  const d = t(locale); let reviews: Awaited<ReturnType<ReturnType<typeof getDB>["listReviews"]>> = [];
  try { reviews = (await getDB().listReviews()).filter((r) => r.locale === "both" || r.locale === locale).slice(0, 6); } catch {}
  if (reviews.length === 0) return null; // Section appears once real reviews are synced from Google.
  return (
    <Section>
      <Heading eyebrow="Google" title={d.sections.reviewsTitle} sub={d.sections.reviewsSub} />
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{reviews.map((r) => <blockquote key={r.id} className="card p-6"><div className="flex gap-0.5 text-amber-500">{Array.from({ length: r.rating }).map((_, i) => <I.star key={i} width={16} height={16} />)}</div><p className="mt-3 text-[15.5px] leading-relaxed text-ink-700">“{r.text}”</p><footer className="mt-4 text-[13.5px] text-ink-500">{r.author} · {r.date}{r.url && <> · <a className="underline" href={r.url} rel="noopener nofollow" target="_blank">Google</a></>}</footer></blockquote>)}</div>
    </Section>
  );
}
