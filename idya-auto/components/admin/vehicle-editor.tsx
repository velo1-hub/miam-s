"use client";

import { Sparkles, Trash2, UploadCloud, Wand2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteVehicleAction, draftDescriptionAction, publishVehicleAction, saveVehicleAction } from "@/app/admin/actions";
import { Car360 } from "@/components/car360/car360";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Settings } from "@/lib/settings/types";
import { cn } from "@/lib/utils/cn";
import { coverImage } from "@/lib/vehicles/media";
import { BODY_TYPES, CONDITIONS, DRIVETRAINS, FEATURE_GROUPS, FUEL_TYPES, TRANSMISSIONS, VEHICLE_STATUSES, WARRANTY_CLASSES, type FeatureKey, type Vehicle } from "@/lib/vehicles/types";
import { SpinUploader } from "./spin-uploader";

type Tab = "infos" | "prix" | "medias" | "description" | "caracteristiques" | "garantie" | "publication";
const TABS: [Tab, string][] = [["infos", "Infos"], ["prix", "Prix"], ["medias", "Médias"], ["description", "Description"], ["caracteristiques", "Caractéristiques"], ["garantie", "Garantie et historique"], ["publication", "Publication"]];
const FEATURE_FR: Record<FeatureKey, string> = { remote_start: "Démarreur à distance", heated_seats: "Sièges chauffants", heated_steering: "Volant chauffant", ventilated_seats: "Sièges ventilés", sunroof: "Toit ouvrant", carplay_android: "Apple CarPlay / Android Auto", backup_camera: "Caméra de recul", winter_tires: "Pneus d’hiver inclus", blind_spot: "Surveillance des angles morts", adaptive_cruise: "Régulateur adaptatif", lane_keep: "Aide au maintien de voie", leather: "Sièges en cuir", navigation: "Navigation", third_row: "Troisième rangée", tow_package: "Ensemble remorquage", keyless: "Accès sans clé", wireless_charging: "Recharge sans fil", premium_audio: "Audio haut de gamme", led_headlights: "Phares à DEL", power_tailgate: "Hayon électrique", parking_sensors: "Capteurs de stationnement", heads_up_display: "Affichage tête haute" };
const GROUP_FR = { comfort: "Confort", tech: "Technologie", safety: "Sécurité", utility: "Utilitaire" } as const;
const STATUS_FR = { draft: "Brouillon", available: "Disponible", pending: "Réservé", sold: "Vendu", archived: "Archivé" } as const;

const field = "no-red h-10 w-full rounded-input border border-line bg-surface px-3 text-admin text-text outline-none focus:border-text";
const area = "no-red w-full rounded-input border border-line bg-surface px-3 py-2 text-admin text-text outline-none focus:border-text";
const lbl = "flex flex-col gap-1 text-caption text-text-3";

interface Props {
  initial: Vehicle;
  settings: Settings;
  canDelete: boolean;
  demoMode: boolean;
  aiEnabled: boolean;
  supabaseConfigured: boolean;
}

/** Vehicle editor — brief §15 tabs, autosave of drafts (debounced), VIN decode, AI description, publish validation. */
export function VehicleEditor({ initial, settings, canDelete, demoMode, aiEnabled, supabaseConfigured }: Props) {
  const [v, setV] = useState<Vehicle>(initial);
  const [tab, setTab] = useState<Tab>("infos");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [problems, setProblems] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const timer = useRef<number | null>(null);

  const set = <K extends keyof Vehicle>(k: K, val: Vehicle[K]) => {
    setV((cur) => ({ ...cur, [k]: val }));
    setDirty(true);
  };

  // Autosave 1.5 s after the last change
  useEffect(() => {
    if (!dirty) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSaving("saving");
      saveVehicleAction(v).then((r) => {
        if (r.ok) {
          setV((cur) => ({ ...cur, slug: r.vehicle.slug, updatedAt: r.vehicle.updatedAt }));
          setSaving("saved");
          setDirty(false);
        } else setSaving("error");
      });
    }, 1500);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [v, dirty]);

  const decodeVin = async () => {
    if (!v.vin || v.vin.length !== 17) return toast({ title: "Entrez un NIV de 17 caractères." });
    const res = await fetch(`/api/admin/vin?vin=${encodeURIComponent(v.vin)}`);
    const j = (await res.json()) as { ok: boolean; year?: number; make?: string; model?: string; trim?: string; engine?: string; bodyType?: Vehicle["bodyType"]; fuelType?: Vehicle["fuelType"]; drivetrain?: Vehicle["drivetrain"]; doors?: number; error?: string };
    if (!j.ok) return toast({ title: "Décodage impossible", description: j.error });
    setV((cur) => ({ ...cur, year: j.year ?? cur.year, make: j.make ?? cur.make, model: j.model ?? cur.model, trim: j.trim ?? cur.trim, engine: j.engine ?? cur.engine, bodyType: j.bodyType ?? cur.bodyType, fuelType: j.fuelType ?? cur.fuelType, drivetrain: j.drivetrain ?? cur.drivetrain, doors: j.doors ?? cur.doors }));
    setDirty(true);
    toast({ title: "NIV décodé", description: `${j.year ?? ""} ${j.make ?? ""} ${j.model ?? ""}` });
  };

  const draft = () =>
    start(async () => {
      const r = await draftDescriptionAction(v);
      if (!r) return toast({ title: "IA indisponible", description: "Configurez ANTHROPIC_API_KEY." });
      set("descriptionFr", r.fr);
      set("descriptionEn", r.en);
    });

  const publish = () =>
    start(async () => {
      const r = await publishVehicleAction(v.id);
      if (r.ok) {
        setProblems([]);
        setV((cur) => ({ ...cur, status: "available", publishedAt: cur.publishedAt ?? new Date().toISOString() }));
        toast({ title: "Véhicule publié" });
        router.refresh();
      } else setProblems(r.problems);
    });

  const cover = coverImage(v);
  const num = (s: string) => (s === "" ? null : Number(s));

  return (
    <div className="no-red flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-caption text-text-3">Véhicule · {STATUS_FR[v.status]} {v.stockNumber ? `· stock ${v.stockNumber}` : ""}</p>
          <h1 className="text-h2">{[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ") || "Nouveau véhicule"}</h1>
        </div>
        <div className="flex items-center gap-3 text-caption text-text-3">
          <span aria-live="polite">{saving === "saving" ? "Enregistrement…" : saving === "saved" ? "Brouillon enregistré" : saving === "error" ? "Erreur d’enregistrement" : ""}</span>
          {v.status !== "available" && <Button variant="light" size="md" onClick={publish} disabled={pending}>Publier</Button>}
        </div>
      </div>
      {problems.length > 0 && (
        <div role="alert" className="rounded-card-sm border border-danger/40 bg-danger/10 p-4 text-small">
          <p className="font-medium text-danger">Publication impossible. Manque :</p>
          <ul className="mt-1 list-disc pl-5 text-text-2">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}
      <div role="tablist" aria-label="Sections" className="hide-scrollbar flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-small", tab === k ? "border-text text-text" : "border-transparent text-text-2 hover:text-text")}>{label}</button>
        ))}
      </div>

      {tab === "infos" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className={cn(lbl, "xl:col-span-2")}>NIV
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={v.vin ?? ""} onChange={(e) => set("vin", e.target.value.toUpperCase().slice(0, 17) || null)} maxLength={17} className={cn(field, "font-mono uppercase")} />
              <Button type="button" variant="secondary" size="md" onClick={decodeVin} className="shrink-0"><Wand2 strokeWidth={1.5} aria-hidden />Décoder le NIV</Button>
            </div>
          </label>
          <label className={lbl}>Numéro de stock<input value={v.stockNumber} onChange={(e) => set("stockNumber", e.target.value)} className={field} /></label>
          <label className={lbl}>Année<input type="number" value={v.year} onChange={(e) => set("year", Number(e.target.value))} className={field} /></label>
          <label className={lbl}>Marque<input value={v.make} onChange={(e) => set("make", e.target.value)} className={field} /></label>
          <label className={lbl}>Modèle<input value={v.model} onChange={(e) => set("model", e.target.value)} className={field} /></label>
          <label className={lbl}>Version<input value={v.trim ?? ""} onChange={(e) => set("trim", e.target.value || null)} className={field} /></label>
          <label className={lbl}>État<select value={v.condition} onChange={(e) => set("condition", e.target.value as Vehicle["condition"])} className={field}>{CONDITIONS.map((c) => <option key={c} value={c}>{{ new: "Neuf", used: "Occasion", certified: "Certifié" }[c]}</option>)}</select></label>
          <label className={lbl}>Carrosserie<select value={v.bodyType} onChange={(e) => set("bodyType", e.target.value as Vehicle["bodyType"])} className={field}>{BODY_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}</select></label>
          <label className={lbl}>Motricité<select value={v.drivetrain ?? ""} onChange={(e) => set("drivetrain", (e.target.value || null) as Vehicle["drivetrain"])} className={field}><option value="">—</option>{DRIVETRAINS.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
          <label className={lbl}>Transmission<select value={v.transmission ?? ""} onChange={(e) => set("transmission", (e.target.value || null) as Vehicle["transmission"])} className={field}><option value="">—</option>{TRANSMISSIONS.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
          <label className={lbl}>Carburant<select value={v.fuelType ?? ""} onChange={(e) => set("fuelType", (e.target.value || null) as Vehicle["fuelType"])} className={field}><option value="">—</option>{FUEL_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}</select></label>
          <label className={lbl}>Moteur<input value={v.engine ?? ""} onChange={(e) => set("engine", e.target.value || null)} className={field} /></label>
          <label className={lbl}>Puissance (ch)<input type="number" value={v.horsepower ?? ""} onChange={(e) => set("horsepower", num(e.target.value))} className={field} /></label>
          <label className={lbl}>Autonomie électrique (km)<input type="number" value={v.electricRangeKm ?? ""} onChange={(e) => set("electricRangeKm", num(e.target.value))} className={field} /></label>
          <label className={lbl}>Kilométrage<input type="number" value={v.odometerKm} onChange={(e) => set("odometerKm", Number(e.target.value))} className={field} /></label>
          <label className={lbl}>Couleur extérieure<input value={v.exteriorColor ?? ""} onChange={(e) => set("exteriorColor", e.target.value || null)} className={field} /></label>
          <label className={lbl}>Code couleur (hex)<input value={v.exteriorColorHex ?? ""} onChange={(e) => set("exteriorColorHex", e.target.value || null)} placeholder="#1B2A4A" className={field} /></label>
          <label className={lbl}>Couleur intérieure<input value={v.interiorColor ?? ""} onChange={(e) => set("interiorColor", e.target.value || null)} className={field} /></label>
          <label className={lbl}>Portes<input type="number" value={v.doors ?? ""} onChange={(e) => set("doors", num(e.target.value))} className={field} /></label>
          <label className={lbl}>Places<input type="number" value={v.seats ?? ""} onChange={(e) => set("seats", num(e.target.value))} className={field} /></label>
        </div>
      )}

      {tab === "prix" && (
        <div className="grid max-w-xl gap-4">
          <label className={lbl}>Prix tout inclus (sans taxes) — comprend tous les frais (brief §17.1)<input type="number" value={v.priceCad || ""} onChange={(e) => set("priceCad", Number(e.target.value))} className={field} /></label>
          <label className={lbl}>Ancien prix (uniquement s’il a réellement été affiché)<input type="number" value={v.previousPriceCad ?? ""} onChange={(e) => set("previousPriceCad", num(e.target.value))} className={field} /></label>
        </div>
      )}

      {tab === "medias" && (
        <div className="flex flex-col gap-6">
          <SpinUploader vehicle={v} onChange={(spin, media) => { set("spin", spin); if (media) set("media", media); }} supabaseConfigured={supabaseConfigured} demoMode={demoMode} />
          {v.spin && (
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div>
                <p className="mb-2 text-caption text-text-3">Aperçu 360° en direct</p>
                <Car360 spin={v.spin} title={`${v.year} ${v.make} ${v.model}`} eager />
              </div>
              <div className="flex flex-col gap-4">
                <label className={lbl}>Image de couverture (angle)
                  <select value={v.spin.coverFrame} onChange={(e) => set("spin", { ...v.spin!, coverFrame: Number(e.target.value) })} className={field}>
                    {Array.from({ length: v.spin.frameCount }, (_, i) => <option key={i} value={i}>{i + 1} — {Math.round((i * 360) / v.spin!.frameCount)}°</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-small text-text"><input type="checkbox" checked={v.spin.reverse} onChange={(e) => set("spin", { ...v.spin!, reverse: e.target.checked })} className="size-4 accent-white" />Inverser le sens de rotation</label>
                {cover && <Image src={cover.src} alt="" width={cover.width} height={cover.height} sizes="320px" className="rounded-card-sm" />}
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 text-caption text-text-3">Photos intérieures et galerie ({v.media.length})</p>
            <ul className="flex flex-wrap gap-2">
              {v.media.map((m) => (
                <li key={m.src} className="relative h-20 w-28 overflow-hidden rounded-chip bg-studio-bottom">
                  <Image src={m.src} alt={m.altFr} width={224} height={160} sizes="112px" className="h-full w-full object-cover" />
                  <button type="button" aria-label="Retirer" onClick={() => set("media", v.media.filter((x) => x.src !== m.src))} className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-pill bg-bg/80 text-text"><Trash2 className="size-3" strokeWidth={1.5} aria-hidden /></button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "description" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <label className={cn(lbl, "lg:col-span-2")}>
            <span className="flex items-center justify-between">Description FR (obligatoire) · EN
              <Button type="button" variant="secondary" size="sm" onClick={draft} disabled={pending || !aiEnabled} title={aiEnabled ? "" : "ANTHROPIC_API_KEY requis"}><Sparkles strokeWidth={1.5} aria-hidden />Rédiger avec l’IA</Button>
            </span>
          </label>
          <label className={lbl}>Français<textarea rows={10} value={v.descriptionFr} onChange={(e) => set("descriptionFr", e.target.value)} className={area} /></label>
          <label className={lbl}>English<textarea rows={10} value={v.descriptionEn ?? ""} onChange={(e) => set("descriptionEn", e.target.value || null)} className={area} /></label>
        </div>
      )}

      {tab === "caracteristiques" && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(FEATURE_GROUPS) as (keyof typeof FEATURE_GROUPS)[]).map((g) => (
            <fieldset key={g}>
              <legend className="mb-2 text-caption uppercase tracking-[0.08em] text-text-3">{GROUP_FR[g]}</legend>
              <ul className="flex flex-col gap-1.5">
                {FEATURE_GROUPS[g].map((k) => (
                  <li key={k}><label className="flex items-center gap-2 text-small text-text-2 hover:text-text"><input type="checkbox" checked={v.features.includes(k)} onChange={(e) => set("features", e.target.checked ? [...v.features, k] : v.features.filter((x) => x !== k))} className="size-4 accent-white" />{FEATURE_FR[k]}</label></li>
                ))}
              </ul>
            </fieldset>
          ))}
        </div>
      )}

      {tab === "garantie" && (
        <div className="grid max-w-3xl gap-4">
          <label className={lbl}>Catégorie de garantie légale (Québec) · suggestion selon âge/km : {suggestClass(v)}
            <select value={v.warrantyClass ?? ""} onChange={(e) => set("warrantyClass", (e.target.value || null) as Vehicle["warrantyClass"])} className={field}><option value="">— (neuf / non applicable)</option>{WARRANTY_CLASSES.map((c) => <option key={c} value={c}>Catégorie {c}</option>)}</select>
          </label>
          {v.warrantyClass && <p className="text-small text-text-2">{settings.warranty[v.warrantyClass].fr}</p>}
          <label className={lbl}>Garantie du fabricant (FR)<textarea rows={2} value={v.manufacturerWarrantyFr ?? ""} onChange={(e) => set("manufacturerWarrantyFr", e.target.value || null)} className={area} /></label>
          <label className={lbl}>Manufacturer warranty (EN)<textarea rows={2} value={v.manufacturerWarrantyEn ?? ""} onChange={(e) => set("manufacturerWarrantyEn", e.target.value || null)} className={area} /></label>
          <label className={lbl}>Lien CARFAX Canada<input value={v.carfaxUrl ?? ""} onChange={(e) => set("carfaxUrl", e.target.value || null)} className={field} /></label>
          <label className={lbl}>Accidents déclarés<select value={v.accidentFree === null ? "" : v.accidentFree ? "no" : "yes"} onChange={(e) => set("accidentFree", e.target.value === "" ? null : e.target.value === "no")} className={field}><option value="">Non renseigné</option><option value="no">Aucun accident</option><option value="yes">Accident(s) déclaré(s)</option></select></label>
          <label className={lbl}>Nombre de propriétaires<input type="number" value={v.ownersCount ?? ""} onChange={(e) => set("ownersCount", num(e.target.value))} className={field} /></label>
        </div>
      )}

      {tab === "publication" && (
        <div className="grid max-w-xl gap-4">
          <label className={lbl}>Statut<select value={v.status} onChange={(e) => set("status", e.target.value as Vehicle["status"])} className={field}>{VEHICLE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_FR[s]}</option>)}</select></label>
          <label className="flex items-center gap-2 text-small text-text"><input type="checkbox" checked={v.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4 accent-white" />Véhicule vedette de l’accueil (scène 360°)</label>
          <label className={lbl}>Publication programmée<input type="datetime-local" value={v.publishedAt ? v.publishedAt.slice(0, 16) : ""} onChange={(e) => set("publishedAt", e.target.value ? new Date(e.target.value).toISOString() : null)} className={field} /></label>
          <p className="text-caption text-text-3">Validation à la publication : NIV, prix, km, description FR et au moins 24 images 360° ou 8 photos.</p>
          {canDelete && (
            <form action={deleteVehicleAction.bind(null, v.id)} onSubmit={(e) => { if (!confirm("Supprimer définitivement ce véhicule ?")) e.preventDefault(); }}>
              <Button type="submit" variant="danger" size="md"><Trash2 strokeWidth={1.5} aria-hidden />Supprimer le véhicule</Button>
            </form>
          )}
        </div>
      )}
      <p className="text-caption text-text-3"><UploadCloud className="mr-1 inline size-3" strokeWidth={1.5} aria-hidden />Les modifications sont enregistrées automatiquement en brouillon.</p>
    </div>
  );
}

/** Legal warranty suggestion (Phase 0 review C6): A ≤ 2 yrs & ≤ 40 000 km · B ≤ 3 yrs & ≤ 60 000 km · C ≤ 5 yrs & ≤ 80 000 km · D otherwise. */
function suggestClass(v: Vehicle): string {
  const age = new Date().getFullYear() - v.year;
  if (v.condition === "new") return "—";
  if (age <= 2 && v.odometerKm <= 40_000) return "A";
  if (age <= 3 && v.odometerKm <= 60_000) return "B";
  if (age <= 5 && v.odometerKm <= 80_000) return "C";
  return "D";
}
