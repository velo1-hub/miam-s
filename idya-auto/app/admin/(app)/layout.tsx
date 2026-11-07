import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminSession } from "@/lib/admin/auth";
import { env } from "@/lib/env";

async function Guarded({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return (
    <AdminShell session={session} demoMode={env.demoMode}>
      {children}
    </AdminShell>
  );
}

/** Session check happens inside Suspense so the admin shell prerenders a static fallback (Cache Components). */
export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-10"><Skeleton className="h-8 w-48" /></div>}>
      <Guarded>{children}</Guarded>
    </Suspense>
  );
}
