"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { site, type Lang } from "@/lib/site";
import { KINDS, STEPS5, cad, fmtDate, save, step5, type Dossier, type Invoice, type Message, type Signature } from "../shared";
import { MyData } from "./Extras";
import { Ico } from "./icons";
import type { T } from "./text";
import { Box, Empty, PageTitle, Pill, Tile } from "./ui";
import { dossierLabel, mailHref, safePayUrl, telHref, type Go } from "./util";

const titleOf = (dossiers: Dossier[], id: string) => { const d = dossiers.find((x) => x.id === id); return d ? dossierLabel(d) : ""; };

/* ───────────── À signer ───────────── */
function SignForm({ s, reload, lang, t }: { s: Signature; reload: () => void; lang: Lang; t: T }) {
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const id = useId();
  const ready = name.trim().length >= 3 && agree;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    const ok = await save(supabase().rpc("sign_document", { p_id: s.id, p_name: name.trim().slice(0, 160) }), { ok: t.signOk, lang });
    setBusy(false);
    if (ok) reload();
  };
  return (
    <form onSubmit={submit} className="mt-4 border-t border-line pt-4">
      <label htmlFor={`${id}-n`} className="label">{t.signName}</label>
      <input id={`${id}-n`} value={name} onChange={(e) => setName(e.target.value)} required minLength={3} maxLength={160} autoComplete="name" className="field" />
      <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-ink">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required className="h-5 w-5 shrink-0 accent-[#2a2a5c]" />
        <span>{t.signCheck}</span>
      </label>
      <button type="submit" disabled={!ready || busy} className="btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:!bg-none disabled:!bg-[#5d6079] sm:w-auto">{busy ? t.signBusy : t.signBtn}</button>
      <p className="mt-3 text-sm leading-relaxed text-muted">{t.signNote}</p>
    </form>
  );
}

export function SignScreen({ sigs, dossiers, reload, lang, t, go }: { sigs: Signature[]; dossiers: Dossier[]; reload: () => void; lang: Lang; t: T; go: Go }) {
  const pending = sigs.filter((s) => s.status === "a_signer");
  const signed = sigs.filter((s) => s.status === "signe");
  const [openId, setOpenId] = useState<string | null>(pending[0]?.id ?? null);
  const many = dossiers.length > 1;
  const item = (s: Signature) => {
    const isOpen = openId === s.id;
    const done = s.status === "signe";
    return (
      <li key={s.id}>
        <Box>
          <div className="flex items-start gap-3.5">
            <Tile icon="sign" tone={done ? "green" : "violet"} />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-[1.05rem] leading-snug font-semibold break-words text-ink">{s.title}</h3>
              {many && titleOf(dossiers, s.dossier_id) && <p className="text-sm text-muted">{titleOf(dossiers, s.dossier_id)}</p>}
              <p className="mt-1.5">
                {done
                  ? <Pill tone="green" icon="check">{t.signedOn(s.signed_at ? fmtDate(s.signed_at, lang, true) : "", s.signed_name ?? "")}</Pill>
                  : <Pill tone="amber">{t.signPending}</Pill>}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setOpenId(isOpen ? null : s.id)} aria-expanded={isOpen} className="mt-3 inline-flex min-h-11 items-center gap-1 rounded-full font-semibold text-navy underline underline-offset-4">
            {t.signRead}<Ico name="chevron" className={`h-4 w-4 transition-transform ${isOpen ? "-rotate-90" : "rotate-90"}`} strokeWidth={2.2} />
          </button>
          {isOpen && (
            <>
              <div className="mt-2 rounded-2xl bg-[#f4f5fa] p-4 leading-relaxed break-words whitespace-pre-line text-ink">{s.body || s.title}</div>
              {!done && <SignForm s={s} reload={reload} lang={lang} t={t} />}
            </>
          )}
        </Box>
      </li>
    );
  };
  return (
    <div className="max-w-2xl">
      <PageTitle back={t.back} go={go} sub={t.signIntro}>{t.signTitle}</PageTitle>
      {sigs.length === 0 ? <Empty icon="sign" title={t.signEmpty}>{t.signEmptyD}</Empty> : (
        <>
          {pending.length === 0 && <div className="mb-4"><Empty icon="check" title={t.signEmpty}>{t.signEmptyD}</Empty></div>}
          <ul className="space-y-4">{pending.map(item)}</ul>
          {signed.length > 0 && <h2 className="mt-6 mb-3 px-1 font-display text-lg font-semibold text-ink">{t.signedDocs}</h2>}
          <ul className="space-y-4">{signed.map(item)}</ul>
        </>
      )}
    </div>
  );
}

/* ───────────── Paiements ───────────── */
export function PayScreen({ invoices, dossiers, lang, t, go }: { invoices: Invoice[]; dossiers: Dossier[]; lang: Lang; t: T; go: Go }) {
  const list = [...invoices.filter((i) => i.status === "a_payer"), ...invoices.filter((i) => i.status === "payee")];
  const many = dossiers.length > 1;
  return (
    <div className="max-w-2xl">
      <PageTitle back={t.back} go={go}>{t.payTitle}</PageTitle>
      {list.length === 0 ? <Empty icon="card" title={t.payEmpty}>{t.payEmptyD}</Empty> : (
        <ul className="space-y-4">
          {list.map((i) => {
            const url = safePayUrl(i.pay_url);
            const due = i.status === "a_payer";
            const amount = cad(i.amount_cents, lang);
            const file = titleOf(dossiers, i.dossier_id);
            return (
              <li key={i.id}>
                <Box>
                  <div className="flex items-start gap-3.5">
                    <Tile icon="card" tone={due ? "amber" : "green"} />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-[1.05rem] leading-snug font-semibold break-words text-ink">{i.label}</h2>
                      {many && file && file !== i.label && <p className="text-sm text-muted">{file}</p>}
                      <p className="mt-1.5">{due ? <Pill tone="amber">{t.toPay}</Pill> : <Pill tone="green" icon="check">{i.paid_at ? `${t.paidOn} ${fmtDate(i.paid_at, lang)}` : t.paid}</Pill>}</p>
                    </div>
                    <p className="shrink-0 font-display text-lg font-bold text-ink">{amount}</p>
                  </div>
                  {due && (url ? (
                    <div className="mt-4 border-t border-line pt-4">
                      <a href={url} target="_blank" rel="noopener noreferrer" aria-label={t.payAria(i.label, amount)} className="btn-primary w-full sm:w-auto">{t.payCta} {amount}</a>
                      <p className="mt-2 text-sm text-muted">{t.payHow}</p>
                    </div>
                  ) : <p className="mt-4 border-t border-line pt-3.5 text-[0.95rem] text-muted">{t.payLater}</p>)}
                </Box>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ───────────── Messages ───────────── */
export function ChatScreen({ d, msgs, author, reload, lang, t, sub }: { d: Dossier; msgs: Message[]; author: string; reload: () => void; lang: Lang; t: T; sub?: string }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const count = msgs.length;
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [count, d.id]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    const ok = await save(supabase().from("messages").insert({ dossier_id: d.id, author_role: "client", author_name: author.slice(0, 160), body: text.slice(0, 4000) }), { lang });
    setBusy(false);
    if (ok) { setBody(""); reload(); }
  };

  return (
    <div className="flex max-w-2xl flex-col lg:min-h-[calc(100svh-12rem)]">
      <PageTitle sub={sub}>{t.msgTitle}</PageTitle>
      {count === 0 ? <Empty icon="chat" title={t.noMsgs}>{t.noMsgsD}</Empty> : (
        <ul className="space-y-3">
          {msgs.map((m) => {
            const mine = m.author_role === "client";
            return (
              <li key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] rounded-[1.4rem] px-4 py-3 leading-relaxed ${mine ? "rounded-br-md bg-[#2a2a5c] text-white" : "rounded-bl-md border border-line bg-white text-ink"}`}>
                  <p className="break-words whitespace-pre-line">{m.body}</p>
                  <p className={`mt-1 text-xs ${mine ? "text-white/85" : "text-muted"}`}>{mine ? t.you : m.author_name || site.name} · {fmtDate(m.created_at, lang, true)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div ref={end} className="h-px scroll-mb-48 lg:scroll-mb-28" aria-hidden="true" />
      {/* Sur téléphone, le bas de la zone reste libre pour le bouton rond de Clara. */}
      <form onSubmit={send} className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-line bg-white/95 px-4 pt-2.5 pb-7 backdrop-blur lg:sticky lg:inset-x-auto lg:bottom-4 lg:mt-auto lg:rounded-[1.75rem] lg:border lg:p-2.5 lg:shadow-[0_18px_40px_-30px_rgba(23,23,58,.5)]">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <label htmlFor="portal-msg" className="sr-only">{t.yourMsg}</label>
          <textarea id="portal-msg" value={body} onChange={(e) => setBody(e.target.value)} rows={1} maxLength={4000} placeholder={t.yourMsg} enterKeyHint="send" className="field max-h-32 min-h-12 resize-none rounded-3xl [field-sizing:content] placeholder:text-muted" />
          <button type="submit" disabled={busy || !body.trim()} aria-label={t.send} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-white transition-colors hover:bg-navy-700 disabled:bg-[#5d6079]">
            <Ico name="send" strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  );
}

/* ───────────── Profil ───────────── */
export function ProfileScreen({ d, dossiers, email, pick, counts, lang, t, go }: { d: Dossier; dossiers: Dossier[]; email: string; pick: (id: string) => void; counts: { sign: number; pay: number }; lang: Lang; t: T; go: Go }) {
  const row = "flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left text-ink";
  const group = "overflow-hidden rounded-3xl border border-line bg-white";
  const h = "px-5 pt-5 pb-1 font-display text-lg font-semibold text-ink";
  const links = [["sign", "sign", t.side.sign, counts.sign], ["pay", "card", t.side.pay, counts.pay], ["appt", "calendar", t.side.appt, 0], ["receipts", "receipt", t.side.receipts, 0]] as const;
  return (
    <div className="max-w-2xl space-y-4">
      <PageTitle sub={<span className="break-all">{d.client_name}</span>}>{t.profile}</PageTitle>

      {dossiers.length > 1 && (
        <Box>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">{t.myFiles}</h2>
          <ul className="space-y-2">
            {dossiers.map((x) => (
              <li key={x.id}>
                <button type="button" onClick={() => pick(x.id)} aria-current={x.id === d.id ? "true" : undefined} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 text-left transition-colors hover:border-navy aria-[current=true]:border-navy aria-[current=true]:bg-[#eef0f7]">
                  <span>
                    <span className="block font-display font-semibold text-ink">{dossierLabel(x)}</span>
                    <span className="mt-0.5 block text-sm text-muted">{KINDS[x.kind]?.[lang] ?? x.kind} · {STEPS5[step5(x.status)][lang]}</span>
                  </span>
                  {x.id === d.id && <Ico name="check" className="h-5 w-5 shrink-0 text-navy" strokeWidth={2.2} />}
                </button>
              </li>
            ))}
          </ul>
        </Box>
      )}

      <section className={`${group} lg:hidden`}>
        <h2 className={h}>{t.shortcuts}</h2>
        <ul className="divide-y divide-line">
          {links.map(([tab, icon, label, n]) => (
            <li key={tab}>
              <button type="button" onClick={() => go(tab)} className={row}>
                <Ico name={icon} className="h-5 w-5 shrink-0 text-navy" /><span className="flex-1 font-semibold text-navy">{label}</span>
                {n > 0 && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-navy px-1.5 text-xs font-bold text-white">{n}</span>}
                <Ico name="chevron" className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={group}>
        <h2 className={h}>{t.help}</h2>
        <ul className="divide-y divide-line">
          <li><a href={telHref(site.phone.tel)} className={row}><Ico name="phone" className="h-5 w-5 shrink-0 text-navy" /><span className="flex-1 font-semibold text-navy">{t.call}</span><span className="text-muted">{site.phone.display}</span></a></li>
          {site.email && <li><a href={mailHref(site.email)} className={row}><Ico name="mail" className="h-5 w-5 shrink-0 text-navy" /><span className="flex-1 font-semibold text-navy">{t.write}</span></a></li>}
        </ul>
      </section>

      <section className={group}>
        <h2 className={h}>{t.account}</h2>
        <ul className="divide-y divide-line">
          <li className={row}><Ico name="user" className="h-5 w-5 shrink-0 text-navy" /><span className="min-w-0"><span className="block text-sm text-muted">{t.emailL}</span><span className="block font-medium break-all">{email}</span></span></li>
          <li><a href={lang === "fr" ? "/en/client-portal/" : "/espace-client/"} lang={lang === "fr" ? "en" : "fr"} hrefLang={lang === "fr" ? "en" : "fr"} className={row}><Ico name="globe" className="h-5 w-5 shrink-0 text-navy" /><span className="flex-1 font-semibold text-navy">{t.otherLang}</span><Ico name="chevron" className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} /></a></li>
        </ul>
      </section>

      <MyData email={email} lang={lang} t={t} />
    </div>
  );
}
