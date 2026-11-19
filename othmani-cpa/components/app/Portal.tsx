"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Clara } from "../Clara";
import { supabase } from "@/lib/supabase";
import { site, type Lang } from "@/lib/site";
import { AppFrame, LoadError, STEPS5, Skeleton, step5, toast, type Appointment, type Doc, type DocRequest, type Dossier, type Invoice, type Message, type Signature } from "./shared";
import { DocsScreen } from "./portal/Docs";
import { Home, Track } from "./portal/Home";
import { Ico } from "./portal/icons";
import { ApptScreen, ChatScreen, PayScreen, ProfileScreen, SignScreen } from "./portal/Screens";
import { tx } from "./portal/text";
import { PageTitle, SectionError } from "./portal/ui";
import { CURRENT, MAX_BYTES, SEEN, dossierLabel, mailHref, safeName, store, telHref, time, uuid, type PortalData, type Tab, type Upload } from "./portal/util";

/** Lit une liste ; `null` si la lecture a échoué (jamais confondu avec une liste vide). */
async function rows<R>(q: PromiseLike<{ data: unknown; error: unknown }>): Promise<R[] | null> {
  try { const r = await q; return r.error ? null : ((r.data as R[] | null) ?? []); } catch { return null; }
}

function View({ lang, email }: { lang: Lang; email: string }) {
  const t = tx[lang];
  const [tab, setTab] = useState<Tab>("home");
  const [dossiers, setDossiers] = useState<Dossier[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [data, setData] = useState<PortalData | null>(null);
  const [dataFailed, setDataFailed] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
  const [seenMap, setSeenMap] = useState<Record<string, string>>({});
  const [claraOpen, setClaraOpen] = useState(false);
  const seq = useRef(0);
  const firstTab = useRef(true);
  const claraBox = useRef<HTMLDivElement>(null);
  const claraOpener = useRef<HTMLElement | null>(null);

  const loadBase = useCallback(async () => {
    setFailed(false);
    const list = await rows<Dossier>(supabase().from("dossiers").select("*").order("updated_at", { ascending: false }));
    if (!list) { setFailed(true); return; }
    setDossiers(list);
    setCurrent((c) => { const want = c ?? store.get(CURRENT); return list.some((x) => x.id === want) ? want : list[0]?.id ?? null; });
  }, []);
  useEffect(() => { loadBase(); }, [loadBase]);

  /**
   * Charge le dossier affiché (liste de documents, messages) et, pour tous les dossiers du client,
   * les documents, les signatures, les factures et les demandes de rendez-vous.
   * `quiet` : rafraîchissement discret, qui ne remplace jamais des données affichées par une erreur.
   */
  const loadData = useCallback(async (id: string, quiet = false) => {
    const mine = ++seq.current;
    if (!quiet) setDataFailed(false);
    const db = supabase();
    const [reqs, msgs, docs, sigs, invoices, appts] = await Promise.all([
      rows<DocRequest>(db.from("document_requests").select("*").eq("dossier_id", id).order("created_at")),
      rows<Message>(db.from("messages").select("*").eq("dossier_id", id).order("created_at")),
      rows<Doc>(db.from("documents").select("*").order("created_at", { ascending: false })),
      rows<Signature>(db.from("signatures").select("*").order("created_at", { ascending: false })),
      rows<Invoice>(db.from("invoices").select("*").order("created_at", { ascending: false })),
      rows<Appointment>(db.from("appointment_requests").select("*").order("created_at", { ascending: false })),
    ]);
    if (mine !== seq.current) return;
    if (!reqs || !msgs || !docs) { if (!quiet) setDataFailed(true); return; }
    setData((prev) => {
      const keep = prev && prev.id === id ? prev : null;
      return {
        id, reqs, msgs, docs,
        sigs: sigs ? sigs.filter((s) => s.status === "a_signer" || s.status === "signe") : keep?.sigs ?? null,
        invoices: invoices ? invoices.filter((i) => i.status === "a_payer" || i.status === "payee") : keep?.invoices ?? null,
        appts: appts ?? keep?.appts ?? null,
      };
    });
  }, []);
  useEffect(() => {
    if (!current) return;
    loadData(current);
    const tick = () => { if (document.visibilityState === "visible") loadData(current, true); };
    const id = window.setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [current, loadData]);

  // Changement d'écran : haut de page et titre annoncé aux lecteurs d'écran.
  useEffect(() => {
    if (firstTab.current) { firstTab.current = false; return; }
    if (tab !== "messages") window.scrollTo(0, 0);
    document.getElementById("portal-title")?.focus({ preventScroll: true });
  }, [tab]);

  // Un fichier lâché à côté d'une zone de dépôt ne doit pas remplacer la page.
  useEffect(() => {
    const stop = (e: DragEvent) => { if (Array.from(e.dataTransfer?.types ?? []).includes("Files")) e.preventDefault(); };
    window.addEventListener("dragover", stop);
    window.addEventListener("drop", stop);
    return () => { window.removeEventListener("dragover", stop); window.removeEventListener("drop", stop); };
  }, []);

  // Clara garde son propre état : on suit l'ouverture de son panneau pour rendre le focus au bouton d'origine.
  const hasDossier = Boolean(dossiers?.length);
  useEffect(() => {
    const box = claraBox.current;
    if (!box) return;
    let was = false;
    const obs = new MutationObserver(() => {
      const now = Boolean(box.querySelector('[role="dialog"]'));
      if (now === was) return;
      was = now;
      setClaraOpen(now);
      if (!now && claraOpener.current?.isConnected) claraOpener.current.focus();
    });
    obs.observe(box, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [hasDossier]);
  const openClara = (el: HTMLElement) => {
    claraOpener.current = el;
    claraBox.current?.querySelector<HTMLButtonElement>(".clara-fab")?.click();
  };

  const ready = data && data.id === current ? data : null;
  const lastMsg = ready?.msgs[ready.msgs.length - 1];
  const seen = current ? seenMap[current] ?? store.get(SEEN(current)) : "";
  const unreadCount = tab === "messages" || !ready || lastMsg?.author_role !== "cabinet" ? 0 : ready.msgs.filter((m) => m.author_role === "cabinet" && time(m.created_at) > time(seen)).length;
  useEffect(() => {
    if (tab !== "messages" || !current || !lastMsg || time(lastMsg.created_at) <= time(seen)) return;
    store.set(SEEN(current), lastMsg.created_at);
    setSeenMap((m) => ({ ...m, [current]: lastMsg.created_at }));
  }, [tab, current, lastMsg, seen]);

  const pick = (id: string) => {
    if (id === current) { setTab("home"); return; }
    store.set(CURRENT, id);
    setData(null);
    setUploads([]);
    setCurrent(id);
    setTab("home");
  };

  const upload = async (files: File[], requestId: string | null) => {
    if (!current || busy) return;
    const dossierId = current;
    const items = files.map((f) => ({ f, key: uuid() }));
    const mark = (key: string, state: Upload["state"], note?: string) => setUploads((l) => l.map((u) => (u.key === key ? { ...u, state, note } : u)));
    setUploads(items.map(({ f, key }) => ({ key, name: f.name, state: "busy" })));
    setBusy(true);
    let sent = 0;
    for (const { f, key } of items) {
      if (f.size > MAX_BYTES) { mark(key, "error", t.tooBig(f.name)); toast(t.tooBig(f.name), "error"); continue; }
      let ok = false;
      try {
        const path = `${dossierId}/${uuid()}-${safeName(f.name) || "document"}`;
        const up = await supabase().storage.from("documents").upload(path, f, { contentType: f.type || undefined });
        if (!up.error) {
          // La base coche elle-même la ligne de la liste quand `request_id` est fourni.
          const ins = await supabase().from("documents").insert({ dossier_id: dossierId, uploader_role: "client", path, name: f.name.slice(0, 200), size: f.size, ...(requestId ? { request_id: requestId } : {}) });
          ok = !ins.error;
        }
      } catch { ok = false; }
      if (ok) { sent++; mark(key, "ok"); } else { mark(key, "error", t.upErr(f.name)); toast(t.upErr(f.name), "error"); }
    }
    setBusy(false);
    if (sent) toast(t.upDone(sent));
    await loadData(dossierId, true);
  };

  if (failed) return <LoadError lang={lang} retry={loadBase} />;
  if (!dossiers) return <div className="mx-auto max-w-2xl"><Skeleton rows={4} label={t.loading} /></div>;
  if (dossiers.length === 0)
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-6 sm:p-7">
        <h1 className="font-display text-xl font-semibold text-ink">{t.none}</h1>
        <p className="mt-2 leading-relaxed text-ink">{t.noneD}</p>
        <p className="mt-3 text-sm break-all text-muted">{t.emailL} : {email}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <a href={telHref(site.phone.tel)} className="btn-primary"><Ico name="phone" />{site.phone.display}</a>
          {site.email && <a href={mailHref(site.email)} className="btn-secondary"><Ico name="mail" />{t.write}</a>}
        </div>
      </div>
    );

  const d = dossiers.find((x) => x.id === current) ?? dossiers[0];
  const many = dossiers.length > 1;
  const sub = many ? dossierLabel(d) : undefined;
  const reload = () => loadData(d.id, true);
  const retry = () => loadData(d.id);
  const counts = {
    docs: ready ? ready.reqs.filter((r) => !r.received).length : 0,
    messages: unreadCount,
    sign: (ready?.sigs ?? []).filter((s) => s.status === "a_signer").length,
    pay: (ready?.invoices ?? []).filter((i) => i.status === "a_payer").length,
    appt: 0, home: 0, profile: 0,
  };
  const claraContext = [`Dossier : ${d.title}`, `Étape : ${STEPS5[step5(d.status)].fr}`, d.next_step ? `Message du cabinet sur la suite : ${d.next_step}` : "", d.due_date ? `Échéance : ${d.due_date}` : ""].filter(Boolean).join(". ");

  const SIDE: { id: "home" | "docs" | "messages" | "sign" | "pay" | "appt"; icon: string }[] = [
    { id: "home", icon: "grid" }, { id: "docs", icon: "docs" }, { id: "messages", icon: "chat" }, { id: "sign", icon: "sign" }, { id: "pay", icon: "card" }, { id: "appt", icon: "calendar" },
  ];
  const sideOn = (id: Tab) => tab === id || (id === "home" && tab === "track");
  const sideBtn = (id: Tab, icon: string, label: string, n: number, badge?: string) => (
    <li key={id}>
      <button type="button" onClick={() => setTab(id)} aria-current={sideOn(id) ? "page" : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.95rem] ${sideOn(id) ? "bg-[#e4f4f9] font-semibold text-[#175f77]" : "font-medium text-ink hover:bg-[#f4f5fa]"}`}>
        <Ico name={icon} className="h-[1.15rem] w-[1.15rem] shrink-0" />
        <span className="flex-1">{label}</span>
        {n > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-navy px-1.5 text-[0.7rem] font-bold text-white"><span aria-hidden="true">{n}</span><span className="sr-only">{badge}</span></span>}
      </button>
    </li>
  );
  const BAR: ({ id: "home" | "docs" | "messages" | "profile"; icon: string } | null)[] = [{ id: "home", icon: "home" }, { id: "docs", icon: "docs" }, null, { id: "messages", icon: "chat" }, { id: "profile", icon: "user" }];

  let screen;
  if (tab === "profile") screen = <ProfileScreen d={d} dossiers={dossiers} email={email} pick={pick} counts={counts} lang={lang} t={t} go={setTab} />;
  else if (dataFailed && !ready) screen = <LoadError lang={lang} retry={retry} />;
  else if (!ready) screen = <div className="max-w-2xl"><Skeleton rows={4} label={t.loading} /></div>;
  else if (tab === "home") screen = <Home d={d} data={ready} uploads={uploads} busy={busy} onUpload={upload} openClara={openClara} claraOpen={claraOpen} lang={lang} t={t} go={setTab} />;
  else if (tab === "track") screen = <Track d={d} reqs={ready.reqs} lang={lang} t={t} go={setTab} />;
  else if (tab === "docs") screen = <DocsScreen reqs={ready.reqs} docs={ready.docs} dossiers={dossiers} uploads={uploads} busy={busy} onUpload={upload} lang={lang} t={t} sub={sub} />;
  else if (tab === "messages") screen = <ChatScreen d={d} msgs={ready.msgs} author={d.client_name || email} reload={reload} lang={lang} t={t} sub={sub} />;
  else {
    const title = tab === "sign" ? t.signTitle : tab === "pay" ? t.payTitle : t.apptTitle;
    const broken = <div className="max-w-2xl"><PageTitle back={t.back} go={setTab}>{title}</PageTitle><SectionError text={t.sectionErr} retryLabel={lang === "fr" ? "Réessayer" : "Try again"} retry={retry} /></div>;
    if (tab === "sign") screen = ready.sigs ? <SignScreen sigs={ready.sigs} dossiers={dossiers} reload={reload} lang={lang} t={t} go={setTab} /> : broken;
    else if (tab === "pay") screen = ready.invoices ? <PayScreen invoices={ready.invoices} dossiers={dossiers} lang={lang} t={t} go={setTab} /> : broken;
    else screen = ready.appts ? <ApptScreen appts={ready.appts} dossiers={dossiers} current={d.id} reload={reload} lang={lang} t={t} go={setTab} /> : broken;
  }

  return (
    <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start lg:gap-7">
      {/* Ordinateur : colonne de navigation du portail web */}
      <div className="sticky top-[7.75rem] hidden h-[calc(100svh-9.75rem)] min-h-[26rem] flex-col rounded-3xl border border-line bg-white p-3 lg:flex">
        <nav aria-label={t.navDesktop} className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {SIDE.map((x) => sideBtn(x.id, x.icon, t.side[x.id], counts[x.id], x.id === "home" ? undefined : t.badge[x.id as "docs" | "messages" | "sign" | "pay"]?.(counts[x.id])))}
          </ul>
          <ul className="mt-3 border-t border-line pt-3">{sideBtn("profile", "user", t.side.profile, 0)}</ul>
        </nav>
        <button type="button" onClick={(e) => openClara(e.currentTarget)} aria-expanded={claraOpen} className="pf-clara mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-[0.95rem] font-semibold !text-navy-950 shadow-[0_10px_22px_-14px_rgba(80,70,200,.9)]">
          <Ico name="sparkle" className="h-[1.15rem] w-[1.15rem]" />{t.talkClara}
        </button>
      </div>

      <div className={`mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none ${tab === "messages" ? "pb-48 lg:pb-0" : "pb-28 lg:pb-4"}`}>{screen}</div>

      {/* Téléphone : barre du bas à cinq éléments, Clara au centre */}
      <nav aria-label={t.navMobile} className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-24px_rgba(23,23,58,.5)] lg:hidden">
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {BAR.map((x) => {
            if (!x)
              return (
                <li key="clara" className="flex justify-center">
                  <button type="button" onClick={(e) => openClara(e.currentTarget)} aria-expanded={claraOpen} aria-label={t.openClara} className="group flex min-h-16 w-full flex-col items-center justify-end gap-1 pb-2 text-[0.7rem] font-medium text-muted">
                    <span className="pf-clara -mt-5 flex h-12 w-12 items-center justify-center rounded-full !text-navy-950 shadow-[0_8px_18px_-8px_rgba(80,70,200,.9)] ring-4 ring-white"><Ico name="sparkle" className="h-6 w-6" /></span>
                    <span aria-hidden="true">{t.tabs.clara}</span>
                  </button>
                </li>
              );
            const on = tab === x.id || (x.id === "home" && tab === "track");
            const dot = x.id === "messages" && unreadCount > 0;
            return (
              <li key={x.id}>
                <button type="button" onClick={() => setTab(x.id)} aria-current={on ? "page" : undefined} className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 text-[0.7rem] ${on ? "font-bold text-ink" : "font-medium text-muted"}`}>
                  <span className="relative">
                    <Ico name={x.icon} className="h-6 w-6" strokeWidth={on ? 2 : 1.6} />
                    {dot && <span className="absolute -top-0.5 -right-1 h-2.5 w-2.5 rounded-full bg-[#b3261e] ring-2 ring-white" aria-hidden="true" />}
                  </span>
                  <span>{t.tabs[x.id]}{dot && <span className="sr-only"> ({t.newMsg})</span>}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Clara s'ouvre depuis le bouton central ou « Parler à Clara » : son bouton flottant reste masqué. */}
      <div ref={claraBox} className="[&_.clara-fab]:!hidden [&_[role=dialog]]:!bottom-[calc(6.75rem+env(safe-area-inset-bottom))] lg:[&_[role=dialog]]:!bottom-6">
        <Clara lang={lang} raised context={claraContext} />
      </div>
    </div>
  );
}

export function Portal({ lang }: { lang: Lang }) {
  const t = tx[lang];
  return <AppFrame lang={lang} title={t.title} subtitle={t.sub} demo="client" wide>{(s) => <View lang={lang} email={s.email} />}</AppFrame>;
}
