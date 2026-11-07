"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { spinFrameUrl } from "@/lib/vehicles/media";
import type { ImageFormat, SpinSet, SpinSize } from "@/lib/vehicles/types";
import { bisectionOrder } from "./support";

export type FrameBitmap = ImageBitmap | HTMLImageElement;

interface LoaderState {
  loaded: number;
  progress: number;
  done: boolean;
}

const CONCURRENCY = 6;

async function decode(url: string): Promise<FrameBitmap> {
  if ("createImageBitmap" in window) {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error(`frame ${url}: ${res.status}`);
    const blob = await res.blob();
    return createImageBitmap(blob);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Loads a spin set in bisection order with bounded concurrency, exposes the nearest loaded
 * frame for any index, and releases bitmaps on unmount (brief §9 loading strategy).
 */
export function useSpinLoader(spin: SpinSet, size: SpinSize, format: ImageFormat, active: boolean) {
  const n = spin.frameCount;
  const framesRef = useRef<(FrameBitmap | null)[]>(Array.from({ length: n }, () => null));
  const [state, setState] = useState<LoaderState>({ loaded: 0, progress: 0, done: false });
  const startedRef = useRef<string | null>(null);
  const onFrameRef = useRef<(() => void) | null>(null);

  const nearest = useCallback(
    (index: number): { frame: FrameBitmap | null; index: number } => {
      const frames = framesRef.current;
      const i = ((Math.round(index) % n) + n) % n;
      if (frames[i]) return { frame: frames[i], index: i };
      for (let d = 1; d <= n / 2; d++) {
        const a = (i + d) % n;
        const b = (i - d + n) % n;
        if (frames[b]) return { frame: frames[b], index: b };
        if (frames[a]) return { frame: frames[a], index: a };
      }
      return { frame: null, index: i };
    },
    [n],
  );

  useEffect(() => {
    if (!active) return;
    const key = `${spin.baseUrl}/${spin.version}/${size}/${format}`;
    if (startedRef.current === key) return;
    startedRef.current = key;
    let cancelled = false;
    const order = bisectionOrder(n);
    let cursor = 0;
    let loaded = 0;
    // Reset frames when switching size (e.g. container resize); keep old frames as fallback until replaced
    const run = async () => {
      while (cursor < order.length && !cancelled) {
        const idx = order[cursor++];
        try {
          const bmp = await decode(spinFrameUrl(spin, size, format, idx));
          if (cancelled) {
            if ("close" in bmp) bmp.close();
            return;
          }
          const prev = framesRef.current[idx];
          if (prev && "close" in prev) prev.close();
          framesRef.current[idx] = bmp;
          loaded++;
          onFrameRef.current?.();
          setState({ loaded, progress: loaded / n, done: loaded >= n });
        } catch {
          // network hiccup: skip the frame; nearest-loaded fallback covers it
        }
      }
    };
    const workers = Array.from({ length: Math.min(CONCURRENCY, n) }, run);
    void Promise.all(workers);
    return () => {
      cancelled = true;
    };
  }, [active, spin, size, format, n]);

  useEffect(() => {
    const frames = framesRef.current;
    return () => {
      for (const f of frames) if (f && "close" in f) f.close();
    };
  }, []);

  return { ...state, nearest, setOnFrame: (fn: (() => void) | null) => (onFrameRef.current = fn) };
}

/** Loads a single frame (used for the xl zoom frame). */
export function loadFrame(url: string): Promise<FrameBitmap> {
  return decode(url);
}
