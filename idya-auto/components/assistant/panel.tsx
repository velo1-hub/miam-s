"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageSquareText, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLeadDialog } from "@/components/forms/lead-dialog-context";
import { useDealer } from "@/components/layout/dealer-context";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics/track";
import { formatPhone } from "@/lib/format/phone";
import { cn } from "@/lib/utils/cn";
import { useAssistant } from "./assistant-context";
import { MessageParts } from "./message-parts";

const STORAGE_PREFIX = "idya:assistant-messages:";

/**
 * Assistant panel — brief §27.1: desktop 400×640 glass-3 bottom-right, mobile full-screen sheet.
 * Header « Assistant Idya · IA » + « Parler à un humain » + close. Streaming replies, suggestion
 * chips adapted to the page, aria-live on new messages, Escape closes, conversation persists.
 */
export function AssistantPanel() {
  const t = useTranslations("assistant");
  const tc = useTranslations("common");
  const locale = useLocale() as "fr" | "en";
  const dealer = useDealer();
  const { setOpen, sessionId, resetSession, context } = useAssistant();
  const { openLead } = useLeadDialog();
  const [input, setInput] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const initial = useMemo<UIMessage[]>(() => {
    if (!sessionId) return [];
    try {
      const raw = sessionStorage.getItem(STORAGE_PREFIX + sessionId);
      return raw ? (JSON.parse(raw) as UIMessage[]) : [];
    } catch {
      return [];
    }
  }, [sessionId]);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/assistant", body: () => ({ sessionId, context }) }),
    [sessionId, context],
  );

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    id: sessionId || "pending",
    messages: initial,
    transport,
    onError: (e) => {
      const m = /"error":"(\w+)"/.exec(e.message);
      setErrorCode(m?.[1] ?? "generic");
    },
    onFinish: () => setErrorCode(null),
  });

  // Persist while navigating (sessionStorage)
  useEffect(() => {
    if (!sessionId) return;
    try {
      sessionStorage.setItem(STORAGE_PREFIX + sessionId, JSON.stringify(messages.slice(-40)));
    } catch {
      /* ignore */
    }
  }, [messages, sessionId]);

  // Autoscroll + focus + Escape
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, status]);
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const busy = status === "submitted" || status === "streaming";
  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    track("assistant_message_sent");
    setErrorCode(null);
    void sendMessage({ text: trimmed });
    setInput("");
  };

  const suggestions = (context.vehicleId ? t.raw("suggestionsVehicle") : context.page?.includes("invent") ? t.raw("suggestionsInventory") : t.raw("suggestionsHome")) as string[];
  const greeting = t("greeting");
  const userTurns = messages.filter((m) => m.role === "user").length;
  const limitReached = userTurns >= 30 || errorCode === "session_limit";
  const budget = errorCode === "budget" || errorCode === "disabled";

  return (
    <div
      ref={panelRef}
      id="assistant-panel"
      role="dialog"
      aria-modal="true"
      aria-label={t("label")}
      className="glass-3 fixed inset-0 z-50 flex flex-col text-text lg:inset-auto lg:bottom-6 lg:right-[var(--gutter)] lg:h-[640px] lg:w-[400px] lg:rounded-card"
    >
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-red-text" strokeWidth={1.5} aria-hidden />
          <div>
            <p className="text-small font-semibold leading-tight">{dealer.assistantName} · IA</p>
            <p className="text-caption text-text-3">{t("disclosure", { days: dealer.chatRetentionDays })} <Link href="/privacy" className="underline-offset-2 hover:underline">{t("privacy")}</Link></p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton label={t("newChat")} variant="ghost" onClick={() => { setMessages([]); resetSession(); setErrorCode(null); }}>
            <RotateCcw strokeWidth={1.5} />
          </IconButton>
          <IconButton label={t("closeLabel")} variant="ghost" onClick={() => setOpen(false)}>
            <X strokeWidth={1.5} />
          </IconButton>
        </div>
      </header>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4" aria-live="polite" aria-busy={busy}>
        <div className="flex flex-col gap-3">
          <Bubble role="assistant">{greeting}</Bubble>
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role === "user" ? "user" : "assistant"}>
              <MessageParts message={m} onPickSlot={(label) => send(locale === "fr" ? `Je choisis le créneau du ${label}.` : `I pick the ${label} slot.`)} />
            </Bubble>
          ))}
          {status === "submitted" && <p className="text-caption text-text-3">{t("working")}</p>}
          {status === "streaming" && <p className="sr-only">{t("typing")}</p>}
          {errorCode && !budget && !limitReached && (
            <p role="alert" className="text-small text-danger">{t("error", { phone: formatPhone(dealer.phone) })}</p>
          )}
          {budget && (
            <div className="glass-lite rounded-card-sm p-3 text-small">
              <p className="font-semibold">{t("budgetTitle")}</p>
              <p className="text-text-2">{t("budgetBody")}</p>
              <Button variant="light" size="sm" className="mt-2" onClick={() => openLead("human", { chatSessionId: sessionId })}>{t("budgetTitle")}</Button>
            </div>
          )}
          {limitReached && <p className="text-small text-text-2">{t("limitReached")}</p>}
        </div>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => send(s)} className="press glass-1 rounded-pill px-3 py-1.5 text-caption text-text hover:bg-white/10">{s}</button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="border-t border-line px-3 py-3 pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-end gap-2">
          <label htmlFor="assistant-input" className="sr-only">{t("placeholder")}</label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            rows={1}
            maxLength={2000}
            placeholder={t("placeholder")}
            disabled={busy || limitReached || budget}
            className="no-red max-h-32 min-h-11 flex-1 resize-none rounded-input border border-line bg-surface px-3 py-2.5 text-small text-text outline-none placeholder:text-text-3 focus:border-text disabled:opacity-50"
          />
          {busy ? (
            <IconButton label={tc("cancel")} variant="solid" onClick={stop}><X strokeWidth={1.5} /></IconButton>
          ) : (
            <IconButton label={t("send")} variant="solid" type="submit" disabled={!input.trim() || limitReached || budget}><Send strokeWidth={1.5} /></IconButton>
          )}
        </div>
        <button type="button" onClick={() => { track("assistant_handoff"); openLead("human", { chatSessionId: sessionId }); }} className="mt-2 inline-flex items-center gap-1.5 text-caption text-text-2 underline-offset-2 hover:text-text hover:underline">
          <MessageSquareText className="size-3.5" strokeWidth={1.5} aria-hidden />
          {t("human")}
        </button>
      </form>
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[92%] rounded-card-sm px-3.5 py-2.5 text-small leading-relaxed", role === "user" ? "bg-text text-bg" : "bg-white/[0.06] text-text")}>{children}</div>
    </div>
  );
}
