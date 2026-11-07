"use client";

import { Heart, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useBooking } from "@/components/booking/booking-context";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Logo } from "@/components/ui/logo";
import { AnimatePresence, DUR, EASE_OUT, m, useReducedMotion } from "@/components/ui/motion";
import { Link, usePathname } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { favorites } from "@/lib/favorites/store";
import { formatPhone } from "@/lib/format/phone";
import { cn } from "@/lib/utils/cn";
import { LanguageToggle } from "./language-toggle";

type StaticPath = Exclude<AppPathname, "/inventory/[slug]">;
const LINKS: { href: StaticPath; key: "inventory" | "financing" | "tradeIn" | "about" | "contact" }[] = [
  { href: "/inventory", key: "inventory" },
  { href: "/financing", key: "financing" },
  { href: "/trade-in", key: "tradeIn" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
];

/**
 * Floating glass nav — brief §5.1. Transparent over the hero, glass after; hides on scroll down
 * past 120 px and returns on scroll up. The CTA is the Light button so the page's single red
 * action stays unique (Phase 0 review C3).
 */
export function Nav({ phone }: { phone: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { openBooking } = useBooking();
  const favs = favorites.useList();
  const reduced = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const [overHero, setOverHero] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);
  const lastY = useRef(0);

  // Close the menu on navigation (derived-state pattern, no effect needed)
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    const hasHero = Boolean(document.getElementById("hero"));
    const onScroll = () => {
      const y = window.scrollY;
      setOverHero(hasHero && y < 80);
      if (y > 120 && y > lastY.current + 4) setHidden(true);
      else if (y < lastY.current - 4 || y <= 120) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-4 z-[46] flex justify-center px-4 transition-transform duration-[250ms] ease-out",
          hidden && !menuOpen && "-translate-y-[120%]",
        )}
      >
        <nav
          aria-label="Principale"
          className={cn(
            "flex h-navbar w-full max-w-nav items-center justify-between rounded-pill pl-5 pr-2 transition-[background-color,border-color,box-shadow] duration-[250ms]",
            overHero && !menuOpen ? "border border-transparent" : "glass-1",
          )}
        >
          <Link href="/" className="rounded-pill">
            <Logo />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => {
              const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-10 items-center whitespace-nowrap rounded-pill px-4 text-[15px] font-medium transition-colors",
                      active ? "red-edge text-text" : "text-text-2 hover:text-text",
                    )}
                  >
                    {t(l.key)}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-1">
            <LanguageToggle className="hidden md:inline-flex" />
            <Link href="/favorites" className="relative inline-flex size-tap items-center justify-center rounded-pill text-text hover:bg-white/8" aria-label={t("favoritesCount", { count: favs.length })}>
              <Heart className="size-5" strokeWidth={1.5} aria-hidden />
              {favs.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-text px-1 text-[11px] font-semibold tabular text-bg">
                  {favs.length}
                </span>
              )}
            </Link>
            <Button variant="light" size="md" className="hidden md:inline-flex" onClick={() => openBooking()}>
              {t("bookTestDrive")}
            </Button>
            <IconButton label={menuOpen ? t("closeMenu") : t("openMenu")} variant="ghost" className="lg:hidden" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
            </IconButton>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <m.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t("openMenu")}
            className="fixed inset-0 z-[45] flex flex-col bg-bg/95 pt-24 backdrop-blur-2xl lg:hidden"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
          >
            <ul className="flex flex-col gap-2 px-8">
              {LINKS.map((l, i) => (
                <m.li
                  key={l.href}
                  initial={reduced ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.base, ease: EASE_OUT, delay: 0.04 * i }}
                >
                  <Link href={l.href} className="block py-2 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-text">
                    {t(l.key)}
                  </Link>
                </m.li>
              ))}
            </ul>
            <div className="mt-auto flex flex-col gap-4 px-8 pb-[max(24px,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between">
                <a href={`tel:${phone}`} className="text-body-lg text-text">
                  {formatPhone(phone)}
                </a>
                <LanguageToggle />
              </div>
              <Button variant="primary" size="lg" className="w-full" onClick={() => { setMenuOpen(false); openBooking(); }}>
                {t("bookTestDrive")}
              </Button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
