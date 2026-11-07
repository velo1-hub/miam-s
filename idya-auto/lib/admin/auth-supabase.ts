import "server-only";
import type { AdminSession } from "./auth";

/** Filled in once the Supabase server client exists (backend task): session + staff role + AAL2 check. */
export async function getSupabaseAdminSession(): Promise<AdminSession | null> {
  try {
    const { createServerSupabase } = await import("@/lib/supabase/server");
    const supabase = await createServerSupabase();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;
    const { data: staff } = await supabase.from("staff").select("role, full_name").eq("user_id", user.id).maybeSingle();
    if (!staff) return null;
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const mfa = aal?.currentLevel === "aal2";
    // Brief §15: TOTP 2FA mandatory for the owner role
    if (staff.role === "owner" && !mfa) return null;
    return { userId: user.id, email: user.email ?? "", fullName: (staff.full_name as string | null) ?? user.email ?? "", role: staff.role as AdminSession["role"], mfa };
  } catch {
    return null;
  }
}
