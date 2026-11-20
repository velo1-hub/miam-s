"use client";
/**
 * Tableau de bord du cabinet (Pilote Fiscal). Ce fichier charge les données et relie les sections ;
 * chaque section vit dans son module, sous ./dashboard/.
 */
import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { supabase } from "@/lib/supabase";
import { demoRole } from "@/lib/demo";
import { AppFrame, LoadError, Skeleton, save, statusLabel, toast, type Dossier } from "./shared";
import { NO_FILTER, SECTIONS, SECTION_ALIAS, SectionHead, isTyping, link, rows, smallBtn, useLoad, useOnline, type DFilter, type DossierUi, type FileDoc, type Focus, type Invoice, type LastMsg, type Lead, type PatchDossier, type PatchLead, type Section, type Store, type Task } from "./dashboard/common";
import { Clients, type ClientUi } from "./dashboard/clients";
import { Dossiers } from "./dashboard/dossiers";
import { Fees } from "./dashboard/invoices";
import { Leads } from "./dashboard/prospects";
import { Calendar, DocumentsSection, MessagesSection } from "./dashboard/sections";
import { Feedback, Reminders, Team } from "./dashboard/settings";
import { FrameStyle, GO_KEYS, ShortcutsHelp, SideNav, TopBar, type SearchTargets } from "./dashboard/shell";
import { Today } from "./dashboard/today";

/* ───────────── Espace de travail ───────────── */
async function loadStore(): Promise<Store> {
  const db = supabase();
  const [dossiers, leads, waiting, staff, tasks, docs, pending, invoices, msgs] = await Promise.all([
    rows<Dossier>(db.from("dossiers").select("*").order("updated_at", { ascending: false }).limit(500)),
    rows<Lead>(db.from("leads").select("*").order("created_at", { ascending: false }).limit(300)),
    rows<string>(db.rpc("dossiers_a_repondre")),
    rows<{ name: string; email: string }>(db.from("staff").select("name,email").order("name")),
    rows<Task>(db.from("tasks").select("*").eq("done", false).order("created_at").limit(500)),
    rows<FileDoc>(db.from("documents").select("*").order("created_at", { ascending: false }).limit(300)),
    rows<{ id: string }>(db.from("document_requests").select("id").eq("received", false).limit(2000)),
    rows<Invoice>(db.from("invoices").select("*").order("created_at", { ascending: false }).limit(1000)),
    rows<LastMsg>(db.from("messages").select("dossier_id,created_at,author_role,author_name,body").order("created_at", { ascending: false }).limit(600)),
  ]);
  // Dernier message de chaque dossier : la liste arrive du plus récent au plus ancien, on garde le premier vu.
  const last = new Map<string, LastMsg>();
  for (const m of msgs) if (!last.has(m.dossier_id)) last.set(m.dossier_id, m);
  // Début de l'attente : en remontant depuis le plus récent, le plus ancien message du client avant la dernière réponse du cabinet.
  const waitSince: Record<string, string> = {};
  const answered = new Set<string>();
  for (const m of msgs) {
    if (answered.has(m.dossier_id)) continue;
    if (m.author_role === "client") waitSince[m.dossier_id] = m.created_at; else answered.add(m.dossier_id);
  }
  return { waitSince, dossiers, leads, waiting, team: staff.map((m) => m.name || m.email), tasks, docs, clientDocs: docs.filter((f) => f.uploader_role === "client"), pendingReqs: pending.map((r) => r.id), invoices, lastMsgs: [...last.values()] };
}

function Workspace({ email, staffName }: { email: string; staffName: string }) {
  const load = useLoad(loadStore);
  const { set, reload } = load;
  const snap = useRef<Store | null>(null);
  snap.current = load.data;
  const dirty = useRef(false);
  const [section, setSection] = useState<Section>("aujourdhui");
  const [leadFilter, setLeadFilter] = useState("ouverts");
  const [focusLead, setFocusLead] = useState<string | null>(null);
  const [draft, setDraft] = useState<Lead | null>(null);
  const [ui, setUi] = useState<DossierUi>({ view: "liste", current: null, creating: false, filter: NO_FILTER });
  const [clientUi, setClientUi] = useState<ClientUi>({ email: null, tab: "apercu" });
  const [thread, setThread] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ what: Focus; n: number } | null>(null);

  const go = useCallback((k: Section) => {
    setSection(k);
    try { window.history.replaceState(null, "", `#${k}`); } catch { /* adresse non modifiable : sans conséquence */ }
    // Les données ne sont rechargées que si une fiche de dossier a été ouverte entre-temps.
    if (k !== "dossiers" && dirty.current) { dirty.current = false; reload(); }
  }, [reload]);
  // L'adresse choisit la section, y compris les anciennes adresses (#demandes, #honoraires, #reglages) et les liens de la cloche.
  useEffect(() => {
    const read = () => {
      const raw = window.location.hash.slice(1);
      const h = SECTION_ALIAS[raw] ?? raw;
      if (SECTIONS.some(([k]) => k === h)) { if (h === raw) setSection(h as Section); else go(h as Section); }
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [go]);
  const touch = useCallback(() => { dirty.current = true; }, []);

  const edit = useCallback(<K extends keyof Store>(k: K, f: (v: Store[K]) => Store[K]) => set((s) => (s ? { ...s, [k]: f(s[k]) } : s)), [set]);
  const patchDossier: PatchDossier = useCallback((id, p, o = {}) => {
    const before = snap.current?.dossiers.find((x) => x.id === id);
    if (!before) return Promise.resolve(false);
    const back = Object.fromEntries(Object.keys(p).map((k) => [k, before[k as keyof Dossier]])) as Partial<Dossier>;
    edit("dossiers", (l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
    return save(supabase().from("dossiers").update(p).eq("id", id), { ...o, rollback: () => edit("dossiers", (l) => l.map((x) => (x.id === id ? { ...x, ...back } : x))) });
  }, [edit]);
  const patchLead: PatchLead = useCallback((id, p, o = {}) => {
    const before = snap.current?.leads.find((x) => x.id === id);
    if (!before) return Promise.resolve(false);
    const back = Object.fromEntries(Object.keys(p).map((k) => [k, before[k as keyof Lead]])) as Partial<Lead>;
    edit("leads", (l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
    return save(supabase().from("leads").update(p).eq("id", id), { ...o, rollback: () => edit("leads", (l) => l.map((x) => (x.id === id ? { ...x, ...back } : x))) });
  }, [edit]);
  /** Changement d'étape : confirmation si le client le remarque (transmis, fermé), puis message avec « Annuler ». */
  const move = useCallback((id: string, status: string) => {
    const d = snap.current?.dossiers.find((x) => x.id === id);
    if (!d || d.status === status) return;
    const label = statusLabel[status]?.fr ?? status;
    if ((status === "transmis" || status === "ferme") && !window.confirm(`Passer le dossier « ${d.title} » de ${d.client_name} à l'étape « ${label} » ?\nLe client verra ce changement dans son espace.`)) return;
    const prev = d.status;
    patchDossier(id, { status }, { ok: `${d.client_name} → ${label}`, undo: () => { patchDossier(id, { status: prev }, { ok: "Étape rétablie." }); } });
  }, [patchDossier]);
  const addLead = useCallback((l: Lead) => {
    edit("leads", (list) => [l, ...list]);
    const { created_at: _local, ...payload } = l;
    void _local;
    return save(supabase().from("leads").insert(payload), { ok: "Prospect ajouté.", rollback: () => edit("leads", (list) => list.filter((x) => x.id !== l.id)) });
  }, [edit]);
  const completeTask = useCallback((t: Task) => {
    const open = { ...t, done: false };
    const setDone = (done: boolean, ok: string, undo?: () => void) => {
      edit("tasks", (l) => (done ? l.filter((x) => x.id !== t.id) : [...l, open]));
      save(supabase().from("tasks").update({ done }).eq("id", t.id), { ok, undo, rollback: () => edit("tasks", (l) => (done ? [...l, open] : l.filter((x) => x.id !== t.id))) });
    };
    setDone(true, "Tâche terminée.", () => setDone(false, "Tâche rouverte."));
  }, [edit]);
  const markReceived = useCallback((requestId: string) => {
    edit("pendingReqs", (l) => l.filter((x) => x !== requestId));
    save(supabase().from("document_requests").update({ received: true }).eq("id", requestId), { ok: "Marqué reçu.", rollback: () => edit("pendingReqs", (l) => [...l, requestId]) });
  }, [edit]);

  const openDossier = useCallback((id: string, what?: Focus) => {
    // Les filtres sont remis à zéro pour que le dossier ouvert figure dans la liste à côté de sa fiche.
    const closed = snap.current?.dossiers.find((x) => x.id === id)?.status === "ferme";
    setUi((u) => ({ ...u, view: "liste", current: id, creating: false, filter: { ...NO_FILTER, scope: closed ? "tous" : "a_faire" } }));
    setFocus((f) => (what ? { what, n: (f?.n ?? 0) + 1 } : null));
    go("dossiers");
  }, [go]);
  const clearFocus = useCallback(() => setFocus(null), []);
  const openLead = useCallback((id: string) => { setLeadFilter("ouverts"); setFocusLead(id); go("prospects"); }, [go]);
  const openClient = useCallback((email: string) => { setClientUi({ email, tab: "apercu" }); go("clients"); }, [go]);
  /** Accepter un prospect : on passe par la création du dossier, où le courriel est relu ; le prospect devient client une fois le dossier créé. */
  const acceptLead = useCallback((l: Lead) => {
    if (!l.email) { toast("Ajoutez d'abord le courriel de ce prospect.", "error"); openLead(l.id); return; }
    setDraft(l);
    setFocus(null);
    setUi((u) => ({ ...u, view: "liste", current: null, creating: true }));
    go("dossiers");
  }, [go, openLead]);
  /** Les factures modifiées dans une fiche remplacent celles du dossier dans les totaux du tableau de bord. */
  const syncInvoices = useCallback((dossierId: string, list: Invoice[]) => edit("invoices", (all) => [...list, ...all.filter((x) => x.dossier_id !== dossierId)].sort((a, b) => b.created_at.localeCompare(a.created_at))), [edit]);
  const setInvoices = useCallback((u: SetStateAction<Invoice[] | null>) => edit("invoices", (all) => (typeof u === "function" ? u(all) : u) ?? all), [edit]);
  /** Le cabinet vient de répondre : le dossier n'attend plus de réponse, et son dernier message est le nôtre. */
  const onSent = useCallback((dossierId: string) => {
    edit("waiting", (l) => l.filter((x) => x !== dossierId));
    edit("waitSince", (w) => Object.fromEntries(Object.entries(w).filter(([k]) => k !== dossierId)));
    edit("lastMsgs", (l) => [{ dossier_id: dossierId, created_at: new Date().toISOString(), author_role: "cabinet", author_name: staffName, body: "Réponse envoyée." }, ...l.filter((x) => x.dossier_id !== dossierId)]);
    dirty.current = true;
  }, [edit, staffName]);
  const showDossiers = useCallback((f: Partial<DFilter>) => { setUi((u) => ({ ...u, view: "liste", current: null, creating: false, filter: { ...NO_FILTER, ...f } })); go("dossiers"); }, [go]);
  const showLeads = useCallback((f: string) => { setFocusLead(null); setLeadFilter(f); go("prospects"); }, [go]);
  const targets = useRef<SearchTargets>({ client: openClient, dossier: openDossier, lead: openLead });
  targets.current.client = openClient; targets.current.dossier = openDossier; targets.current.lead = openLead;
  const onCreated = useCallback((d: Dossier, lead: Lead | null) => {
    edit("dossiers", (l) => [d, ...l]);
    if (lead) patchLead(lead.id, { status: "client" }, { ok: `${lead.name} est maintenant client.` });
    setDraft(null);
    setFocus(null);
    setUi((u) => ({ ...u, view: "liste", current: d.id, creating: false }));
  }, [edit, patchLead]);

  /** Reconduction annuelle : les dossiers créés entrent dans la liste ; « Annuler » les en retire. */
  const addDossiers = useCallback((list: Dossier[]) => edit("dossiers", (l) => [...list, ...l.filter((x) => !list.some((n) => n.id === x.id))]), [edit]);
  const removeDossiers = useCallback((ids: string[]) => edit("dossiers", (l) => l.filter((x) => !ids.includes(x.id))), [edit]);

  // Raccourcis : « ? » ouvre la liste ; « g » puis une lettre change de section. Rien pendant la saisie ni quand une fenêtre est ouverte.
  const [help, setHelp] = useState(false);
  const online = useOnline();
  useEffect(() => {
    let armed = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target) || document.querySelector("dialog[open],[role=dialog]")) { armed = 0; return; }
      const k = e.key.toLowerCase();
      if (e.key === "?") { e.preventDefault(); armed = 0; setHelp(true); return; }
      if (armed && Date.now() - armed < 1500 && GO_KEYS[k]) { e.preventDefault(); armed = 0; go(GO_KEYS[k]); return; }
      armed = k === "g" ? Date.now() : 0;
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go]);

  const store = load.data;
  const demo = Boolean(demoRole());
  const badges: Partial<Record<Section, [number, string]>> = store ? {
    prospects: [store.leads.filter((l) => l.status === "nouveau").length, "nouveaux prospects"],
    messages: [store.waiting.filter((id) => store.dossiers.some((d) => d.id === id)).length, "conversations à répondre"],
  } : {};
  const refresh = <button type="button" onClick={() => reload(true)} className={smallBtn}>Actualiser</button>;
  const firstName = staffName.includes("@") ? "" : staffName.split(" ")[0];
  const detailOpen = ui.view === "liste" && (ui.creating || !!ui.current);

  return (
    <div className="min-h-svh lg:pl-56 [&_.field]:placeholder:text-muted">
      <FrameStyle />
      <SideNav section={section} go={go} badges={badges} />
      <TopBar store={store} to={targets.current} staffName={staffName} demo={demo} onHelp={() => setHelp(true)} />
      {help && <ShortcutsHelp onClose={() => setHelp(false)} />}
      <p role="status" aria-live="polite" data-offline={online ? undefined : ""} className={online ? "sr-only" : "sticky top-0 z-40 bg-[#fff4e5] px-4 py-2.5 text-center text-sm font-semibold text-[#6b3d00] lg:top-[4.25rem]"}>{online ? "" : "Vous êtes hors ligne. Les modifications ne seront pas enregistrées tant que la connexion n'est pas rétablie."}</p>
      <div className="mx-auto max-w-[92rem] px-4 pt-3 pb-12 sm:px-6 lg:pt-2">
        {section === "parametres" ? (
          <>
            <SectionHead title="Paramètres" sub="Équipe du cabinet, inscriptions aux rappels fiscaux et avis privés des clients." />
            <div className="grid gap-6 xl:grid-cols-2 xl:items-start"><Team me={email.toLowerCase()} /><Reminders /><div className="xl:col-span-2"><Feedback openDossier={openDossier} /></div></div>
          </>
        ) : !store ? (
          load.error ? <LoadError lang="fr" retry={() => reload()} /> : <Skeleton label="Chargement du tableau de bord" rows={4} />
        ) : section === "aujourdhui" ? (
          <>
            <div className="hidden lg:block"><SectionHead title="Aujourd'hui" sub={`${firstName ? `Bonjour ${firstName}. ` : ""}${new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Montreal" }).format(new Date())}.`}>{refresh}</SectionHead></div>
            <Today store={store} staffName={staffName} firstName={firstName} demo={demo} refresh={refresh} openDossier={openDossier} openLead={openLead} acceptLead={acceptLead} showDossiers={showDossiers} showLeads={showLeads} go={go} completeTask={completeTask} markReceived={markReceived} />
          </>
        ) : section === "prospects" ? (
          <>
            <SectionHead title="Prospects" sub="Formulaire du site, Clara, appels et visites. Rien n'est confirmé sans le cabinet.">{refresh}</SectionHead>
            <Leads leads={store.leads} filter={leadFilter} setFilter={(f) => { setFocusLead(null); setLeadFilter(f); }} focusId={focusLead} patch={patchLead} onAdd={addLead} onCreateDossier={acceptLead} />
          </>
        ) : section === "dossiers" ? (
          <>
            <div className={detailOpen ? "hidden min-[1400px]:block" : ""}><SectionHead title="Dossiers">{refresh}</SectionHead></div>
            <Dossiers store={store} ui={ui} setUi={setUi} staffName={staffName} draft={draft} clearDraft={() => setDraft(null)} patch={patchDossier} move={move} onCreated={onCreated} onTouch={touch} focus={focus} onFocused={clearFocus} onInvoices={syncInvoices} onRolled={addDossiers} onUnrolled={removeDossiers} />
          </>
        ) : section === "clients" ? (
          <>
            {!clientUi.email && <SectionHead title="Clients" sub="Un client apparaît dès qu'un dossier est ouvert à son nom. Ouvrez sa fiche pour tout voir au même endroit." />}
            <Clients dossiers={store.dossiers} leads={store.leads} invoices={store.invoices} ui={clientUi} setUi={setClientUi} staffName={staffName} onShow={(e) => showDossiers({ scope: "tous", q: e })} openDossier={openDossier} onInvoices={syncInvoices} onSent={onSent} />
          </>
        ) : section === "documents" ? (
          <>
            <SectionHead title="Documents" sub="Les fichiers récents de tous les dossiers, ceux des clients et ceux du cabinet.">{refresh}</SectionHead>
            <DocumentsSection store={store} openDossier={openDossier} markReceived={markReceived} />
          </>
        ) : section === "messages" ? (
          <>
            <SectionHead title="Messages" sub="Les conversations qui attendent une réponse du cabinet apparaissent en premier.">{refresh}</SectionHead>
            <MessagesSection store={store} staffName={staffName} current={thread} setCurrent={setThread} openDossier={openDossier} onSent={onSent} />
          </>
        ) : section === "calendrier" ? (
          <>
            <SectionHead title="Calendrier" sub="Échéances, tâches datées et rendez-vous confirmés, jour par jour." />
            <Calendar store={store} openDossier={openDossier} />
          </>
        ) : (
          <>
            <SectionHead title="Facturation" sub="Toutes les factures du cabinet. Les brouillons ne sont pas visibles par les clients." />
            <Fees dossiers={store.dossiers} invoices={store.invoices} setInvoices={setInvoices} openDossier={openDossier} />
          </>
        )}
      </div>
    </div>
  );
}

/** Vérifie que le courriel connecté fait partie de l'équipe avant d'afficher quoi que ce soit. */
function Board({ email }: { email: string }) {
  const me = useLoad(async () => {
    const { data, error } = await supabase().from("staff").select("name").eq("email", email.toLowerCase()).maybeSingle();
    if (error) throw error;
    return { staff: data as { name: string } | null };
  }, email);
  if (!me.data) return me.error ? <LoadError lang="fr" retry={() => me.reload()} /> : <Skeleton label="Vérification de votre accès" rows={2} />;
  if (!me.data.staff)
    return (
      <div className="max-w-xl rounded-3xl border border-line bg-white p-7">
        <h1 className="font-display text-xl font-semibold text-ink">Accès réservé à l'équipe du cabinet.</h1>
        <p className="mt-2 leading-relaxed text-muted">Le courriel {email} n'est pas dans la liste de l'équipe. Si vous êtes client, votre espace est ici : <a className={link} href="/espace-client/">Mon espace client</a>.</p>
      </div>
    );
  return <Workspace email={email} staffName={me.data.staff.name || email} />;
}

export function Dashboard() {
  return <AppFrame lang="fr" title="Tableau de bord" subtitle="Gestion du cabinet" demo="cabinet" wide>{(s) => <Board email={s.email} />}</AppFrame>;
}
