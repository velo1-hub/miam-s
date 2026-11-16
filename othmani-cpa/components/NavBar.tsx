"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

export type FlyItem = { href: string; label: string; text?: string; icon?: string };
export type FlyGroup = { title: string; items: FlyItem[] };
export type NavItem = { key: string; href: string; label: string; current?: boolean; fly?: { kicker: string; title: string; text: string; groups: FlyGroup[]; cta?: FlyItem } };

/**
 * Navigation principale « réactive », inspirée d'apple.com :
 * - un indicateur glisse sous le lien survolé ;
 * - les panneaux se déroulent avec une animation, éléments en cascade ;
 * - la page est floutée derrière le panneau ouvert ;
 * - Échap ou un clic hors du panneau le referme. Les liens restent de vrais liens (fonctionne sans JS).
 */
export function NavBar({ items, label }: { items: NavItem[]; label: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const [pill, setPill] = useState<{ x: number; w: number; on: boolean }>({ x: 0, w: 0, on: false });
  const listRef = useRef<HTMLUListElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const later = (fn: () => void, ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };
  const close = useCallback(() => { if (timer.current) clearTimeout(timer.current); setOpen(null); }, []);

  const movePill = (el: HTMLElement) => {
    const ul = listRef.current;
    if (!ul) return;
    const a = el.getBoundingClientRect(), b = ul.getBoundingClientRect();
    setPill({ x: a.left - b.left, w: a.width, on: true });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, { passive: true });
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("scroll", close); };
  }, [close]);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-nav-open", open !== null);
  }, [open]);

  const active = items.find((i) => i.key === open)?.fly;

  return (
    <div onMouseLeave={() => { later(close, 160); setPill((p) => ({ ...p, on: false })); }}>
      <nav aria-label={label}>
        <ul ref={listRef} className="relative flex items-center">
          {/* Indicateur qui suit le survol */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 h-8 -translate-y-1/2 rounded-full bg-navy/[0.06] transition-all duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{ left: pill.x, width: pill.w, opacity: pill.on ? 1 : 0 }}
          />
          {items.map((it) => (
            <li key={it.key} className="relative">
              <Link
                href={it.href}
                aria-current={it.current ? "page" : undefined}
                aria-expanded={it.fly ? open === it.key : undefined}
                aria-haspopup={it.fly ? "true" : undefined}
                onMouseEnter={(e) => { movePill(e.currentTarget); if (it.fly) later(() => setOpen(it.key), open ? 0 : 120); else later(close, 120); }}
                onFocus={(e) => { movePill(e.currentTarget); if (it.fly) setOpen(it.key); else close(); }}
                onClick={close}
                className={`relative z-10 flex h-[3.25rem] items-center gap-1 px-3.5 text-[0.8rem] tracking-[0.01em] transition-colors ${
                  it.current || open === it.key ? "font-medium text-navy" : "text-ink/70 hover:text-ink"
                }`}
              >
                {it.label}
                {it.current && <span className="absolute inset-x-3.5 bottom-2 h-[2px] rounded-full bg-sky" aria-hidden="true" />}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Panneau déroulant pleine largeur */}
      <div
        className={`absolute inset-x-0 top-full grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${active ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"}`}
        onMouseEnter={() => timer.current && clearTimeout(timer.current)}
      >
        <div className="overflow-hidden">
          <div className="border-b border-black/[0.06] bg-[#fbfcfe]/[0.97] shadow-[0_40px_80px_-50px_rgba(23,23,58,.45)]">
            {active && (
              <div key={open} className="container-site grid gap-10 py-10 lg:grid-cols-[16rem_1fr] lg:py-12">
                <div className="nav-in" style={{ ["--i" as string]: 0 }}>
                  <p className="text-xs font-semibold tracking-[0.14em] text-navy/70 uppercase">{active.kicker}</p>
                  <p className="mt-2 font-display text-[1.75rem] leading-tight font-semibold text-navy">{active.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{active.text}</p>
                  {active.cta && (
                    <Link href={active.cta.href} onClick={close} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline underline-offset-4">
                      {active.cta.label} <Icon name="arrow" className="h-4 w-4" />
                    </Link>
                  )}
                </div>
                <div className={`grid gap-8 ${active.groups.length > 1 ? "md:grid-cols-2" : ""}`}>
                  {active.groups.map((g, gi) => (
                    <div key={g.title}>
                      <p className="nav-in mb-3 text-xs font-medium text-muted" style={{ ["--i" as string]: gi + 1 }}>{g.title}</p>
                      <ul className="grid gap-1">
                        {g.items.map((f, i) => (
                          <li key={f.href} className="nav-in" style={{ ["--i" as string]: gi * 2 + i + 2 }}>
                            <Link href={f.href} onClick={close} className="group/item flex gap-3.5 rounded-2xl p-3 -ml-3 transition-colors hover:bg-white">
                              {f.icon && (
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/[0.06] text-navy transition-colors group-hover/item:bg-navy group-hover/item:text-white">
                                  <Icon name={f.icon} className="h-5 w-5" />
                                </span>
                              )}
                              <span>
                                <span className="flex items-center gap-1.5 font-display font-semibold text-ink group-hover/item:text-navy">
                                  {f.label}
                                  <Icon name="arrow" className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover/item:translate-x-0 group-hover/item:opacity-100" />
                                </span>
                                {f.text && <span className="mt-0.5 block text-sm leading-snug text-muted">{f.text}</span>}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Voile flouté sur la page, comme sur apple.com */}
      <div
        aria-hidden="true"
        onClick={close}
        className={`fixed inset-x-0 top-[3.25rem] bottom-0 -z-20 bg-white/30 backdrop-blur-md transition-opacity duration-500 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
    </div>
  );
}
