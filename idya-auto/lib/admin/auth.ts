import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { StaffRole } from "./types";

export interface AdminSession {
  userId: string;
  email: string;
  fullName: string;
  role: StaffRole;
  mfa: boolean;
}

const COOKIE = "idya_admin";
const secret = () => process.env.ADMIN_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "idya-demo-secret";

/** Demo passcode (5 digits). Override with DEMO_ADMIN_PASSCODE. */
export const DEMO_PASSCODE_LENGTH = 5;
const demoPasscode = () => process.env.DEMO_ADMIN_PASSCODE ?? "00000";

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/**
 * Admin auth — brief §15. Demo mode: a single 5-digit passcode (DEMO_ADMIN_PASSCODE, default 00000)
 * opens the demo owner account with a signed cookie. Supabase mode: Supabase Auth
 * session with TOTP MFA (AAL2) required for the owner role.
 */
export function isSupabaseAuth(): boolean {
  return process.env.DEMO_MODE === "false" && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (isSupabaseAuth()) {
    const { getSupabaseAdminSession } = await import("./auth-supabase");
    return getSupabaseAdminSession();
  }
  // Session expiry is request-time data: opt out of the static shell before reading the clock.
  await connection();
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession & { exp: number };
    if (data.exp < Date.now()) return null;
    return { userId: data.userId, email: data.email, fullName: data.fullName, role: data.role, mfa: data.mfa };
  } catch {
    return null;
  }
}

export async function demoLogin(passcode: string): Promise<AdminSession | null> {
  const expected = demoPasscode();
  const given = passcode.replace(/\s+/g, "");
  if (given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) return null;
  const email = process.env.DEMO_ADMIN_EMAIL ?? "demo@idya-auto.example";
  const session: AdminSession = { userId: "demo-owner", email, fullName: "Compte démo (propriétaire)", role: "owner", mfa: true };
  const payload = Buffer.from(JSON.stringify({ ...session, exp: Date.now() + 12 * 3_600_000 })).toString("base64url");
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/admin", maxAge: 12 * 3600 });
  return session;
}

export async function demoLogout(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function can(session: AdminSession, action: "vehicles" | "settings" | "staff" | "delete" | "leads"): boolean {
  switch (action) {
    case "leads":
      return true;
    case "vehicles":
    case "settings":
      return session.role === "owner" || session.role === "manager";
    case "staff":
    case "delete":
      return session.role === "owner";
  }
}
