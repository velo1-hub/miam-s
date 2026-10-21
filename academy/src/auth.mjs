// Authentification : mots de passe hachés (scrypt), sessions en base, cookie HttpOnly.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { q } from "./db.mjs";

const SESSION_DAYS = 30;
export const COOKIE = "academy_session";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}
export function verifyPassword(password, stored) {
  const [algo, salt, hash] = String(stored).split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
export const validPassword = (p) => typeof p === "string" && p.length >= 8 && p.length <= 200;
export const validEmail = (e) => typeof e === "string" && e.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  await q.run("INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)", token, userId, expires);
  await q.run("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", userId);
  return { token, expires };
}
export async function destroySession(token) {
  if (token) await q.run("DELETE FROM sessions WHERE token = ?", token);
}
export async function userFromToken(token) {
  if (!token) return null;
  const row = await q.get(
    `SELECT u.id, u.email, u.name, u.role, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND s.expires_at > datetime('now')`, token);
  return row || null;
}
export async function purgeExpiredSessions() {
  await q.run("DELETE FROM sessions WHERE expires_at <= datetime('now')");
  await q.run("DELETE FROM password_resets WHERE expires_at <= datetime('now')");
}

export function parseCookies(header = "") {
  const out = {};
  for (const part of header.split(";")) { const i = part.indexOf("="); if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); }
  return out;
}
export function sessionCookie(token, expiresIso, secure) {
  const base = `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(expiresIso).toUTCString()}`;
  return secure ? `${base}; Secure` : base;
}
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

// Limiteur simple en mémoire (par IP ou par utilisateur).
const buckets = new Map();
export function rateLimit(key, max = 20, windowMs = 10 * 60e3) {
  const now = Date.now();
  const b = buckets.get(key) || { count: 0, reset: now + windowMs };
  if (now > b.reset) { b.count = 0; b.reset = now + windowMs; }
  b.count += 1; buckets.set(key, b);
  return b.count <= max;
}
