"use client";

import { BookOpenText, CalendarDays, Car, Inbox, LayoutDashboard, LogOut, ScrollText, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/admin/actions";
import { Logo } from "@/components/ui/logo";
import type { AdminSession } from "@/lib/admin/auth";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/admin", label: "Accueil", icon: LayoutDashboard },
  { href: "/admin/vehicules", label: "Véhicules", icon: Car },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/essais", label: "Essais routiers", icon: CalendarDays },
  { href: "/admin/assistant", label: "Assistant", icon: Sparkles },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
  { href: "/admin/journal", label: "Journal", icon: ScrollText },
];

export function AdminShell({ session, demoMode, children }: { session: AdminSession; demoMode: boolean; children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-bg-raised px-4 py-6 lg:flex">
        <Link href="/admin" className="mb-8 block px-2"><Logo /></Link>
        <nav aria-label="Administration" className="flex flex-col gap-1">
          {NAV.map((n) => {
            const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
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
        <header className="flex items-center gap-3 overflow-x-auto border-b border-line px-4 py-3 lg:hidden">
          <Logo compact />
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn("whitespace-nowrap rounded-pill px-3 py-1.5 text-caption", pathname === n.href ? "bg-text text-bg" : "text-text-2")}>{n.label}</Link>
          ))}
        </header>
        <main className="flex-1 px-5 py-8 md:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
