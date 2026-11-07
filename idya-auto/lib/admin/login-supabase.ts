import "server-only";

/** Supabase Auth login with TOTP verification for the owner role (brief §15). Wired once the server client exists. */
export async function supabaseLogin(email: string, password: string, totp: string): Promise<{ ok: true } | { ok: false; error: "credentials" | "mfa" }> {
  try {
    const { createServerSupabase } = await import("@/lib/supabase/server");
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: "credentials" };
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp?.[0];
    if (totpFactor) {
      if (!totp) return { ok: false, error: "mfa" };
      const challenge = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
      if (challenge.error) return { ok: false, error: "mfa" };
      const verify = await supabase.auth.mfa.verify({ factorId: totpFactor.id, challengeId: challenge.data.id, code: totp });
      if (verify.error) return { ok: false, error: "mfa" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "credentials" };
  }
}

export async function supabaseLogout(): Promise<void> {
  try {
    const { createServerSupabase } = await import("@/lib/supabase/server");
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  } catch {
    /* ignore */
  }
}
