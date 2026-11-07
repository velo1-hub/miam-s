"use client";

import { Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface HeroSources {
  av1: string | null;
  h264: string | null;
  mobile: string | null;
  poster: string | null;
  posterMobile: string | null;
}

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

/**
 * Hero video player — brief §11.2. The poster is the LCP element; the video loads only after the
 * page is interactive, fades in on canplaythrough, pauses off-screen and on hidden tabs, and is
 * replaced by the poster under reduced motion, Save-Data or 2g/3g connections.
 */
export function HeroVideo({
  sources,
  className,
}: {
  sources: HeroSources;
  className?: string;
}) {
  const t = useTranslations("home");
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [paused, setPaused] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const hasVideo = Boolean(sources.h264 || sources.av1);

  // Decide whether to load the video at all, after the page is interactive
  useEffect(() => {
    if (!hasVideo) return;
    const conn = (
      navigator as Navigator & { connection?: NetworkInformationLike }
    ).connection;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const slow =
      conn?.saveData ||
      (conn?.effectiveType && /2g|3g/.test(conn.effectiveType));
    if (reduced || slow) return;
    const mq = window.matchMedia("(max-width: 767px)");
    const start = () => {
      setPortrait(mq.matches && Boolean(sources.mobile));
      setEnabled(true);
    };
    const w = window as Window & {
      requestIdleCallback?: typeof requestIdleCallback;
      cancelIdleCallback?: typeof cancelIdleCallback;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(start, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = globalThis.setTimeout(start, 1200);
    return () => globalThis.clearTimeout(id);
  }, [hasVideo, sources.mobile]);

  // Pick a source once enabled, then load
  useEffect(() => {
    const v = videoRef.current;
    if (!enabled || !v) return;
    const av1 =
      sources.av1 && v.canPlayType('video/mp4; codecs="av01.0.08M.08"');
    const src = portrait ? sources.mobile : av1 ? sources.av1 : sources.h264;
    if (!src) return;
    v.src = src;
    v.load();
    const onCanPlay = () => {
      setReady(true);
      v.play().catch(() => setPaused(true));
    };
    v.addEventListener("canplaythrough", onCanPlay, { once: true });
    return () => v.removeEventListener("canplaythrough", onCanPlay);
  }, [enabled, portrait, sources]);

  // Pause off-screen and on hidden tab
  useEffect(() => {
    const v = videoRef.current;
    const el = wrapRef.current;
    if (!v || !el || !enabled) return;
    let visible = true;
    const sync = () => {
      if (paused) return;
      if (visible && !document.hidden) v.play().catch(() => undefined);
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [enabled, paused]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => undefined);
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  const poster =
    portrait && sources.posterMobile ? sources.posterMobile : sources.poster;

  return (
    <div
      ref={wrapRef}
      className={cn("absolute inset-0 overflow-hidden bg-bg", className)}
    >
      <div aria-hidden className="absolute inset-0">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element -- raw <img> so fetchpriority applies to the LCP poster; AVIF already optimized by the encode script
          <img
            src={poster}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="studio-bg absolute inset-0" />
        )}
        {hasVideo && enabled ? (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            disablePictureInPicture
            preload="none"
            poster={poster ?? undefined}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-[600ms] ease-out",
              ready ? "opacity-100" : "opacity-0",
            )}
          />
        ) : null}
        {/* Overlay — brief §6.1: left 45 % and lower 40 % darkened so the headline sits on near-black */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(8_8_10/0.85)_0%,rgb(8_8_10/0.55)_30%,rgb(8_8_10/0)_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgb(8_8_10/0.9)_0%,rgb(8_8_10/0.5)_22%,rgb(8_8_10/0)_40%)]" />
      </div>
      {hasVideo && enabled ? (
        <button
          type="button"
          onClick={toggle}
          aria-label={paused ? t("playVideo") : t("pauseVideo")}
          className="press pointer-events-auto absolute bottom-[max(20px,env(safe-area-inset-bottom))] right-[var(--gutter)] z-10 inline-flex size-tap items-center justify-center rounded-pill glass-1 text-text"
        >
          {paused ? (
            <Play className="size-4" strokeWidth={1.5} aria-hidden />
          ) : (
            <Pause className="size-4" strokeWidth={1.5} aria-hidden />
          )}
        </button>
      ) : null}
    </div>
  );
}
