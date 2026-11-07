"use client";

import { Expand, Hand, Minimize, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils/cn";
import { pickFormat, pickSpinSize, spinFrameUrl } from "@/lib/vehicles/media";
import type { ImageFormat, SpinSet, SpinSize } from "@/lib/vehicles/types";
import { SPIN_WIDTHS } from "@/lib/vehicles/types";
import { IconButton } from "@/components/ui/icon-button";
import { normalizeFrame, prefersReducedMotion, supportsAvif } from "./support";
import { loadFrame, useSpinLoader, type FrameBitmap } from "./use-spin-loader";

export interface Car360Props {
  spin: SpinSet;
  /** Accessible title, e.g. "2023 Toyota RAV4 XLE" */
  title: string;
  mode?: "drag" | "scroll";
  /** Scroll mode: progress 0→1 maps to frames 0→n */
  progress?: number;
  className?: string;
  /** Hide the toolbar (home scene) */
  minimal?: boolean;
  onShowPhotos?: () => void;
  /** Start loading immediately instead of waiting for proximity */
  eager?: boolean;
  aspect?: "16/9" | "4/3";
}

const MAX_ZOOM = 2.5;
const FRICTION = 0.92;
const STOP_VELOCITY = 0.05;
const AUTO_TURN_MS = 4000;
const HINT_KEY = "idya:spin-hint-seen";
const nowMs = () => performance.now();

/**
 * Car360 — brief §9. Canvas renderer at DPR ≤ 2, bisection loader, drag with inertia, keyboard,
 * zoom with xl frame, fullscreen, one automatic turn, scroll mode for the home scene.
 */
export function Car360({ spin, title, mode = "drag", progress = 0, className, minimal, onShowPhotos, eager, aspect = "16/9" }: Car360Props) {
  const t = useTranslations("vehicle");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const n = spin.frameCount;
  const dir = spin.reverse ? -1 : 1;

  const [size, setSize] = useState<SpinSize>(() => (spin.sizes.includes("sm") ? "sm" : spin.sizes[0]));
  const [format, setFormat] = useState<ImageFormat>(() => (spin.formats.includes("webp") ? "webp" : spin.formats[0]));
  const [active, setActive] = useState(Boolean(eager));
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [interacted, setInteracted] = useState(false);

  const frame = useRef(spin.coverFrame); // float, un-normalized
  const velocity = useRef(0);
  const pan = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const raf = useRef<number | null>(null);
  const xlCache = useRef<Map<number, FrameBitmap>>(new Map());
  const fullTurnStart = useRef<number | null>(null);
  const lastDrawn = useRef(-1);
  const loader = useSpinLoader(spin, size, format, active);

  // Format + size negotiation
  useEffect(() => {
    let alive = true;
    supportsAvif().then((ok) => alive && setFormat(pickFormat(spin, ok)));
    return () => {
      alive = false;
    };
  }, [spin]);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setSize(pickSpinSize(spin, w, window.devicePixelRatio || 1));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [spin]);

  // Proximity loading: within one viewport (brief §9)
  useEffect(() => {
    if (active) return;
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      lastDrawn.current = -1;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const idx = normalizeFrame(frame.current, n);
    const z = zoomRef.current;
    let bmp: FrameBitmap | null = null;
    if (z > 1.05 && xlCache.current.has(idx)) bmp = xlCache.current.get(idx) ?? null;
    if (!bmp) bmp = loader.nearest(idx).frame;
    if (!bmp) return;
    const bw = "width" in bmp ? bmp.width : 0;
    const bh = "height" in bmp ? bmp.height : 0;
    if (!bw || !bh) return;
    // cover-fit
    const scale = Math.max(canvas.width / bw, canvas.height / bh) * z;
    const dw = bw * scale;
    const dh = bh * scale;
    const maxPanX = Math.max(0, (dw - canvas.width) / 2);
    const maxPanY = Math.max(0, (dh - canvas.height) / 2);
    pan.current.x = Math.max(-maxPanX, Math.min(maxPanX, pan.current.x));
    pan.current.y = Math.max(-maxPanY, Math.min(maxPanY, pan.current.y));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, (canvas.width - dw) / 2 + pan.current.x, (canvas.height - dh) / 2 + pan.current.y, dw, dh);
    lastDrawn.current = idx;
  }, [loader, n]);

  useEffect(() => {
    loader.setOnFrame(() => draw());
    draw();
  }, [loader, draw]);

  // Scroll mode: frame follows progress
  useEffect(() => {
    if (mode !== "scroll") return;
    frame.current = progress * n * dir;
    draw();
  }, [mode, progress, n, dir, draw]);

  // Inertia / auto-turn loop
  const stopLoop = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);
  const loop = useCallback(() => {
    stopLoop();
    const step = (now: number) => {
      let again = false;
      if (fullTurnStart.current !== null) {
        const tt = Math.min(1, (now - fullTurnStart.current) / AUTO_TURN_MS);
        const eased = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2; // ease-in-out
        frame.current = spin.coverFrame + eased * n * dir;
        if (tt >= 1) {
          fullTurnStart.current = null;
          track("spin_completed", { auto: true });
        } else again = true;
      } else if (Math.abs(velocity.current) > STOP_VELOCITY) {
        frame.current += velocity.current;
        velocity.current *= FRICTION;
        again = true;
      } else velocity.current = 0;
      draw();
      if (again) raf.current = requestAnimationFrame(step);
      else raf.current = null;
    };
    raf.current = requestAnimationFrame(step);
  }, [draw, n, dir, spin.coverFrame, stopLoop]);

  // One automatic full turn on first appearance (skipped under reduced motion or after interaction)
  useEffect(() => {
    if (mode !== "drag" || interacted || prefersReducedMotion()) return;
    if (!loader.done && loader.loaded < Math.min(8, n)) return;
    if (fullTurnStart.current !== null) return;
    const started = sessionStorage.getItem(`idya:auto-turn:${spin.baseUrl}`);
    if (started) return;
    sessionStorage.setItem(`idya:auto-turn:${spin.baseUrl}`, "1");
    fullTurnStart.current = nowMs();
    loop();
  }, [loader.done, loader.loaded, interacted, mode, n, spin.baseUrl, loop]);

  useEffect(() => stopLoop, [stopLoop]);

  // First-visit hint (decided in a frame callback so the server render stays hint-free)
  useEffect(() => {
    if (mode !== "drag" || minimal) return;
    const id = requestAnimationFrame(() => {
      let seen = false;
      try {
        seen = Boolean(localStorage.getItem(HINT_KEY));
      } catch {
        seen = false;
      }
      setHintVisible(!seen);
    });
    return () => cancelAnimationFrame(id);
  }, [mode, minimal]);

  const markInteracted = useCallback(() => {
    if (!interacted) {
      setInteracted(true);
      track("spin_interacted");
    }
    fullTurnStart.current = null;
    if (hintVisible) {
      setHintVisible(false);
      try {
        localStorage.setItem(HINT_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  }, [interacted, hintVisible]);

  // Pointer drag with inertia — full viewer width = one full rotation
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const drag = useRef<{ startX: number; startFrame: number; samples: { t: number; f: number }[]; pinchDist?: number; pinchZoom?: number; panStart?: { x: number; y: number } } | null>(null);
  const turnedFrames = useRef(0);

  const onPointerDown = (e: React.PointerEvent) => {
    if (mode !== "drag") return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    stopLoop();
    velocity.current = 0;
    markInteracted();
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      drag.current = { startX: 0, startFrame: frame.current, samples: [], pinchDist: Math.hypot(a.x - b.x, a.y - b.y), pinchZoom: zoomRef.current };
    } else {
      drag.current = { startX: e.clientX, startFrame: frame.current, samples: [{ t: nowMs(), f: frame.current }], panStart: { ...pan.current } };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || mode !== "drag") return;
    const pt = pointers.current.get(e.pointerId);
    if (!pt) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const width = containerRef.current?.clientWidth ?? 1;
    if (pointers.current.size === 2 && drag.current.pinchDist) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      applyZoom((drag.current.pinchZoom ?? 1) * (d / drag.current.pinchDist));
      return;
    }
    if (zoomRef.current > 1.05 && drag.current.panStart) {
      // while zoomed, drag pans
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      pan.current = { x: drag.current.panStart.x + (e.clientX - drag.current.startX) * dpr, y: drag.current.panStart.y + (e.clientY - pt.y) * dpr + (pan.current.y - drag.current.panStart.y) };
      draw();
      return;
    }
    const dx = e.clientX - drag.current.startX;
    frame.current = drag.current.startFrame + (dx / width) * n * dir * -1;
    const now = nowMs();
    drag.current.samples.push({ t: now, f: frame.current });
    drag.current.samples = drag.current.samples.filter((s) => now - s.t <= 80);
    turnedFrames.current += Math.abs(frame.current - (drag.current.samples.at(-2)?.f ?? frame.current));
    if (turnedFrames.current >= n) {
      turnedFrames.current = 0;
      track("spin_completed", { auto: false });
    }
    draw();
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (!drag.current) return;
    if (pointers.current.size === 0) {
      const s = drag.current.samples;
      if (s.length >= 2 && zoomRef.current <= 1.05) {
        const first = s[0];
        const last = s[s.length - 1];
        const dt = Math.max(1, last.t - first.t);
        // frames per 60 fps tick
        velocity.current = ((last.f - first.f) / dt) * (1000 / 60);
        if (Math.abs(velocity.current) > STOP_VELOCITY) loop();
      }
      drag.current = null;
    }
  };

  const applyZoom = (next: number, focus?: { x: number; y: number }) => {
    const z = Math.max(1, Math.min(MAX_ZOOM, next));
    void focus;
    zoomRef.current = z;
    setZoom(z);
    if (z <= 1.05) pan.current = { x: 0, y: 0 };
    else if (spin.sizes.includes("xl")) {
      const idx = normalizeFrame(frame.current, n);
      if (!xlCache.current.has(idx)) {
        loadFrame(spinFrameUrl(spin, "xl", format, idx)).then((bmp) => {
          xlCache.current.set(idx, bmp);
          draw();
        }).catch(() => undefined);
      }
    }
    draw();
  };

  const onWheel = (e: React.WheelEvent) => {
    if (mode !== "drag" || !e.ctrlKey) return;
    e.preventDefault();
    markInteracted();
    applyZoom(zoomRef.current * (e.deltaY < 0 ? 1.1 : 0.9));
  };
  const lastTap = useRef(0);
  const onDoubleTap = () => {
    markInteracted();
    applyZoom(zoomRef.current > 1.05 ? 1 : 2);
  };
  const onPointerDownTap = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") {
      const now = nowMs();
      if (now - lastTap.current < 300) onDoubleTap();
      lastTap.current = now;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (mode !== "drag") return;
    const quarter = n / 4;
    let delta = 0;
    if (e.key === "ArrowLeft") delta = e.shiftKey ? -quarter : -1;
    else if (e.key === "ArrowRight") delta = e.shiftKey ? quarter : 1;
    else if (e.key === "Home") {
      frame.current = 0;
      markInteracted();
      draw();
      e.preventDefault();
      return;
    } else if (e.key === "Escape" && fullscreen) {
      toggleFullscreen();
      return;
    } else return;
    e.preventDefault();
    markInteracted();
    stopLoop();
    frame.current += delta * dir;
    draw();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      setFullscreen(false);
      return;
    }
    if (el.requestFullscreen) {
      el.requestFullscreen().then(() => setFullscreen(true)).catch(() => setFullscreen((v) => !v));
    } else {
      // iOS Safari: fixed overlay fallback
      setFullscreen((v) => !v);
    }
  };
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
      requestAnimationFrame(draw);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [draw]);
  useEffect(() => {
    const ro = new ResizeObserver(() => draw());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  const posterUrl = useMemo(() => spinFrameUrl(spin, size, "webp", spin.coverFrame), [spin, size]);
  const progressPct = Math.round(loader.progress * 100);
  const ringRadius = 14;
  const ringC = 2 * Math.PI * ringRadius;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-hero bg-studio-bottom studio-bg",
        fullscreen && "fixed inset-0 z-[70] flex items-center justify-center rounded-none bg-bg",
        className,
      )}
    >
      <div
        ref={containerRef}
        role="img"
        aria-label={t("spinLabel", { title })}
        tabIndex={mode === "drag" ? 0 : -1}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          onPointerDownTap(e);
          onPointerDown(e);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={onDoubleTap}
        className={cn(
          "relative w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-red-text",
          aspect === "16/9" ? "aspect-video" : "aspect-[4/3]",
          fullscreen && "max-h-full aspect-auto h-full",
          mode === "drag" && (zoom > 1.05 ? "cursor-move" : "cursor-grab active:cursor-grabbing"),
        )}
        style={{ touchAction: mode === "drag" ? "pan-y" : "auto" }}
      >
        {/* LQIP → sharp poster until the first frame is drawn */}
        {loader.loaded === 0 && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- canvas frames are outside next/image (brief §19) */}
            <img src={spin.lqip} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-105 object-cover blur-xl" />
            {/* eslint-disable-next-line @next/next/no-img-element -- same */}
            <img src={posterUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
          </>
        )}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />

        {/* First-visit hint */}
        {hintVisible && mode === "drag" && (
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-8">
            <span className="glass-1 flex items-center gap-2 rounded-pill px-4 py-2 text-small text-text">
              <Hand className="size-4" strokeWidth={1.5} aria-hidden />
              {t("dragHint")}
            </span>
          </div>
        )}
      </div>

      {/* Progress ring */}
      {active && !loader.done && (
        <div className="absolute left-4 top-4 flex items-center gap-2 text-caption text-text-2" role="status" aria-label={t("loadingSpin", { percent: progressPct })}>
          <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90">
            <circle cx="18" cy="18" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
            <circle cx="18" cy="18" r={ringRadius} fill="none" stroke="var(--color-red)" strokeWidth="2" strokeDasharray={ringC} strokeDashoffset={ringC * (1 - loader.progress)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 150ms var(--ease-out)" }} />
          </svg>
        </div>
      )}

      {/* Toolbar */}
      {!minimal && mode === "drag" && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <IconButton label={t("zoomOut")} onClick={() => applyZoom(zoomRef.current / 1.5)} disabled={zoom <= 1}>
            <ZoomOut strokeWidth={1.5} />
          </IconButton>
          <IconButton label={t("zoomIn")} onClick={() => applyZoom(zoomRef.current * 1.5)} disabled={zoom >= MAX_ZOOM}>
            <ZoomIn strokeWidth={1.5} />
          </IconButton>
          <IconButton label={fullscreen ? t("exitFullscreen") : t("fullscreen")} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize strokeWidth={1.5} /> : <Expand strokeWidth={1.5} />}
          </IconButton>
        </div>
      )}
      {!minimal && onShowPhotos && (
        <button type="button" onClick={onShowPhotos} className="absolute bottom-4 left-4 rounded-pill px-3 py-1.5 text-caption text-text-2 underline-offset-4 hover:text-text hover:underline">
          {t("showPhotos")}
        </button>
      )}
    </div>
  );
}

export { SPIN_WIDTHS };
