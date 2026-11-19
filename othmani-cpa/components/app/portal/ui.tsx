"use client";
import { useState, type DragEvent, type ReactNode } from "react";
import { Ico } from "./icons";
import { ACCEPT, type Go } from "./util";

export const TONES = {
  sky: "bg-[#e4f4f9] text-[#175f77]",
  violet: "bg-[#ecebfd] text-[#4338a8]",
  green: "bg-[#e3f5ee] text-[#0b6248]",
  amber: "bg-[#fff1dc] text-[#7a4300]",
  slate: "bg-[#eef0f7] text-navy",
  red: "bg-[#fde8e6] text-[#8a1f18]",
} as const;
export type Tone = keyof typeof TONES;

/** Tuile d'icône pastel, comme dans la présentation. */
export function Tile({ icon, tone = "slate", className = "h-11 w-11" }: { icon: string; tone?: Tone; className?: string }) {
  return <span className={`flex shrink-0 items-center justify-center rounded-2xl ${TONES[tone]} ${className}`}><Ico name={icon} /></span>;
}

export function Pill({ tone, children, icon }: { tone: Tone; children: ReactNode; icon?: string }) {
  return <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}>{icon && <Ico name={icon} className="h-3.5 w-3.5" strokeWidth={2.4} />}{children}</span>;
}

export function Box({ children, className = "", label }: { children: ReactNode; className?: string; label?: string }) {
  return <section aria-label={label} className={`rounded-3xl border border-line bg-white p-5 ${className}`}>{children}</section>;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`pf-eyebrow !text-[#565a75] ${className}`}>{children}</p>;
}

/** Titre d'écran. Sur téléphone, les écrans secondaires offrent un retour à l'accueil. */
export function PageTitle({ children, back, go, aside, sub }: { children: ReactNode; back?: string; go?: Go; aside?: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-5">
      {back && go && (
        <button type="button" onClick={() => go("home")} className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 text-[0.95rem] font-semibold text-[#175f77] lg:hidden">
          <Ico name="back" className="h-5 w-5" strokeWidth={2} />{back}
        </button>
      )}
      <div className="flex items-end justify-between gap-3">
        <h1 id="portal-title" tabIndex={-1} className="font-display text-[1.7rem] leading-tight font-bold tracking-tight text-ink outline-none">{children}</h1>
        {aside}
      </div>
      {sub && <div className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">{sub}</div>}
    </header>
  );
}

/** Bouton qui ouvre l'appareil photo (`camera`) ou le sélecteur de fichiers. */
export function FilePick({ aria, onFiles, disabled, camera = false, className, children }: { aria: string; onFiles: (f: File[]) => void; disabled: boolean; camera?: boolean; className: string; children: ReactNode }) {
  return (
    <label className={`relative cursor-pointer has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-navy ${className} ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      {children}
      <input
        type="file" className="sr-only" disabled={disabled} aria-label={aria}
        {...(camera ? { accept: "image/*", capture: "environment" as const } : { accept: ACCEPT, multiple: true })}
        onChange={(e) => { const list = Array.from(e.target.files ?? []); e.target.value = ""; if (list.length) onFiles(list); }}
      />
    </label>
  );
}

/** Cible de glisser-déposer : renvoie l'état de survol et les gestionnaires à poser sur l'élément. */
export function useDrop(onFiles: (f: File[]) => void, disabled: boolean) {
  const [over, setOver] = useState(false);
  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
  const props = {
    onDragOver: (e: DragEvent) => { if (!hasFiles(e)) return; e.preventDefault(); if (!disabled) setOver(true); },
    onDragLeave: () => setOver(false),
    onDrop: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault(); e.stopPropagation(); setOver(false);
      const list = Array.from(e.dataTransfer.files ?? []);
      if (!disabled && list.length) onFiles(list);
    },
  };
  return [over, props] as const;
}

/** Erreur de chargement d'une section, avec reprise. Distincte d'une liste vide. */
export function SectionError({ text, retryLabel, retry }: { text: string; retryLabel: string; retry: () => void }) {
  return (
    <div role="alert" className="rounded-3xl border border-[#e9c7a0] bg-[#fff4e5] p-5 text-[#6b3d00]">
      <p className="font-semibold">{text}</p>
      <button type="button" onClick={retry} className="btn-secondary mt-3 min-h-11">{retryLabel}</button>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <Box className="flex items-start gap-3.5">
      <Tile icon={icon} tone="sky" />
      <div>
        <p className="font-display text-[1.05rem] font-semibold text-ink">{title}</p>
        {children && <p className="mt-0.5 leading-relaxed text-muted">{children}</p>}
      </div>
    </Box>
  );
}
