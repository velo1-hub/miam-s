"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";
import { CheckboxField, SelectField, TextArea, TextField } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Logo } from "@/components/ui/logo";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { FinancingCalculator } from "@/components/vehicle/calculator";
import { defaultSettings } from "@/lib/settings/defaults";

const COLORS = ["bg", "bg-raised", "surface", "surface-hover", "text", "text-2", "text-3", "red", "red-hover", "red-pressed", "red-text", "red-deep", "titanium", "success", "warning", "danger"] as const;

/** Every primitive with its spec reference (brief §3.8) for pixel review at 390 and 1440. */
export function Gallery() {
  const [seg, setSeg] = useState("a");
  const [open, setOpen] = useState(false);
  const toast = useToast();
  return (
    <div className="container-content flex flex-col gap-16 py-20">
      <header><Logo /><h1 className="mt-6 text-h1">Système de design</h1><p className="mt-2 text-body-lg text-text-2">Tokens, verre, typographie et composants — brief §3.</p></header>

      <section><h2 className="mb-4 text-h3">Couleurs</h2>
        <ul className="grid grid-cols-4 gap-3 md:grid-cols-8">{COLORS.map((c) => <li key={c} className="text-caption text-text-2"><div className={`mb-1 h-14 rounded-card-sm border border-line bg-${c}`} />--{c}</li>)}</ul>
      </section>

      <section><h2 className="mb-4 text-h3">Typographie</h2>
        <p className="text-display-xl">Display XL</p><p className="text-display">Display</p><p className="text-h1">Titre 1</p><p className="text-h2">Titre 2</p><p className="text-h3">Titre 3</p><p className="text-body-lg">Body large 19 px</p><p className="text-body">Body 17 px</p><p className="text-small">Small 14 px</p><p className="eyebrow">Eyebrow 12 px</p><p className="tabular text-price-xl">28 995 $</p>
      </section>

      <section><h2 className="mb-4 text-h3">Verre</h2>
        <div className="studio-bg grid gap-4 rounded-card p-6 md:grid-cols-4">
          {(["glass-1", "glass-2", "glass-3", "glass-lite"] as const).map((g) => <div key={g} className={`${g} rounded-card-sm p-5 text-small`}>{g}</div>)}
        </div>
      </section>

      <section><h2 className="mb-4 text-h3">Boutons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Réserver un essai</Button><Button variant="light">Faire une demande</Button><Button variant="secondary">Poser une question</Button><Button variant="ghost">Lien</Button><Button variant="primary" size="md">Primary md</Button><Button variant="light" size="sm">Light sm</Button><IconButton label="Favori"><Heart strokeWidth={1.5} /></IconButton>
        </div>
      </section>

      <section><h2 className="mb-4 text-h3">Badges et chips</h2>
        <div className="flex flex-wrap gap-2"><Badge variant="newArrival">Nouvel arrivage</Badge><Badge variant="certified">Certifié</Badge><Badge variant="sold">Vendu</Badge><Badge variant="new">Neuf</Badge><Badge variant="pending">Réservé</Badge><Chip onRemove={() => undefined} removeLabel="Retirer">VUS</Chip><Chip active>Hybride · 3</Chip></div>
      </section>

      <section><h2 className="mb-4 text-h3">Contrôles</h2>
        <SegmentedControl label="Vue" value={seg} onChange={setSeg} options={[{ value: "a", label: "360° Extérieur" }, { value: "b", label: "Intérieur" }, { value: "c", label: "Photos" }]} />
        <div className="no-red mt-6 grid max-w-xl gap-4"><TextField label="Prénom" /><TextField label="Courriel" error="Entrez une adresse courriel valide." /><SelectField label="Sujet"><option>Question générale</option></SelectField><TextArea label="Message" /><CheckboxField label="Je consens à ce qu'Idya Auto utilise ces renseignements pour répondre à ma demande." /></div>
      </section>

      <section><h2 className="mb-4 text-h3">Superpositions</h2>
        <div className="flex gap-3"><Button variant="secondary" onClick={() => setOpen(true)}>Ouvrir le dialogue</Button><Button variant="secondary" onClick={() => toast({ title: "Lien copié", description: "Collez-le où vous voulez." })}>Toast</Button></div>
        <Dialog open={open} onOpenChange={setOpen} title="Réserver un essai routier" description="Étape 1 sur 3" closeLabel="Fermer"><p className="text-text-2">Contenu du dialogue (glass-3, rayon 28, max 560).</p></Dialog>
      </section>

      <section><h2 className="mb-4 text-h3">Squelettes</h2><div className="grid gap-3 md:grid-cols-3"><Skeleton className="aspect-[4/3]" /><Skeleton className="h-6 w-2/3" /><Skeleton className="h-6" /></div></section>

      <section><h2 className="mb-4 text-h3">Calculateur (zone sans rouge)</h2><FinancingCalculator priceCad={28_995} finance={defaultSettings.finance} variant="full" /></section>
    </div>
  );
}
