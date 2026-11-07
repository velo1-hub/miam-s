import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { VehicleEditor } from "@/components/admin/vehicle-editor";
import { getAdminSession } from "@/lib/admin/auth";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { getAdminVehicleRepository } from "@/lib/vehicles/admin-repository";

async function AdminVehiclePageContent({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // admin pages render per request (fresh data, clock, cookies)
  const { id } = await params;
  const repo = await getAdminVehicleRepository();
  const v = await repo.get(id);
  if (!v) notFound();
  const [settings, session] = await Promise.all([getSettings(), getAdminSession()]);
  return <VehicleEditor initial={v} settings={settings} canDelete={session?.role === "owner"} demoMode={env.demoMode} aiEnabled={env.hasAnthropic} supabaseConfigured={env.hasSupabase} />;
}

export default function AdminVehiclePage(props: { params: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<Skeleton className="h-10 w-64" />}>
      <AdminVehiclePageContent params={props.params as never} />
    </Suspense>
  );
}
