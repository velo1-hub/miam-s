"use client";

import { useState, useTransition } from "react";
import { saveSettingsAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Settings, Weekday } from "@/lib/settings/types";
import { cn } from "@/lib/utils/cn";

const DAYS: [Weekday, string][] = [[1, "Lundi"], [2, "Mardi"], [3, "Mercredi"], [4, "Jeudi"], [5, "Vendredi"], [6, "Samedi"], [0, "Dimanche"]];
const field = "no-red h-10 w-full rounded-input border border-line bg-surface px-3 text-admin text-text outline-none focus:border-text";
const area = "no-red w-full rounded-input border border-line bg-surface px-3 py-2 text-admin text-text outline-none focus:border-text";
const lbl = "flex flex-col gap-1 text-caption text-text-3";

export function SettingsForm({ initial, vehicles, supabaseConfigured }: { initial: Settings; vehicles: { id: string; title: string }[]; supabaseConfigured: boolean }) {
  const [s, setS] = useState<Settings>(initial);
  const [pending, start] = useTransition();
  const toast = useToast();
  const patch = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((cur) => ({ ...cur, [k]: v }));
  const save = () => start(async () => { await saveSettingsAction(s); toast({ title: "Paramètres enregistrés", description: "Les pages publiques seront régénérées." }); });

  return (
    <div className="no-red flex flex-col gap-10">
      <div className="flex items-center justify-between"><h1 className="text-h2">Paramètres</h1><Button variant="light" size="md" onClick={save} disabled={pending}>Enregistrer</Button></div>

      <Section title="Entreprise">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {([["legalName", "Nom légal"], ["displayName", "Nom affiché"], ["city", "Ville"], ["addressLine1", "Adresse"], ["postalCode", "Code postal"], ["phone", "Téléphone (E.164, p. ex. +15145550123)"], ["email", "Courriel public"], ["leadsEmail", "Courriel de notification des leads"], ["mapsUrl", "Lien Google Maps"]] as const).map(([k, label]) => (
            <label key={k} className={lbl}>{label}<input value={s.business[k]} onChange={(e) => patch("business", { ...s.business, [k]: e.target.value })} className={field} /></label>
          ))}
          <label className={lbl}>Latitude<input value={s.business.lat ?? ""} onChange={(e) => patch("business", { ...s.business, lat: e.target.value ? Number(e.target.value) : null })} className={field} /></label>
          <label className={lbl}>Longitude<input value={s.business.lng ?? ""} onChange={(e) => patch("business", { ...s.business, lng: e.target.value ? Number(e.target.value) : null })} className={field} /></label>
          <label className={lbl}>Fiche Google (avis)<input value={s.business.googleBusinessUrl ?? ""} onChange={(e) => patch("business", { ...s.business, googleBusinessUrl: e.target.value || null })} className={field} /></label>
        </div>
      </Section>

      <Section title="Heures d’ouverture (America/Toronto)">
        <div className="grid gap-2 md:grid-cols-2">
          {DAYS.map(([d, name]) => (
            <div key={d} className="grid grid-cols-[6rem_1fr_1fr] items-center gap-2 text-small">
              <span className="text-text-2">{name}</span>
              <input type="time" value={s.hours[d].open ?? ""} onChange={(e) => patch("hours", { ...s.hours, [d]: { open: e.target.value || null, close: e.target.value ? s.hours[d].close : null } })} className={field} aria-label={`${name} ouverture`} />
              <input type="time" value={s.hours[d].close ?? ""} onChange={(e) => patch("hours", { ...s.hours, [d]: { ...s.hours[d], close: e.target.value || null } })} className={field} aria-label={`${name} fermeture`} />
            </div>
          ))}
        </div>
        <label className={cn(lbl, "mt-4")}>Fermetures (une par ligne : AAAA-MM-JJ, raison)
          <textarea rows={4} value={s.closures.map((c) => `${c.day}, ${c.reason}`).join("\n")} onChange={(e) => patch("closures", e.target.value.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [day, ...r] = l.split(","); return { day: day.trim(), reason: r.join(",").trim() }; }))} className={area} />
        </label>
      </Section>

      <Section title="Essais routiers">
        <div className="grid gap-4 md:grid-cols-4">
          <label className={lbl}>Durée d’une plage (min)<input type="number" value={s.booking.slotMinutes} onChange={(e) => patch("booking", { ...s.booking, slotMinutes: Number(e.target.value) })} className={field} /></label>
          <label className={lbl}>Capacité par plage<input type="number" value={s.booking.capacityPerSlot} onChange={(e) => patch("booking", { ...s.booking, capacityPerSlot: Number(e.target.value) })} className={field} /></label>
          <label className={lbl}>Délai minimal (h)<input type="number" value={s.booking.minLeadHours} onChange={(e) => patch("booking", { ...s.booking, minLeadHours: Number(e.target.value) })} className={field} /></label>
          <label className={lbl}>Horizon (jours)<input type="number" value={s.booking.horizonDays} onChange={(e) => patch("booking", { ...s.booking, horizonDays: Number(e.target.value) })} className={field} /></label>
        </div>
      </Section>

      <Section title="Financement et taxes (à valider par le comptable)">
        <div className="grid gap-4 md:grid-cols-4">
          <label className={lbl}>Taux annuel par défaut (%)<input type="number" step="0.01" value={s.finance.defaultRatePct} onChange={(e) => patch("finance", { ...s.finance, defaultRatePct: Number(e.target.value) })} className={field} /></label>
          <label className={lbl}>Durée par défaut (mois)<input type="number" value={s.finance.defaultTerm} onChange={(e) => patch("finance", { ...s.finance, defaultTerm: Number(e.target.value) })} className={field} /></label>
          <label className={lbl}>TPS (%)<input type="number" step="0.001" value={s.finance.gstPct} onChange={(e) => patch("finance", { ...s.finance, gstPct: Number(e.target.value) })} className={field} /></label>
          <label className={lbl}>TVQ (%)<input type="number" step="0.001" value={s.finance.qstPct} onChange={(e) => patch("finance", { ...s.finance, qstPct: Number(e.target.value) })} className={field} /></label>
          <label className={cn(lbl, "md:col-span-2")}>Frais de crédit obligatoires (une ligne : libellé FR | libellé EN | montant)
            <textarea rows={3} value={s.finance.creditFees.map((f) => `${f.labelFr} | ${f.labelEn} | ${f.amountCad}`).join("\n")} onChange={(e) => patch("finance", { ...s.finance, creditFees: e.target.value.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p.length === 3 && Number(p[2]) > 0).map(([labelFr, labelEn, a]) => ({ labelFr, labelEn, amountCad: Number(a) })) })} className={area} />
          </label>
          <label className={lbl}>Avertissement (FR)<textarea rows={3} value={s.finance.disclaimerFr} onChange={(e) => patch("finance", { ...s.finance, disclaimerFr: e.target.value })} className={area} /></label>
          <label className={lbl}>Disclaimer (EN)<textarea rows={3} value={s.finance.disclaimerEn} onChange={(e) => patch("finance", { ...s.finance, disclaimerEn: e.target.value })} className={area} /></label>
        </div>
      </Section>

      <Section title="Accueil et vidéo">
        <div className="grid gap-4 md:grid-cols-2">
          <label className={lbl}>Véhicule vedette (scène 360°)
            <select value={s.featuredVehicleId ?? ""} onChange={(e) => patch("featuredVehicleId", e.target.value || null)} className={field}><option value="">Automatique (véhicule marqué « vedette »)</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}</select>
          </label>
          <div className="text-caption text-text-3">{supabaseConfigured ? "Téléversez les fichiers encodés par scripts/encode-hero.sh dans le bucket public « vehicles/hero/ » puis collez les URL ci-dessous." : "En démonstration, la vidéo provient de public/media (scripts/encode-hero.sh). Les URL ci-dessous remplacent les fichiers sans redéploiement."}</div>
          {([["posterUrl", "Affiche 16:9 (AVIF)"], ["posterMobileUrl", "Affiche 9:16"], ["av1Url", "Vidéo AV1 1080p"], ["h264Url", "Vidéo H.264 1080p"], ["mobileUrl", "Vidéo mobile 720×1280"]] as const).map(([k, label]) => (
            <label key={k} className={lbl}>{label}<input value={s.hero[k] ?? ""} onChange={(e) => patch("hero", { ...s.hero, [k]: e.target.value || null })} className={field} placeholder="https://…" /></label>
          ))}
        </div>
      </Section>

      <Section title="Pourquoi Idya Auto (seules les affirmations confirmées par le client sont activées)">
        <div className="grid gap-4 md:grid-cols-2">
          {s.whyUs.map((w, i) => (
            <div key={w.key} className="rounded-card-sm border border-line p-3">
              <label className="mb-2 flex items-center gap-2 text-small text-text"><input type="checkbox" checked={w.enabled} onChange={(e) => patch("whyUs", s.whyUs.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))} className="size-4 accent-white" />Afficher</label>
              <input value={w.fr.title} onChange={(e) => patch("whyUs", s.whyUs.map((x, j) => (j === i ? { ...x, fr: { ...x.fr, title: e.target.value } } : x)))} className={cn(field, "mb-2")} aria-label="Titre FR" />
              <textarea rows={2} value={w.fr.body} onChange={(e) => patch("whyUs", s.whyUs.map((x, j) => (j === i ? { ...x, fr: { ...x.fr, body: e.target.value } } : x)))} className={cn(area, "mb-2")} aria-label="Texte FR" />
              <input value={w.en.title} onChange={(e) => patch("whyUs", s.whyUs.map((x, j) => (j === i ? { ...x, en: { ...x.en, title: e.target.value } } : x)))} className={cn(field, "mb-2")} aria-label="Title EN" />
              <textarea rows={2} value={w.en.body} onChange={(e) => patch("whyUs", s.whyUs.map((x, j) => (j === i ? { ...x, en: { ...x.en, body: e.target.value } } : x)))} className={area} aria-label="Body EN" />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Textes légaux et vie privée (Loi 25)">
        <div className="grid gap-4 md:grid-cols-2">
          {(["A", "B", "C", "D"] as const).map((c) => (
            <label key={c} className={lbl}>Garantie légale catégorie {c} (FR)<textarea rows={2} value={s.warranty[c].fr} onChange={(e) => patch("warranty", { ...s.warranty, [c]: { ...s.warranty[c], fr: e.target.value } })} className={area} /></label>
          ))}
          <label className={lbl}>Responsable des renseignements personnels — nom<input value={s.privacyOfficer.name} onChange={(e) => patch("privacyOfficer", { ...s.privacyOfficer, name: e.target.value })} className={field} /></label>
          <label className={lbl}>Titre<input value={s.privacyOfficer.title} onChange={(e) => patch("privacyOfficer", { ...s.privacyOfficer, title: e.target.value })} className={field} /></label>
          <label className={lbl}>Courriel<input value={s.privacyOfficer.email} onChange={(e) => patch("privacyOfficer", { ...s.privacyOfficer, email: e.target.value })} className={field} /></label>
          <label className={lbl}>Téléphone<input value={s.privacyOfficer.phone ?? ""} onChange={(e) => patch("privacyOfficer", { ...s.privacyOfficer, phone: e.target.value || null })} className={field} /></label>
          <label className={lbl}>Conservation des leads (mois)<input type="number" value={s.retention.leadsMonths} onChange={(e) => patch("retention", { ...s.retention, leadsMonths: Number(e.target.value) })} className={field} /></label>
          <label className={lbl}>Conservation des conversations (jours)<input type="number" value={s.retention.chatDays} onChange={(e) => patch("retention", { ...s.retention, chatDays: Number(e.target.value) })} className={field} /></label>
        </div>
      </Section>
      <div><Button variant="light" size="lg" onClick={save} disabled={pending}>Enregistrer les paramètres</Button></div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h3">{title}</h2>
      {children}
    </section>
  );
}
