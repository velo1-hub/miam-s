"use client";

import { BookOpenText, CalendarDays, Car, Ellipsis, Inbox, LayoutDashboard, LogOut, ScrollText, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { logoutAction } from "@/app/admin/actions";
import { Logo } from "@/components/ui/logo";
import type { AdminSession } from "@/lib/admin/auth";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/admin", label: "Accueil", short: "Accueil", icon: LayoutDashboard },
  { href: "/admin/vehicules", label: "Véhicules", short: "Véhicules", icon: Car },
  { href: "/admin/leads", label: "Leads", short: "Leads", icon: Inbox },
  { href: "/admin/essais", label: "Essais routiers", short: "Essais", icon: CalendarDays },
  { href: "/admin/assistant", label: "Assistant", short: "Assistant", icon: Sparkles },
  { href: "/admin/parametres", label: "Paramètres", short: "Paramètres", icon: Settings },
  { href: "/admin/journal", label: "Journal", short: "Journal", icon: ScrollText },
];
/** Phones get a bottom tab bar: the four daily destinations plus a « Plus » sheet for the rest. */
const PRIMARY = NAV.slice(0, 4);
const MORE = NAV.slice(4);

const isActive = (href: string, pathname: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

export function AdminShell({ session, demoMode, children }: { session: AdminSession; demoMode: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = () => setMoreOpen(false);
  const moreActive = MORE.some((n) => isActive(n.href, pathname));
  return (
    <div className="admin-root flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-bg-raised px-4 py-6 lg:flex">
        <Link href="/admin" className="mb-8 block px-2"><Logo /></Link>
        <nav aria-label="Administration" className="flex flex-col gap-1">
          {NAV.map((n) => {
            const active = isActive(n.href, pathname);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-3 rounded-card-sm px-3 py-2 text-admin", active ? "red-edge bg-white/[0.06] text-text" : "text-text-2 hover:bg-white/[0.04] hover:text-text")}>
                <n.icon className="size-4" strokeWidth={1.5} aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-3 px-2 text-caption text-text-3">
          {demoMode && <span className="rounded-pill border border-line px-2 py-1 text-center"><BookOpenText className="mr-1 inline size-3" strokeWidth={1.5} aria-hidden />Mode démonstration</span>}
          <div>
            <p className="text-small text-text">{session.fullName}</p>
            <p>{session.email} · {session.role}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="inline-flex items-center gap-2 text-text-2 hover:text-text"><LogOut className="size-4" strokeWidth={1.5} aria-hidden />Déconnexion</button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Phone / tablet top bar: brand, demo flag, sign-out. Navigation lives in the bottom tab bar. */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 py-2 backdrop-blur-md lg:hidden">
          <Link href="/admin" aria-label="Accueil de l’administration" className="flex h-11 items-center"><Logo compact /></Link>
          <div className="flex items-center gap-2 text-caption text-text-3">
            {demoMode && <span className="rounded-pill border border-line px-2 py-1" title="Mode démonstration"><BookOpenText className="mr-1 inline size-3" strokeWidth={1.5} aria-hidden />Démo</span>}
            <span className="hidden max-w-40 truncate sm:inline">{session.fullName}</span>
            <form action={logoutAction}>
              <button type="submit" aria-label="Déconnexion" className="press inline-flex size-tap items-center justify-center rounded-pill text-text-2 hover:bg-white/[0.06] hover:text-text"><LogOut className="size-4" strokeWidth={1.5} aria-hidden /></button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-4 py-5 pb-[calc(84px+env(safe-area-inset-bottom))] md:px-8 md:py-8 lg:px-10 lg:pb-8">{children}</main>
        <nav aria-label="Administration" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg-raised/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
          {moreOpen && (
            <div id="admin-more" className="border-b border-line px-3 py-3">
              <ul className="flex flex-col">
                {MORE.map((n) => {
                  const active = isActive(n.href, pathname);
                  return (
                    <li key={n.href}>
                      <Link href={n.href} onClick={closeMore} aria-current={active ? "page" : undefined} className={cn("flex h-12 items-center gap-3 rounded-card-sm px-3 text-admin", active ? "bg-white/[0.06] text-text" : "text-text-2 hover:bg-white/[0.04] hover:text-text")}>
                        <n.icon className="size-4" strokeWidth={1.5} aria-hidden />
                        {n.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-line px-3 pt-3 text-caption text-text-3">
                <div className="min-w-0">
                  <p className="truncate text-small text-text">{session.fullName}</p>
                  <p className="truncate">{session.email} · {session.role}</p>
                </div>
                <form action={logoutAction}>
                  <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-pill border border-line px-3 text-small text-text-2 hover:text-text"><LogOut className="size-4" strokeWidth={1.5} aria-hidden />Déconnexion</button>
                </form>
              </div>
            </div>
          )}
          <ul className="grid grid-cols-5">
            {PRIMARY.map((n) => {
              const active = isActive(n.href, pathname);
              return (
                <li key={n.href}>
                  <Link href={n.href} onClick={closeMore} aria-current={active ? "page" : undefined} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[11px] leading-none", active ? "text-text" : "text-text-3 hover:text-text")}>
                    <span className={cn("flex h-7 w-12 items-center justify-center rounded-pill", active && "bg-white/[0.08]")}><n.icon className="size-5" strokeWidth={1.5} aria-hidden /></span>
                    {n.short}
                  </Link>
                </li>
              );
            })}
            <li>
              <button type="button" aria-expanded={moreOpen} aria-controls="admin-more" onClick={() => setMoreOpen((o) => !o)} className={cn("flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] leading-none", moreActive || moreOpen ? "text-text" : "text-text-3 hover:text-text")}>
                <span className={cn("flex h-7 w-12 items-center justify-center rounded-pill", (moreActive || moreOpen) && "bg-white/[0.08]")}><Ellipsis className="size-5" strokeWidth={1.5} aria-hidden /></span>
                Plus
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
