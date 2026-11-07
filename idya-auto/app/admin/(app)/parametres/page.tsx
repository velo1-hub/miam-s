import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { SettingsForm } from "@/components/admin/settings-form";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { getAdminVehicleRepository } from "@/lib/vehicles/admin-repository";
import { vehicleFullTitle } from "@/lib/vehicles/types";

/** Paramètres — brief §15: business info, hours, closures, booking rules, financing defaults and fees, taxes, notifications, featured vehicle, hero video, legal texts, privacy officer. */
async function AdminSettingsContent() {
  await connection(); // admin pages render per request (fresh data, clock, cookies)
  const [settings, repo] = await Promise.all([getSettings(), getAdminVehicleRepository()]);
  const vehicles = (await repo.listAll()).filter((v) => v.status === "available").map((v) => ({ id: v.id, title: vehicleFullTitle(v) }));
  return <SettingsForm initial={settings} vehicles={vehicles} supabaseConfigured={env.hasSupabase && !env.demoMode} />;
}

export default function AdminSettings() {
  return (
    <Suspense fallback={<Skeleton className="h-10 w-64" />}>
      <AdminSettingsContent />
    </Suspense>
  );
}
