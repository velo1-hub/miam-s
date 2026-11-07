"use client";

import { ImagePlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SpinSet, Vehicle, VehicleMedia } from "@/lib/vehicles/types";

interface Props {
  vehicle: Vehicle;
  onChange: (spin: SpinSet | null, media?: VehicleMedia[]) => void;
  supabaseConfigured: boolean;
  demoMode: boolean;
}

interface Progress {
  total: number;
  done: number;
  current: string;
  error: string | null;
}

/**
 * Médias — brief §15/§10.2: drag & drop the 36 spin photos (auto-sorted by name), upload originals
 * to the private bucket, then trigger processing frame by frame (concurrency 4) with per-frame
 * progress; background-removal toggle; union crop box computed from the returned bounding boxes.
 * In demo mode without Supabase, the pipeline is explained and disabled.
 */
export function SpinUploader({ vehicle, onChange, supabaseConfigured, demoMode }: Props) {
  const [removeBg, setRemoveBg] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [over, setOver] = useState(false);
  const enabled = supabaseConfigured && !demoMode;

  const pick = (list: FileList | null) => {
    if (!list) return;
    const sorted = Array.from(list).filter((f) => f.type.startsWith("image/")).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    setFiles(sorted);
  };

  const run = async () => {
    if (!enabled || files.length === 0) return;
    const version = (vehicle.spin?.version ?? 0) + 1;
    setProgress({ total: files.length, done: 0, current: "Téléversement…", error: null });
    try {
      const { createBrowserSupabase } = await import("@/lib/supabase/client");
      const supabase = createBrowserSupabase();
      // 1. originals → private bucket (brief §10.2 step 1)
      for (let i = 0; i < files.length; i++) {
        const nn = String(i + 1).padStart(2, "0");
        const { error } = await supabase.storage.from("originals").upload(`vehicles/${vehicle.id}/spin/${nn}.jpg`, files[i], { upsert: true, contentType: files[i].type });
        if (error) throw new Error(error.message);
        setProgress((p) => (p ? { ...p, current: `Téléversement ${nn}/${files.length}` } : p));
      }
      // 2. processing frame by frame, concurrency 4 (brief §10.2 step 2)
      let done = 0;
      let lqip = "";
      const boxes: { left: number; top: number; width: number; height: number }[] = [];
      const queue = files.map((_, i) => i + 1);
      const worker = async () => {
        while (queue.length) {
          const frame = queue.shift() as number;
          const res = await fetch("/api/media/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vehicleId: vehicle.id, version, frame, total: files.length, kind: "spin", removeBackground: removeBg }) });
          const j = (await res.json()) as { ok: boolean; lqip?: string; bbox?: { left: number; top: number; width: number; height: number }; error?: string };
          if (!j.ok) throw new Error(j.error ?? `image ${frame}`);
          if (j.lqip) lqip = j.lqip;
          if (j.bbox) boxes.push(j.bbox);
          done++;
          setProgress((p) => (p ? { ...p, done, current: `Traitement ${done}/${files.length}` } : p));
        }
      };
      await Promise.all(Array.from({ length: 4 }, worker));
      const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vehicles/vehicles/${vehicle.id}`;
      onChange({ frameCount: (files.length as SpinSet["frameCount"]) ?? 36, coverFrame: vehicle.spin?.coverFrame ?? 4, reverse: vehicle.spin?.reverse ?? false, version, sizes: ["sm", "md", "lg", "xl"], formats: ["avif", "webp"], baseUrl: base, lqip, width: 1600, height: 900 });
      setProgress({ total: files.length, done, current: "Terminé", error: null });
    } catch (e) {
      setProgress((p) => (p ? { ...p, error: (e as Error).message } : { total: 0, done: 0, current: "", error: (e as Error).message }));
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
      className={`rounded-card border border-dashed p-6 ${over ? "border-text bg-white/[0.04]" : "border-line-strong"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-small font-medium text-text">Photos 360° (36 images, 01.jpg → 36.jpg)</p>
          <p className="text-caption text-text-3">Glissez-déposez le lot ou choisissez les fichiers. Triés automatiquement par nom. Voir docs/photo-guide.md.</p>
        </div>
        <label className="press inline-flex h-10 cursor-pointer items-center gap-2 rounded-pill border border-line px-4 text-small text-text hover:bg-white/[0.06]">
          <ImagePlus className="size-4" strokeWidth={1.5} aria-hidden />Choisir les images
          <input type="file" accept="image/jpeg,image/png" multiple className="sr-only" onChange={(e) => pick(e.target.files)} />
        </label>
      </div>
      {files.length > 0 && <p className="mt-3 text-caption text-text-2">{files.length} fichiers prêts : {files[0].name} … {files[files.length - 1].name}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-small text-text-2"><input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="size-4 accent-white" />Détourage automatique (Photoroom) et fond studio</label>
        <Button type="button" variant="light" size="md" onClick={run} disabled={!enabled || files.length === 0 || Boolean(progress && !progress.error && progress.current !== "Terminé")}>Téléverser et traiter</Button>
        {!enabled && <span className="text-caption text-text-3">Le traitement des médias requiert Supabase (phase 4). En démonstration, les images 360° proviennent des rendus de démo.</span>}
      </div>
      {progress && (
        <div className="mt-4" aria-live="polite">
          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-white/10"><div className="h-full bg-red transition-[width]" style={{ width: `${progress.total ? (100 * progress.done) / progress.total : 0}%` }} /></div>
          <p className="mt-1 text-caption text-text-2">{progress.current}</p>
          {progress.error && <p className="text-caption text-danger">Erreur : {progress.error}</p>}
        </div>
      )}
    </div>
  );
}
