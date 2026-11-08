import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { DEMO_PASSCODE_LENGTH, getAdminSession, isSupabaseAuth } from "@/lib/admin/auth";

async function AdminLoginContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await connection(); // admin pages render per request (fresh data, clock, cookies)
  if (await getAdminSession()) redirect("/admin");
  const { error } = await searchParams;
  const supabase = isSupabaseAuth();
  return (
    <div className="no-red flex min-h-svh items-center justify-center px-5">
      <form action={loginAction} className="glass-lite w-full max-w-sm rounded-card p-8">
        <Logo className="mb-8" />
        <h1 className="text-h3">Administration</h1>
        <p className="mt-1 text-small text-text-2">{supabase ? "Connexion avec votre compte du personnel. L'authentification à deux facteurs est obligatoire pour le propriétaire." : `Mode démonstration : entrez le code d'accès à ${DEMO_PASSCODE_LENGTH} chiffres.`}</p>
        <div className="mt-6 flex flex-col gap-3">
          {supabase ? (
            <>
              <label className="flex flex-col gap-1 text-caption text-text-3">
                Courriel
                <input name="email" type="email" required autoComplete="username" className="no-red h-11 rounded-input border border-line bg-surface px-3 text-admin text-text outline-none focus:border-text" />
              </label>
              <label className="flex flex-col gap-1 text-caption text-text-3">
                Mot de passe
                <input name="password" type="password" required autoComplete="current-password" className="no-red h-11 rounded-input border border-line bg-surface px-3 text-admin text-text outline-none focus:border-text" />
              </label>
              <label className="flex flex-col gap-1 text-caption text-text-3">
                Code à usage unique (TOTP)
                <input name="totp" inputMode="numeric" autoComplete="one-time-code" className="no-red h-11 rounded-input border border-line bg-surface px-3 text-admin text-text outline-none focus:border-text" />
              </label>
            </>
          ) : (
            <label className="flex flex-col gap-1 text-caption text-text-3">
              Code d&apos;accès
              <input
                name="passcode"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                minLength={DEMO_PASSCODE_LENGTH}
                maxLength={DEMO_PASSCODE_LENGTH}
                required
                autoFocus
                autoComplete="one-time-code"
                placeholder={"•".repeat(DEMO_PASSCODE_LENGTH)}
                className="no-red h-11 rounded-input border border-line bg-surface px-3 text-center text-h3 tracking-[0.4em] text-text outline-none focus:border-text"
              />
            </label>
          )}
          {error && <p role="alert" className="text-small text-danger">{error === "mfa" ? "Code à deux facteurs requis ou invalide." : supabase ? "Identifiants invalides." : "Code d'accès invalide."}</p>}
          <Button type="submit" variant="light" size="lg" className="mt-2 w-full">Se connecter</Button>
        </div>
      </form>
    </div>
  );
}

export default function AdminLogin(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  return (
    <Suspense fallback={<Skeleton className="h-10 w-64" />}>
      <AdminLoginContent searchParams={props.searchParams as never} />
    </Suspense>
  );
}
