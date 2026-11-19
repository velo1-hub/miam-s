"use client";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { I } from "./Icons";

type Msg = { role: "user" | "assistant"; content: string };
type BookingCard = { ref: string; date: string; slot_start: string; slot_end: string; service: string; address: string; price_min?: number | null; price_max?: number | null };
const KEY = "gnm-assistant-v1";

export function Assistant({ locale }: { locale: Locale }) {
  const d = t(locale).assistant;
  const [open, setOpen] = useState(false); const [msgs, setMsgs] = useState<Msg[]>([]); const [state, setState] = useState<Record<string, unknown>>({});
  const [input, setInput] = useState(""); const [busy, setBusy] = useState(false); const [cards, setCards] = useState<BookingCard[]>([]); const [offline, setOffline] = useState(false);
  const endRef = useRef<HTMLDivElement>(null); const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { try { const v = sessionStorage.getItem(KEY); if (v) { const p = JSON.parse(v); setMsgs(p.msgs ?? []); setState(p.state ?? {}); setCards(p.cards ?? []); } } catch {} }, []);
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify({ msgs, state, cards })); } catch {} }, [msgs, state, cards]);
  useEffect(() => { const h = (e: Event) => { setOpen(Boolean((e as CustomEvent).detail?.open ?? true)); }; window.addEventListener("gnm:assistant", h); return () => window.removeEventListener("gnm:assistant", h); }, []);
  useEffect(() => { if (open) { endRef.current?.scrollIntoView({ block: "end" }); inputRef.current?.focus(); } }, [open, msgs, busy]);

  async function send(text: string) {
    const content = text.trim(); if (!content || busy) return;
    const next = [...msgs, { role: "user" as const, content }]; setMsgs(next); setInput(""); setBusy(true);
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale, messages: next.slice(-20), state }) });
      const data = await r.json();
      if (!r.ok || !data.reply) { setOffline(true); setMsgs([...next, { role: "assistant", content: d.offline }]); return; }
      setMsgs([...next, { role: "assistant", content: data.reply }]); if (data.state) setState(data.state); if (data.booking) setCards((c) => [...c, data.booking]);
    } catch { setOffline(true); setMsgs([...next, { role: "assistant", content: d.offline }]); } finally { setBusy(false); }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="gnm-assistant" className="fixed bottom-20 right-4 z-40 flex h-14 items-center gap-3 rounded-full bg-navy-950 pl-2 pr-5 text-white shadow-lift ring-1 ring-white/15 transition-transform hover:scale-[1.03] sm:bottom-6 sm:right-6">
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-navy-950">{open ? <I.x width={20} height={20} /> : <I.chat width={20} height={20} />}<span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-navy-950 bg-leaf" /></span>
        <span className="text-[14px] font-semibold">{open ? t(locale).common.close : (locale === "fr" ? "Assistant 24/7" : "Assistant 24/7")}</span>
      </button>
      {open && (
        <section id="gnm-assistant" role="dialog" aria-label={d.title} className="fixed inset-x-3 bottom-[9.5rem] z-40 flex max-h-[72vh] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-soft sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[400px]">
          <header className="flex items-center gap-3 border-b border-line bg-navy-950 px-4 py-3 text-white"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-navy-950"><I.sparkles width={18} height={18} /></span><div><p className="text-[14px] font-semibold">{d.title}</p><p className="text-[12px] text-white/70">{d.subtitle}</p></div></header>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-[14.5px]">
            <Bubble role="assistant">{d.hello}</Bubble>
            {msgs.length === 0 && <div className="flex flex-wrap gap-2">{d.chips.map((c) => <button key={c} type="button" className="chip" onClick={() => send(c)}>{c}</button>)}</div>}
            {msgs.map((m, i) => <Bubble key={i} role={m.role}>{m.content}</Bubble>)}
            {cards.map((b) => (
              <div key={b.ref} className="rounded-xl border border-teal-600/30 bg-teal-100/60 p-3 text-[13.5px] text-ink-900">
                <p className="flex items-center gap-2 font-semibold text-teal-600"><I.check width={16} height={16} strokeWidth={2.5} />{d.booked} · {b.ref}</p>
                <p className="mt-1">{b.date} · {b.slot_start}–{b.slot_end}</p><p>{b.address}</p>
                <a className="mt-2 inline-block underline" href={`/api/bookings?ref=${b.ref}&email=${encodeURIComponent(String(state.email ?? ""))}&format=ics`}>{t(locale).common.addToCalendar}</a>
              </div>
            ))}
            {busy && <Bubble role="assistant"><span className="inline-flex gap-1" aria-label="…"><Dot /><Dot delay=".15s" /><Dot delay=".3s" /></span></Bubble>}
            <div ref={endRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t border-line p-3">
            <div className="flex gap-2"><input ref={inputRef} className="field !min-h-[44px] !py-2" placeholder={d.placeholder} value={input} onChange={(e) => setInput(e.target.value)} disabled={busy || offline} aria-label={d.placeholder} /><button className="btn btn-primary !px-4" disabled={busy || offline || !input.trim()} aria-label={d.send}><I.send width={18} height={18} /></button></div>
            <p className="mt-2 text-[11px] text-ink-500">{d.disclaimer}</p>
          </form>
        </section>
      )}
    </>
  );
}
function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 leading-relaxed ${role === "user" ? "bg-navy-900 text-white" : "bg-sand-100 text-ink-900"}`}>{children}</div></div>;
}
function Dot({ delay = "0s" }: { delay?: string }) { return <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-ink-500" style={{ animationDelay: delay }} />; }
