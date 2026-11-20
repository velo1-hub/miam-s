"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { t } from "@/i18n/dict";
import { I } from "./Icons";

type Msg = { role: "user" | "assistant"; content: string };
type BookingCard = { ref: string; date: string; slot_start: string; slot_end: string; service: string; address: string; price_min?: number | null; price_max?: number | null };
type Ctx = { page?: string; quote?: Record<string, unknown> };
type Status = "pricing" | "availability" | "booking" | "lead" | null;
const KEY = "gnm-assistant-v2";

export function Assistant({ locale }: { locale: Locale }) {
  const d = t(locale).assistant;
  const pathname = usePathname();
  const [open, setOpen] = useState(false); const [msgs, setMsgs] = useState<Msg[]>([]); const [state, setState] = useState<Record<string, unknown>>({});
  const [input, setInput] = useState(""); const [busy, setBusy] = useState(false); const [status, setStatus] = useState<Status>(null);
  const [chips, setChips] = useState<string[]>([]); const [cards, setCards] = useState<BookingCard[]>([]); const [failed, setFailed] = useState<string | null>(null); const [offline, setOffline] = useState(false);
  const endRef = useRef<HTMLDivElement>(null); const inputRef = useRef<HTMLInputElement>(null); const abortRef = useRef<AbortController | null>(null); const ctxRef = useRef<Ctx>({});

  useEffect(() => { try { const v = sessionStorage.getItem(KEY); if (v) { const p = JSON.parse(v); setMsgs(p.msgs ?? []); setState(p.state ?? {}); setCards(p.cards ?? []); setChips(p.chips ?? []); } } catch {} }, []);
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify({ msgs, state, cards, chips })); } catch {} }, [msgs, state, cards, chips]);
  useEffect(() => { const h = (e: Event) => { const det = (e as CustomEvent).detail ?? {}; if (det.context) ctxRef.current = { ...ctxRef.current, ...det.context }; setOpen(Boolean(det.open ?? true)); }; window.addEventListener("gnm:assistant", h); return () => window.removeEventListener("gnm:assistant", h); }, []);
  useEffect(() => { if (open) { endRef.current?.scrollIntoView({ block: "end" }); inputRef.current?.focus(); } }, [open, msgs, busy, chips]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(async (text: string, history = msgs) => {
    const content = text.trim(); if (!content || busy) return;
    const next = [...history, { role: "user" as const, content }];
    setMsgs(next); setInput(""); setBusy(true); setChips([]); setFailed(null); setStatus(null);
    const ac = new AbortController(); abortRef.current = ac;
    let streamed = false; let acc = "";
    const show = (txt: string) => { setMsgs([...next, { role: "assistant", content: txt }]); };
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale, messages: next.slice(-20), state, context: { page: pathname, ...ctxRef.current } }), signal: ac.signal });
      if (!r.ok || !r.body) { if (r.status === 503) setOffline(true); setFailed(content); setMsgs(next); return; }
      const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = ""; let done = false;
      while (!done) {
        const chunk = await reader.read(); if (chunk.done) break;
        buf += dec.decode(chunk.value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl); buf = buf.slice(nl + 1); if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.t === "delta") { acc += ev.text; streamed = true; setStatus(null); show(acc); }
          else if (ev.t === "status") setStatus(ev.key);
          else if (ev.t === "done") { done = true; show(ev.reply || acc); if (ev.state) setState(ev.state); if (ev.booking) setCards((c) => [...c, ev.booking]); setChips(ev.booking ? [] : ev.chips ?? []); ctxRef.current = {}; }
          else if (ev.t === "error") { done = true; if (ev.code === "assistant_not_configured") setOffline(true); if (!streamed) { setFailed(content); setMsgs(next); } }
        }
      }
      if (!done && !streamed) { setFailed(content); setMsgs(next); }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      if (!streamed) { setFailed(content); setMsgs(next); }
    } finally { setBusy(false); setStatus(null); }
  }, [msgs, busy, locale, state, pathname]);

  function reset() { abortRef.current?.abort(); setMsgs([]); setState({}); setCards([]); setChips([]); setFailed(null); setBusy(false); setStatus(null); ctxRef.current = {}; try { sessionStorage.removeItem(KEY); } catch {} }
  const statusLabel = status ? d.status[status] : null;

  return (
    <>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="gnm-assistant" className="gnm-fab fixed bottom-[5.25rem] right-3 z-40 flex h-14 items-center gap-3 rounded-full bg-navy-950 pl-2 pr-2 text-white shadow-lift ring-1 ring-white/15 transition-transform hover:scale-[1.03] sm:bottom-6 sm:right-6 sm:pr-5">
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-navy-950">{open ? <I.x width={20} height={20} /> : <I.chat width={20} height={20} />}<span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-navy-950 bg-leaf" /></span>
        <span className="hidden text-[14px] font-semibold sm:inline">{open ? t(locale).common.close : "Assistant 24/7"}</span><span className="sr-only sm:hidden">{open ? t(locale).common.close : "Assistant 24/7"}</span>
      </button>
      {open && (
        <section id="gnm-assistant" role="dialog" aria-label={d.title} className="fixed inset-x-3 bottom-[9.25rem] z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-soft sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[400px]">
          <header className="flex items-center gap-3 border-b border-line bg-navy-950 px-4 py-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-navy-950"><I.sparkles width={18} height={18} /></span>
            <div className="min-w-0 flex-1"><p className="text-[14px] font-semibold">{d.title}</p><p className="truncate text-[12px] text-white/70">{d.subtitle}</p></div>
            {msgs.length > 0 && <button type="button" onClick={reset} className="rounded-full px-2.5 py-1 text-[12px] font-medium text-white/80 ring-1 ring-white/20 hover:bg-white/10 hover:text-white">{d.reset}</button>}
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-[14.5px]" aria-live="polite">
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
            {busy && (statusLabel || msgs[msgs.length - 1]?.role === "user") && (
              <Bubble role="assistant"><span className="inline-flex items-center gap-2 text-ink-500"><span className="inline-flex gap-1" aria-hidden><Dot /><Dot delay=".15s" /><Dot delay=".3s" /></span>{statusLabel && <span className="text-[13px]">{statusLabel}</span>}</span></Bubble>
            )}
            {!busy && chips.length > 0 && <div className="flex flex-wrap gap-2 pl-1">{chips.map((c) => <button key={c} type="button" className="chip !border-navy-900/30 !text-navy-900" onClick={() => send(c)}>{c}</button>)}</div>}
            {!busy && failed && !offline && (
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-700"><span>{t(locale).common.error}</span><button type="button" className="chip !py-1.5" onClick={() => send(failed)}>{d.retry}</button></div>
            )}
            {offline && <Bubble role="assistant">{d.offline}</Bubble>}
            <div ref={endRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="border-t border-line p-3">
            <div className="flex gap-2"><input ref={inputRef} className="field !min-h-[44px] !py-2" placeholder={d.placeholder} value={input} onChange={(e) => setInput(e.target.value)} disabled={busy || offline} aria-label={d.placeholder} autoComplete="off" enterKeyHint="send" /><button className="btn btn-primary !px-4" disabled={busy || offline || !input.trim()} aria-label={d.send}><I.send width={18} height={18} /></button></div>
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
