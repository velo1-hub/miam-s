"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { scrubFrames, spinFrameUrl } from "@/lib/vehicles/media";
import type { SpinSet } from "@/lib/vehicles/types";

interface Props {
  spin: SpinSet;
  alt: string;
  className?: string;
  sizes?: string;
  /** Rendered as the resting image (next/image or plain) */
  children: React.ReactNode;
}

/**
 * Card hover scrub — brief §7: moving the mouse horizontally across the image scrubs through
 * 12 low-res frames, loaded on first hover. Pointer-only (hover: hover); touch keeps the cover.
 */
export function SpinScrub({ spin, alt, className, children }: Props) {
  const frames = useRef<HTMLImageElement[] | null>(null);
  const [ready, setReady] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const indices = useMemo(() => scrubFrames(spin, 12), [spin]);

  const preload = useCallback(() => {
    if (frames.current) return;
    const list = indices.map((i) => {
      const img = new Image();
      img.decoding = "async";
      img.src = spinFrameUrl(spin, "sm", "webp", i);
      return img;
    });
    frames.current = list;
    let loaded = 0;
    list.forEach((img) => {
      const done = () => {
        loaded++;
        if (loaded === list.length) setReady(true);
      };
      if (img.complete) done();
      else {
        img.onload = done;
        img.onerror = done;
      }
    });
  }, [spin, indices]);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ready) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const i = Math.max(0, Math.min(11, Math.floor(x * 12)));
    setSrc(frames.current?.[i]?.src ?? null);
  };

  return (
    <div
      className={cn("relative h-full w-full", className)}
      onPointerEnter={(e) => e.pointerType === "mouse" && preload()}
      onPointerMove={onMove}
      onPointerLeave={() => setSrc(null)}
    >
      {children}
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- decoded frames, swapped without re-fetch
        <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      ) : null}
    </div>
  );
}
