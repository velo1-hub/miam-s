"use client";

import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import { track } from "@/lib/analytics/track";
import { formatPrice, type Locale } from "@/lib/format/number";
import { cn } from "@/lib/utils/cn";

interface Props {
  makes: { value: string; models: string[] }[];
  className?: string;
}

const BUDGETS = [20_000, 30_000, 40_000, 50_000, 70_000];

/**
 * AI search bar — brief §6.1: one glass-2 field (height 72, pill) with placeholders cycling every
 * 3 s, Enter runs natural-language search; a small toggle reveals Marque · Modèle · Budget max.
 * On mobile it collapses into one glass button that opens a sheet.
 */
export function HeroSearch({ makes, className }: Props) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={cn("hidden md:block", className)}>
        <SearchForm makes={makes} locale={locale} onSubmit={() => undefined} router={router} />
      </div>
      <div className={cn("md:hidden", className)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="press glass-2 flex h-14 w-full items-center gap-3 rounded-pill px-5 text-left text-body text-text-2"
        >
          <Search className="size-5 text-text" strokeWidth={1.5} aria-hidden />
          {t("searchMobile")}
        </button>
        <Dialog open={open} onOpenChange={setOpen} title={t("searchMobile")} closeLabel={tc("close")} mode="sheet">
          <SearchForm makes={makes} locale={locale} onSubmit={() => setOpen(false)} router={router} stacked />
        </Dialog>
      </div>
    </>
  );
}

function SearchForm({
  makes,
  locale,
  onSubmit,
  router,
  stacked,
}: Props & { locale: Locale; onSubmit: () => void; router: ReturnType<typeof useRouter>; stacked?: boolean }) {
  const t = useTranslations("home");
  const placeholders = t.raw("searchPlaceholders") as string[];
  const [classic, setClassic] = useState(false);
  const [q, setQ] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [budget, setBudget] = useState("");
  const [phIndex, setPhIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const id = useId();

  // Cycle placeholders every 3 s; paused on focus and under reduced motion
  useEffect(() => {
    if (focused || classic) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setPhIndex((i) => (i + 1) % placeholders.length), 3000);
    return () => window.clearInterval(timer);
  }, [focused, classic, placeholders.length]);

  const models = makes.find((m) => m.value === make)?.models ?? [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (classic) {
      if (make) params.set("make", make);
      if (model) params.set("model", model);
      if (budget) params.set("price_max", budget);
      track("search_submitted", { make, model, budget });
    } else if (q.trim()) {
      params.set("q", q.trim());
      params.set("ai", "1");
      track("ai_search_submitted", { length: q.trim().length });
    }
    onSubmit();
    router.push({ pathname: "/inventory", query: Object.fromEntries(params) });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {!classic ? (
        <div className={cn("glass-2 flex items-center gap-3 rounded-pill pl-5 pr-2", stacked ? "h-14" : "h-search")}>
          <Sparkles className="size-5 shrink-0 text-red-text" strokeWidth={1.5} aria-hidden />
          <label htmlFor={`${id}-q`} className="sr-only">
            {t("searchLabel")}
          </label>
          <input
            id={`${id}-q`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholders[phIndex]}
            autoComplete="off"
            enterKeyHint="search"
            className="no-red min-w-0 flex-1 bg-transparent text-body text-text placeholder:text-text-3 outline-none"
          />
          <Button type="submit" variant="light" size="md" aria-label={t("searchButton")} className="shrink-0 px-5">
            <Search strokeWidth={1.5} aria-hidden />
            <span className="hidden lg:inline">{t("searchButton")}</span>
          </Button>
        </div>
      ) : (
        <div className={cn("glass-2 grid gap-2 rounded-card p-2", stacked ? "grid-cols-1" : "grid-cols-[1fr_1fr_1fr_auto] items-center")}>
          <select value={make} onChange={(e) => { setMake(e.target.value); setModel(""); }} aria-label={t("make")} className="no-red h-12 rounded-pill bg-transparent px-4 text-text outline-none">
            <option value="" className="bg-surface">{t("anyMake")}</option>
            {makes.map((m) => <option key={m.value} value={m.value} className="bg-surface">{m.value}</option>)}
          </select>
          <select value={model} onChange={(e) => setModel(e.target.value)} aria-label={t("model")} disabled={!make} className="no-red h-12 rounded-pill bg-transparent px-4 text-text outline-none disabled:opacity-50">
            <option value="" className="bg-surface">{t("anyModel")}</option>
            {models.map((m) => <option key={m} value={m} className="bg-surface">{m}</option>)}
          </select>
          <select value={budget} onChange={(e) => setBudget(e.target.value)} aria-label={t("budgetMax")} className="no-red h-12 rounded-pill bg-transparent px-4 text-text outline-none">
            <option value="" className="bg-surface">{t("anyBudget")}</option>
            {BUDGETS.map((b) => <option key={b} value={b} className="bg-surface">{formatPrice(b, locale)}</option>)}
          </select>
          <Button type="submit" variant="light" size="md" className="px-5">
            <Search strokeWidth={1.5} aria-hidden />
            {t("searchButton")}
          </Button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setClassic((v) => !v)}
        className="inline-flex items-center gap-1.5 self-start text-small text-text-2 underline-offset-4 hover:text-text hover:underline"
      >
        {classic ? <Sparkles className="size-4" strokeWidth={1.5} aria-hidden /> : <SlidersHorizontal className="size-4" strokeWidth={1.5} aria-hidden />}
        {classic ? t("aiSearch") : t("classicSearch")}
      </button>
    </form>
  );
}
