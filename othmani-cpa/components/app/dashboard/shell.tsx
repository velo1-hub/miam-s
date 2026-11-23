"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { LogoMark } from "../../Logo";
import { fmtDate, type Receipt } from "../shared";
import { Avatar, Dialog, Icon, RECEIPT_STATUS, SECTIONS, groupClients, money, norm, type Focus, type IconName, type Section, type Store } from "./common";

const NAV_ICON: Record<Section, IconName> = { aujourdhui: "home", prospects: "prospect", clients: "clients", dossiers: "dossier", documents: "document", recus: "receipt", messages: "message", facturation: "invoice", calendrier: "calendar", parametres: "settings" };

/**
 * Habillage de la présentation à l'intérieur du cadre commun (AppFrame) : le contenu prend toute la largeur
 * et, sur grand écran, l'en-tête commun se réduit à la cloche et à la déconnexion, en haut à droite.
 * La cloche et la déconnexion restent celles du cadre commun : rien n'est masqué de ce qui sert.
 */
const FRAME_CSS = `
.app-fx > main#contenu { max-width: none; padding: 0; }
@media (min-width: 1024px) {
  .app-fx > header { position: fixed !important; top: 0; right: 0; left: auto; z-index: 46; background: transparent !important; border: 0 !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }
  .app-fx > header > div { max-width: none; margin: 0; padding: .75rem 1.5rem .75rem 0; }
  .app-fx > header > div > a, .app-fx > header > p, .app-fx > header > div > div > span { display: none; }
}`;
export function FrameStyle() { return <style>{FRAME_CSS}</style>; }

/** Menu : colonne marine fixe sur grand écran, barre marine qui défile sur petit écran. */
export function SideNav({ section, go, badges }: { section: Section; go: (s: Section) => void; badges: Partial<Record<Section, [number, string]>> }) {
  const bar = useRef<HTMLUListElement>(null);
  // Sur petit écran, la barre défile : la section active reste visible.
  useEffect(() => {
    const el = bar.current, a = el?.querySelector<HTMLElement>("[aria-current=page]");
    if (el && a && el.scrollWidth > el.clientWidth) el.scrollTo({ left: a.offsetLeft - (el.clientWidth - a.offsetWidth) / 2 });
  }, [section]);
  return (
    <nav aria-label="Menu du cabinet" className="bg-[#20204e] text-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-[45] lg:flex lg:w-56 lg:flex-col lg:px-3 lg:pt-4 lg:pb-4">
      <div className="hidden lg:block">
        <a href="/" aria-label="Othmani CPA, retour au site" className="flex h-14 items-center justify-center gap-2 rounded-xl bg-white text-navy">
          <LogoMark className="h-7 w-auto" />
          <span className="font-display text-sm leading-none font-bold tracking-tight">Othmani CPA</span>
        </a>
        <p className="pf-eyebrow mt-2.5 mb-5 text-center !text-white/80">Pilote Fiscal</p>
      </div>
      <ul ref={bar} className="relative flex gap-1 overflow-x-auto px-3 py-2 lg:flex-1 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:p-0">
        {SECTIONS.map(([k, l]) => {
          const b = badges[k];
          return (
            <li key={k} className="shrink-0">
              <a href={`#${k}`} aria-current={section === k ? "page" : undefined} onClick={(e) => { e.preventDefault(); go(k); }} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium whitespace-nowrap text-white/85 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white aria-[current=page]:bg-white/15 aria-[current=page]:font-semibold aria-[current=page]:text-white">
                <Icon name={NAV_ICON[k]} />
                <span className="flex-1">{l}</span>
                {b && b[0] > 0 && <span className="rounded-full bg-[#7fd0e6] px-2 py-0.5 text-xs font-bold text-[#17173a]">{b[0]}<span className="sr-only"> {b[1]}</span></span>}
              </a>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 hidden items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white lg:flex"><span className="h-2 w-2 rounded-full bg-[#3ddc84]" aria-hidden="true" />Clara est active</p>
    </nav>
  );
}

/* ───────────── Recherche globale ───────────── */
type Hit = { key: string; group: string; title: string; sub: string; open: () => void };
export type SearchTargets = { client: (email: string) => void; dossier: (id: string, focus?: Focus) => void; lead: (id: string) => void; receipt: (r: Receipt) => void };

function useHits(store: Store | null, q: string, to: SearchTargets): Hit[] {
  return useMemo(() => {
    const n = norm(q.trim());
    if (!store || n.length < 2) return [];
    const has = (...parts: (string | null | undefined)[]) => norm(parts.filter(Boolean).join(" ")).includes(n);
    const byId = new Map(store.dossiers.map((d) => [d.id, d]));
    const who = (id: string) => { const d = byId.get(id); return d ? `${d.client_name}, ${d.title}` : "Dossier introuvable"; };
    const cap = <T,>(l: T[]) => l.slice(0, 5);
    return [
      ...cap(groupClients(store.dossiers, store.leads).filter((c) => has(c.name, c.email))).map((c) => ({ key: `c-${c.email}`, group: "Clients", title: c.name, sub: c.email, open: () => to.client(c.email) })),
      ...cap(store.dossiers.filter((d) => has(d.title, d.client_name, d.client_email))).map((d) => ({ key: `d-${d.id}`, group: "Dossiers", title: d.title, sub: d.client_name, open: () => to.dossier(d.id) })),
      ...cap(store.leads.filter((l) => has(l.name, l.email, l.phone, l.topic, l.message))).map((l) => ({ key: `l-${l.id}`, group: "Prospects", title: l.name, sub: l.topic || l.message.slice(0, 70) || "Sans détails", open: () => to.lead(l.id) })),
      ...cap(store.docs.filter((f) => byId.has(f.dossier_id) && has(f.name))).map((f) => ({ key: `f-${f.id}`, group: "Documents", title: f.name, sub: `${who(f.dossier_id)} · ${fmtDate(f.created_at, "fr")}`, open: () => to.dossier(f.dossier_id, "documents") })),
      ...cap(store.invoices.filter((x) => byId.has(x.dossier_id) && has(x.label, money.format(x.amount_cents / 100), String(x.amount_cents / 100), byId.get(x.dossier_id)?.client_name))).map((x) => ({ key: `i-${x.id}`, group: "Factures", title: `${x.label} · ${money.format(x.amount_cents / 100)}`, sub: who(x.dossier_id), open: () => to.dossier(x.dossier_id, "facture") })),
      // Reçus : par commerçant ou par montant (« 85 », « 85,00 » ou « 85,00 $ »).
      ...cap(store.receipts.filter((r) => byId.has(r.dossier_id) && has(r.vendor, r.total_cents == null ? "" : `${money.format(r.total_cents / 100)} ${r.total_cents / 100} ${(r.total_cents / 100).toFixed(2).replace(".", ",")}`))).map((r) => ({ key: `r-${r.id}`, group: "Reçus", title: `${r.vendor?.trim() || "Commerçant non lu"} · ${r.total_cents == null ? "total non lu" : money.format(r.total_cents / 100)}`, sub: `${who(r.dossier_id)} · ${RECEIPT_STATUS[r.status]} · ${fmtDate(r.created_at, "fr")}`, open: () => to.receipt(r) })),
    ];
  }, [store, q, to]);
}

function Search({ store, to }: { store: Store | null; to: SearchTargets }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const [mac, setMac] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const id = useId();
  const hits = useHits(store, q, to);

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
      const combo = (e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k";
      if (combo || (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey)) { e.preventDefault(); input.current?.focus(); input.current?.select(); }
    };
    const away = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", away);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", away); };
  }, []);
  useEffect(() => { setAt(0); }, [q]);

  const pick = (h: Hit | undefined) => { if (!h) return; h.open(); setQ(""); setOpen(false); input.current?.blur(); };
  const shown = open && q.trim().length >= 2;
  return (
    <div ref={wrap} role="search" className="relative min-w-0 flex-1">
      <label htmlFor={`${id}-q`} className="sr-only">Rechercher un client, un dossier, un prospect, un document, une facture ou un reçu</label>
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"><Icon name="search" /></span>
      <input
        ref={input} id={`${id}-q`} type="search" role="combobox" aria-expanded={shown} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={shown && hits[at] ? `${id}-${at}` : undefined}
        autoComplete="off" spellCheck={false} value={q} placeholder="Rechercher un client, un document, une facture…" title="Raccourci : / ou Ctrl+K (⌘K sur Mac)"
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setAt((i) => Math.min(hits.length - 1, i + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setAt((i) => Math.max(0, i - 1)); }
          else if (e.key === "Enter") { e.preventDefault(); pick(hits[at]); }
          else if (e.key === "Escape") { if (q) setQ(""); else input.current?.blur(); setOpen(false); }
        }}
        className="block h-11 w-full rounded-xl border border-[#d5d8e6] bg-white pr-16 pl-10 text-[0.95rem] text-ink placeholder:text-muted focus:border-navy focus:shadow-[0_0_0_4px_rgba(111,193,216,.3)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-[#d5d8e6] bg-[#f4f5fa] px-1.5 py-0.5 font-sans text-xs text-muted sm:block" aria-hidden="true">{mac ? "⌘K" : "Ctrl K"}</kbd>
      <div id={`${id}-list`} role="listbox" aria-label="Résultats de la recherche" className={shown ? "absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-[#e6e8f2] bg-white p-2 shadow-[0_30px_70px_-30px_rgba(23,23,58,.55)]" : "hidden"}>
        {shown && (hits.length === 0 ? <p className="px-3 py-3 text-sm text-muted">{store ? "Aucun résultat. La recherche porte sur les clients, dossiers, prospects, documents, factures et reçus déjà chargés." : "Chargement des données…"}</p> : hits.map((h, i) => (
          <div key={h.key}>
            {(i === 0 || hits[i - 1].group !== h.group) && <p className="pf-eyebrow px-3 pt-2 pb-1">{h.group}</p>}
            <button type="button" role="option" id={`${id}-${i}`} aria-selected={i === at} tabIndex={-1} onMouseEnter={() => setAt(i)} onClick={() => pick(h)} className="flex min-h-11 w-full flex-col justify-center rounded-xl px-3 py-1.5 text-left aria-selected:bg-sky-100">
              <span className="truncate text-sm font-semibold text-ink">{h.title}</span>
              <span className="truncate text-xs text-muted">{h.sub}</span>
            </button>
          </div>
        )))}
      </div>
      <p role="status" aria-live="polite" className="sr-only">{shown ? `${hits.length} résultat${hits.length > 1 ? "s" : ""}` : ""}</p>
    </div>
  );
}

/** Barre du haut : recherche, repère « données d'exemple », pastille de la personne connectée. La cloche et la déconnexion du cadre commun se placent à sa droite. */
export function TopBar({ store, to, staffName, demo, onHelp }: { store: Store | null; to: SearchTargets; staffName: string; demo: boolean; onHelp?: () => void }) {
  return (
    <div className="z-30 flex items-center gap-3 bg-[#f4f5fa] px-4 pt-3 pb-2 sm:px-6 lg:sticky lg:top-0 lg:h-[4.25rem] lg:py-0 lg:pr-[15rem]">
      <Search store={store} to={to} />
      {onHelp && <button type="button" onClick={onHelp} aria-label="Raccourcis clavier" title="Raccourcis clavier (touche ?)" className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d5d8e6] bg-white font-display text-base font-bold text-navy hover:border-navy sm:flex"><span aria-hidden="true">?</span></button>}
      {demo && <span className="hidden shrink-0 rounded-full bg-[#e6e8f2] px-3 py-1.5 text-xs font-medium text-ink lg:inline" title="Mode démonstration : données fictives, rien n'est enregistré.">Données d'exemple<span className="sr-only"> : mode démonstration, rien n'est enregistré</span></span>}
      <span className="hidden lg:block" title={staffName}><Avatar name={staffName} className="h-9 w-9 text-xs" /><span className="sr-only">Connecté : {staffName}</span></span>
    </div>
  );
}


/* ───────────── Raccourcis clavier ───────────── */
/** « g » puis une lettre mène à une section. */
export const GO_KEYS: Record<string, Section> = { a: "aujourdhui", p: "prospects", c: "clients", d: "dossiers", m: "messages", r: "recus" };
const KEY_HELP: [string[], string][] = [
  [["?"], "Afficher cette liste"],
  [["g", "a"], "Aller à Aujourd'hui"],
  [["g", "p"], "Aller à Prospects"],
  [["g", "c"], "Aller à Clients"],
  [["g", "d"], "Aller à Dossiers"],
  [["g", "m"], "Aller à Messages"],
  [["g", "r"], "Aller à Reçus"],
  [["J"], "Reçus : reçu suivant (aussi ↓)"],
  [["K"], "Reçus : reçu précédent (aussi ↑)"],
  [["C"], "Reçus : confirmer le reçu actif"],
  [["R"], "Reçus : ne pas retenir le reçu actif"],
  [["/"], "Rechercher (aussi Ctrl+K, ou ⌘K sur Mac)"],
  [["Échap"], "Fermer une fenêtre ou la recherche"],
];
const kbd = "inline-block min-w-7 rounded-md border border-[#c9cde0] bg-[#f4f5fa] px-1.5 py-0.5 text-center font-sans text-sm font-semibold text-ink";
export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Raccourcis clavier" onClose={onClose}>
      {() => (
        <>
          <dl className="divide-y divide-line">
            {KEY_HELP.map(([keys, what]) => (
              <div key={what} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-ink">{what}</dt>
                <dd className="flex shrink-0 items-center gap-1.5">{keys.map((k, i) => <span key={k} className="flex items-center gap-1.5">{i > 0 && <span className="text-xs text-muted">puis</span>}<kbd className={kbd}>{k}</kbd></span>)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted">Les raccourcis ne s'appliquent pas pendant la saisie dans un champ.</p>
        </>
      )}
    </Dialog>
  );
}
