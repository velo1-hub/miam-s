"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { concerns } from "@/content/concerns";
import { dict } from "@/content/ui";
import { href, type RouteKey } from "@/lib/routes";
import { portalHref, type Lang } from "@/lib/site";
import { Icon } from "./Icon";

/**
 * Clara : assistante d'orientation entièrement locale (aucun serveur, aucun enregistrement).
 * Elle reconnaît des mots-clés et propose la page la plus utile, ou l'équipe.
 */
const keywords: Record<string, { fr: string[]; en: string[] }> = {
  personalTaxes: { fr: ["impot", "declaration", "rapport", "remboursement", "feuillet", "t4", "releve", "reer", "credit"], en: ["tax return", "taxes", "refund", "slip", "t4", "rrsp", "file", "credit"] },
  taxLetter: { fr: ["lettre", "avis", "cotisation", "revenu quebec", "arc", "verification", "opposition", "reclame", "dette"], en: ["letter", "notice", "assessment", "cra", "revenu quebec", "audit", "objection", "owe"] },
  selfEmployed: { fr: ["autonome", "a mon compte", "pigiste", "freelance", "depense", "acompte", "uber", "travailleur"], en: ["self-employed", "self employed", "freelance", "contractor", "expense", "instalment", "gig"] },
  lifeChanges: { fr: ["maison", "bebe", "enfant", "retraite", "succession", "deces", "liquidateur", "separation", "celiapp", "rap", "rente"], en: ["house", "home", "baby", "child", "retire", "estate", "death", "liquidator", "separation", "fhsa", "hbp", "pension"] },
  startBusiness: { fr: ["demarrer", "lancer", "incorporer", "incorporation", "nouvelle entreprise", "enregistrer", "neq", "societe par actions"], en: ["start", "launch", "incorporate", "new business", "register", "sole proprietor"] },
  salesTax: { fr: ["tps", "tvq", "taxe de vente", "taxes", "30 000", "petit fournisseur", "intrant"], en: ["gst", "qst", "sales tax", "30,000", "small supplier", "input tax"] },
  statements: { fr: ["etats financiers", "bilan", "audit", "mission d'examen", "compilation", "banque", "obnl", "verification"], en: ["financial statements", "balance sheet", "audit", "review engagement", "compilation", "bank", "non-profit"] },
  multiCompanies: { fr: ["plusieurs", "holding", "societe de gestion", "associees", "groupe", "immeuble"], en: ["several", "multiple", "holding", "associated", "group", "property"] },
  calendar: { fr: ["date", "echeance", "quand", "limite", "calendrier", "30 avril", "15 juin"], en: ["date", "deadline", "when", "due", "calendar", "april 30", "june 15"] },
  contact: { fr: ["rendez-vous", "rencontre", "appeler", "telephone", "adresse", "heure", "prix", "tarif", "cout", "parler"], en: ["appointment", "meet", "call", "phone", "address", "hours", "price", "fee", "cost", "talk"] },
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Msg = { from: "clara" | "me"; text: string; link?: { key?: RouteKey; href?: string; label: string } };

export function Clara({ lang }: { lang: Lang }) {
  const t = dict(lang).clara;
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "clara", text: t.hello }]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const labelFor = (key: RouteKey) => {
    const c = concerns.find((x) => x.key === key);
    if (c) return c[lang].label;
    if (key === "calendar") return t.goCalendar;
    return t.goContact;
  };

  const answer = (q: string) => {
    const n = norm(q);
    let best: RouteKey | null = null;
    let score = 0;
    for (const [key, kw] of Object.entries(keywords)) {
      const s = kw[lang].concat(lang === "en" ? kw.fr : kw.en).reduce((acc, w) => (n.includes(norm(w)) ? acc + w.length : acc), 0);
      if (s > score) { score = s; best = key as RouteKey; }
    }
    if (best) return { from: "clara" as const, text: t.found, link: { key: best, label: labelFor(best) } };
    return { from: "clara" as const, text: t.fallback, link: { key: "contact" as RouteKey, label: t.goContact } };
  };

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMsgs((m) => [...m, { from: "me", text: q }, answer(q)]);
    setInput("");
  };

  const choose = (key: RouteKey) =>
    setMsgs((m) => [...m, { from: "me", text: labelFor(key) }, { from: "clara", text: t.found, link: { key, label: labelFor(key) } }]);

  const chips: RouteKey[] = ["personalTaxes", "taxLetter", "selfEmployed", "salesTax", "startBusiness", "calendar"];

  return (
    <div className="clara-root">
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={`${t.name}, ${t.role}`}
          className="fixed inset-x-3 bottom-24 z-[55] flex max-h-[min(36rem,calc(100dvh-8rem))] flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-[0_24px_70px_-30px_rgba(42,42,92,.55)] sm:inset-x-auto sm:right-5 sm:w-[24rem]"
        >
          <div className="flex items-center justify-between gap-3 bg-navy px-5 py-4 text-white on-dark">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky font-display text-lg font-semibold text-navy" aria-hidden="true">C</span>
              <div>
                <p className="font-display font-semibold leading-tight">{t.name}</p>
                <p className="text-xs text-white/80">{t.role}</p>
              </div>
            </div>
            <button type="button" onClick={() => { setOpen(false); fabRef.current?.focus(); }} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10" aria-label={t.close}>
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "me" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[0.93rem] leading-relaxed ${m.from === "me" ? "bg-navy text-white" : "bg-sky-50 text-ink"}`}>
                  <p>{m.text}</p>
                  {m.link && (
                    <Link href={m.link.key ? href(m.link.key, lang) : m.link.href!} onClick={() => setOpen(false)} className="mt-2 inline-flex items-center gap-1.5 font-semibold text-navy underline underline-offset-4">
                      {m.link.label} <Icon name="arrow" className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
            <div>
              <p className="sr-only">{t.chips}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {chips.map((k) => (
                  <button key={k} type="button" onClick={() => choose(k)} className="rounded-full border border-line px-3 py-1.5 text-sm text-navy hover:border-navy hover:bg-sky-50">
                    {labelFor(k)}
                  </button>
                ))}
                <a href={portalHref(lang)} className="rounded-full border border-line px-3 py-1.5 text-sm text-navy hover:border-navy hover:bg-sky-50">{t.goPortal}</a>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t border-line p-3">
            <div className="flex gap-2">
              <label htmlFor={`${panelId}-q`} className="sr-only">{t.placeholder}</label>
              <input id={`${panelId}-q`} ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.placeholder} autoComplete="off" className="field min-h-11 flex-1 py-2" maxLength={300} />
              <button type="submit" className="btn-primary min-h-11 px-4" aria-label={t.send}><Icon name="arrow" className="h-5 w-5" /></button>
            </div>
            <p className="mt-2 px-1 text-xs leading-snug text-muted">{t.notice}</p>
          </form>
        </div>
      )}

      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? t.close : t.open}
        className="clara-fab fixed right-4 bottom-4 z-[55] flex h-16 items-center gap-2.5 rounded-full bg-navy pr-5 pl-2 text-white shadow-[0_14px_40px_-14px_rgba(42,42,92,.7)] transition-transform hover:-translate-y-0.5 on-dark sm:right-5 sm:bottom-5"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky font-display text-lg font-semibold text-navy" aria-hidden="true">
          {open ? <Icon name="close" className="h-5 w-5" /> : "C"}
        </span>
        <span className="font-display font-semibold">{t.name}</span>
      </button>
    </div>
  );
}
