"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { setVehicleStatusAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { VehicleStatus } from "@/lib/vehicles/types";

export function BulkStatus({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<VehicleStatus>("available");
  const [pending, start] = useTransition();
  const router = useRouter();
  const apply = () => {
    const ids = [...(ref.current?.querySelectorAll<HTMLInputElement>("input[name=ids]:checked") ?? [])].map((i) => i.value);
    if (!ids.length) return;
    start(async () => {
      await setVehicleStatusAction(ids, status);
      router.refresh();
    });
  };
  return (
    <form ref={ref} onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
      <div className="no-red flex flex-wrap items-center gap-2 text-small">
        <span className="text-text-2">Sélection :</span>
        <select value={status} onChange={(e) => setStatus(e.target.value as VehicleStatus)} className="h-9 rounded-pill border border-line bg-surface px-3 text-small text-text outline-none">
          <option value="available">Disponible</option><option value="pending">Réservé</option><option value="sold">Vendu</option><option value="archived">Archivé</option><option value="draft">Brouillon</option>
        </select>
        <Button type="button" variant="secondary" size="sm" onClick={apply} disabled={pending}>Appliquer le statut</Button>
      </div>
      {children}
    </form>
  );
}
