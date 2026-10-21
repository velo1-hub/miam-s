// The 1% — serveur HTTP + API JSON + fichiers statiques. Node ≥ 22.5.
//   npm start                           (PORT=3000, SQLite local)
//   DATABASE_URL=postgres://… npm start  (Postgres : Supabase, Neon…)
// Sur Vercel, api/index.js réexporte `handler` ; les vidéos vont dans Vercel Blob (BLOB_READ_WRITE_TOKEN).
import { createServer } from "node:http";
import { createReadStream, statSync, existsSync, mkdirSync, createWriteStream, unlinkSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { openDb, q, getSetting, setSetting, isPg } from "./src/db.mjs";
import * as auth from "./src/auth.mjs";
import { createOrder, checkoutUrl, markInstallmentPaid, verifyStripeSignature, stripeEnabled } from "./src/payments.mjs";
import { courseCompletion, issueIfComplete, certificateHtml } from "./src/certificates.mjs";
import { seed } from "./src/seed.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(here, "public");
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(here, "data", "uploads");
const MAX_UPLOAD = (Number(process.env.MAX_UPLOAD_MB) || 2048) * 1024 * 1024;
const BLOB = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".pdf": "application/pdf", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2", ".zip": "application/zip", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".csv": "text/csv" };
const ALLOWED_UPLOAD = new Set([".mp4", ".webm", ".mov", ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".zip", ".xlsx", ".csv"]);

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const bad = (m) => new HttpError(400, m);
const withHeaders = (body, headers) => ({ __body: body, __headers: headers });
const safeJson = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };

// ---------- Réponses ----------
function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  res.end(JSON.stringify(body));
}
function html(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", ...headers });
  res.end(body);
}
function security(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}
async function readBody(req, limit = 1024 * 1024) {
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > limit) throw new HttpError(413, "Corps trop volumineux"); chunks.push(c); }
  return Buffer.concat(chunks);
}
async function readJson(req) {
  const raw = await readBody(req);
  if (!raw.length) return {};
  const v = safeJson(raw.toString("utf8"), undefined);
  if (v === undefined || typeof v !== "object") throw bad("JSON invalide");
  return v;
}

// ---------- Contexte de requête ----------
async function ctx(req) {
  const url = new URL(req.url, "http://x");
  // Sur Vercel, toutes les routes sont réécrites vers /api/index?__path=… : on reconstruit le chemin d'origine.
  const rewritten = url.searchParams.get("__path");
  if (rewritten !== null) { url.pathname = "/" + rewritten; url.searchParams.delete("__path"); }
  const cookies = auth.parseCookies(req.headers.cookie);
  const user = await auth.userFromToken(cookies[auth.COOKIE]);
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const baseUrl = process.env.BASE_URL || `${proto}://${host}`;
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "?";
  return { url, cookies, user, baseUrl, ip, secure: proto === "https", token: cookies[auth.COOKIE] };
}
const requireUser = (c) => { if (!c.user) throw new HttpError(401, "Connexion requise"); return c.user; };
const requireAdmin = (c) => { const u = requireUser(c); if (u.role !== "admin") throw new HttpError(403, "Réservé à l'administration"); return u; };
// Protection CSRF : les écritures exigent un en-tête personnalisé (impossible à envoyer depuis un formulaire d'un autre site).
const requireHeader = (req) => { if (req.headers["x-requested-with"] !== "the1percent") throw new HttpError(403, "En-tête X-Requested-With manquant"); };

// ---------- Données ----------
async function isEnrolled(userId, courseId) { return Boolean(await q.get("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?", userId, courseId)); }

async function courseRow(c, user) {
  const counts = await q.get("SELECT COUNT(DISTINCT m.id) modules, COUNT(l.id) lessons, COALESCE(SUM(l.duration_min),0) minutes FROM modules m LEFT JOIN lessons l ON l.module_id = m.id WHERE m.course_id = ?", c.id);
  const quizzes = (await q.get("SELECT COUNT(*) n FROM quizzes WHERE course_id = ?", c.id)).n;
  const enrolled = user ? await isEnrolled(user.id, c.id) : false;
  return {
    id: c.id, slug: c.slug, title: c.title, subtitle: c.subtitle, description: c.description, audience: c.audience,
    outcomes: safeJson(c.outcomes, []), includes: safeJson(c.includes, []), level: c.level, hours: c.hours,
    price_cents: c.price_cents, currency: c.currency, accent: c.accent, featured: !!c.featured, published: !!c.published,
    plan: c.plan_json ? safeJson(c.plan_json, null) : null, modules: counts.modules, lessons: counts.lessons, minutes: counts.minutes, quizzes,
    enrolled, progress: enrolled ? await courseCompletion(user.id, c.id) : null,
  };
}

async function courseOutline(c, user) {
  const enrolled = user ? await isEnrolled(user.id, c.id) : false;
  const admin = user?.role === "admin";
  const done = new Set(user ? (await q.all("SELECT lesson_id FROM progress WHERE user_id = ?", user.id)).map((r) => r.lesson_id) : []);
  const modules = [];
  for (const m of await q.all("SELECT * FROM modules WHERE course_id = ? ORDER BY sort, id", c.id)) {
    const lessons = (await q.all("SELECT id, title, duration_min, is_preview, sort, video_url != '' AS has_video FROM lessons WHERE module_id = ? ORDER BY sort, id", m.id)).map((l) => ({
      id: l.id, title: l.title, duration_min: l.duration_min, is_preview: !!l.is_preview, has_video: !!l.has_video, done: done.has(l.id), locked: !(enrolled || admin || l.is_preview),
    }));
    const quiz = await q.get("SELECT id, title, pass_pct FROM quizzes WHERE module_id = ?", m.id);
    const best = quiz && user ? await q.get("SELECT MAX(score_pct) score, MAX(passed) passed FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?", user.id, quiz.id) : null;
    modules.push({ id: m.id, title: m.title, summary: m.summary, lessons, quiz: quiz ? { ...quiz, best: best?.score ?? null, passed: !!best?.passed } : null });
  }
  const finalQ = await q.get("SELECT id, title, pass_pct FROM quizzes WHERE course_id = ? AND module_id IS NULL", c.id);
  const finalBest = finalQ && user ? await q.get("SELECT MAX(score_pct) score, MAX(passed) passed FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?", user.id, finalQ.id) : null;
  const cert = user ? await q.get("SELECT code, issued_at FROM certificates WHERE user_id = ? AND course_id = ?", user.id, c.id) : null;
  const order = user ? await q.get("SELECT id, plan, status, amount_cents, currency FROM orders WHERE user_id = ? AND course_id = ? AND status IN ('active','paid','pending') ORDER BY id DESC LIMIT 1", user.id, c.id) : null;
  const installments = order ? await q.all("SELECT number, label, amount_cents, due_at, status, paid_at FROM installments WHERE order_id = ? ORDER BY number", order.id) : [];
  return { ...(await courseRow(c, user)), modulesList: modules, finalExam: finalQ ? { ...finalQ, best: finalBest?.score ?? null, passed: !!finalBest?.passed } : null, certificate: cert || null, order: order ? { ...order, installments } : null };
}

async function canAccessLesson(lesson, user) {
  if (lesson.is_preview) return true;
  if (!user) return false;
  if (user.role === "admin") return true;
  const m = await q.get("SELECT course_id FROM modules WHERE id = ?", lesson.module_id);
  return isEnrolled(user.id, m.course_id);
}

// ---------- Routeur ----------
const routes = [];
const route = (method, pattern, handler) => routes.push({ method, re: new RegExp("^" + pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$"), handler });

// Public
route("GET", "/api/health", async () => ({ ok: true, stripe: stripeEnabled(), db: isPg ? "postgres" : "sqlite", uploads: BLOB ? "blob" : "local" }));
route("GET", "/api/config", async () => ({ brand: await getSetting("brand_name", "The 1%"), supportEmail: await getSetting("support_email", ""), stripe: stripeEnabled(), currency: "USD", uploads: BLOB ? "blob" : "local" }));
route("GET", "/api/courses", async (c) => { const out = []; for (const r of await q.all("SELECT * FROM courses WHERE published = 1 ORDER BY sort, id")) out.push(await courseRow(r, c.user)); return out; });
route("GET", "/api/courses/:slug", async (c, p) => {
  const row = await q.get("SELECT * FROM courses WHERE slug = ? AND (published = 1 OR ? = 'admin')", p.slug, c.user?.role || "");
  if (!row) throw new HttpError(404, "Formation introuvable");
  return courseOutline(row, c.user);
});
route("GET", "/api/lessons/:id", async (c, p) => {
  const l = await q.get("SELECT * FROM lessons WHERE id = ?", Number(p.id));
  if (!l) throw new HttpError(404, "Leçon introuvable");
  if (!(await canAccessLesson(l, c.user))) throw new HttpError(403, "Inscrivez-vous pour accéder à cette leçon");
  const m = await q.get("SELECT m.*, c.slug course_slug, c.title course_title FROM modules m JOIN courses c ON c.id = m.course_id WHERE m.id = ?", l.module_id);
  const siblings = (await q.all("SELECT l.id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ? ORDER BY m.sort, m.id, l.sort, l.id", m.course_id)).map((r) => r.id);
  const i = siblings.indexOf(l.id);
  const comments = await q.all("SELECT c.id, c.body, c.created_at, u.name, u.role FROM comments c JOIN users u ON u.id = c.user_id WHERE c.lesson_id = ? ORDER BY c.id DESC LIMIT 100", l.id);
  const done = c.user ? Boolean(await q.get("SELECT 1 FROM progress WHERE user_id = ? AND lesson_id = ?", c.user.id, l.id)) : false;
  return { id: l.id, title: l.title, video_url: l.video_url, content: l.content, resources: safeJson(l.resources, []), duration_min: l.duration_min, is_preview: !!l.is_preview,
    module: { id: m.id, title: m.title }, course: { slug: m.course_slug, title: m.course_title }, prev: siblings[i - 1] || null, next: siblings[i + 1] || null, done, comments };
});
route("GET", "/api/certificates/:code", async (c, p) => {
  const r = await q.get("SELECT c.code, c.issued_at, u.name, co.title FROM certificates c JOIN users u ON u.id = c.user_id JOIN courses co ON co.id = c.course_id WHERE c.code = ?", p.code);
  if (!r) throw new HttpError(404, "Certificat introuvable");
  return r;
});

// Auth
route("POST", "/api/auth/register", async (c, p, req) => {
  requireHeader(req);
  if (!auth.rateLimit(`reg:${c.ip}`, 10)) throw new HttpError(429, "Trop de tentatives, réessayez plus tard");
  const b = await readJson(req);
  const email = String(b.email || "").trim().toLowerCase();
  const name = String(b.name || "").trim().slice(0, 80);
  if (!auth.validEmail(email)) throw bad("Courriel invalide");
  if (name.length < 2) throw bad("Nom requis");
  if (!auth.validPassword(b.password)) throw bad("Mot de passe : 8 caractères minimum");
  if (await q.get("SELECT 1 FROM users WHERE email = ?", email)) throw new HttpError(409, "Un compte existe déjà avec ce courriel");
  const r = await q.run("INSERT INTO users(email,name,password_hash) VALUES(?,?,?)", email, name, auth.hashPassword(b.password));
  const s = await auth.createSession(r.lastInsertRowid);
  return withHeaders({ user: await auth.userFromToken(s.token) }, { "Set-Cookie": auth.sessionCookie(s.token, s.expires, c.secure) });
});
route("POST", "/api/auth/login", async (c, p, req) => {
  requireHeader(req);
  if (!auth.rateLimit(`login:${c.ip}`, 20)) throw new HttpError(429, "Trop de tentatives, réessayez dans 10 minutes");
  const b = await readJson(req);
  const u = await q.get("SELECT * FROM users WHERE email = ?", String(b.email || "").trim().toLowerCase());
  if (!u || !auth.verifyPassword(String(b.password || ""), u.password_hash)) throw new HttpError(401, "Courriel ou mot de passe incorrect");
  const s = await auth.createSession(u.id);
  return withHeaders({ user: await auth.userFromToken(s.token) }, { "Set-Cookie": auth.sessionCookie(s.token, s.expires, c.secure) });
});
route("POST", "/api/auth/logout", async (c, p, req) => { requireHeader(req); await auth.destroySession(c.token); return withHeaders({ ok: true }, { "Set-Cookie": auth.clearCookie() }); });
route("GET", "/api/me", async (c) => ({ user: c.user }));
route("PUT", "/api/me", async (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  const b = await readJson(req);
  if (b.name !== undefined) { const name = String(b.name).trim().slice(0, 80); if (name.length < 2) throw bad("Nom requis"); await q.run("UPDATE users SET name = ? WHERE id = ?", name, u.id); }
  if (b.password) {
    const row = await q.get("SELECT password_hash FROM users WHERE id = ?", u.id);
    if (!auth.verifyPassword(String(b.current_password || ""), row.password_hash)) throw bad("Mot de passe actuel incorrect");
    if (!auth.validPassword(b.password)) throw bad("Nouveau mot de passe : 8 caractères minimum");
    await q.run("UPDATE users SET password_hash = ? WHERE id = ?", auth.hashPassword(b.password), u.id);
  }
  return { user: await auth.userFromToken(c.token) };
});
route("POST", "/api/auth/forgot", async (c, p, req) => {
  requireHeader(req);
  if (!auth.rateLimit(`forgot:${c.ip}`, 5)) throw new HttpError(429, "Trop de tentatives");
  const b = await readJson(req);
  const u = await q.get("SELECT id FROM users WHERE email = ?", String(b.email || "").trim().toLowerCase());
  if (u) {
    const token = randomBytes(24).toString("base64url");
    await q.run("INSERT INTO password_resets(token,user_id,expires_at) VALUES(?,?,?)", token, u.id, new Date(Date.now() + 3600e3).toISOString());
    console.log(`[reset] ${c.baseUrl}/reinitialiser/${token}`); // sans service de courriel, l'admin transmet le lien (voir README)
  }
  return { ok: true };
});
route("POST", "/api/auth/reset", async (c, p, req) => {
  requireHeader(req);
  const b = await readJson(req);
  const r = await q.get("SELECT * FROM password_resets WHERE token = ? AND expires_at > datetime('now')", String(b.token || ""));
  if (!r) throw bad("Lien expiré ou invalide");
  if (!auth.validPassword(b.password)) throw bad("Mot de passe : 8 caractères minimum");
  await q.run("UPDATE users SET password_hash = ? WHERE id = ?", auth.hashPassword(b.password), r.user_id);
  await q.run("DELETE FROM password_resets WHERE user_id = ?", r.user_id);
  await q.run("DELETE FROM sessions WHERE user_id = ?", r.user_id);
  return { ok: true };
});

// Étudiant
route("GET", "/api/dashboard", async (c) => {
  const u = requireUser(c);
  const courses = [];
  for (const r of await q.all("SELECT c.* FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? ORDER BY e.id DESC", u.id)) {
    const next = await q.get(`SELECT l.id, l.title FROM lessons l JOIN modules m ON m.id = l.module_id
      WHERE m.course_id = ? AND l.id NOT IN (SELECT lesson_id FROM progress WHERE user_id = ?) ORDER BY m.sort, m.id, l.sort, l.id LIMIT 1`, r.id, u.id);
    const cert = await q.get("SELECT code FROM certificates WHERE user_id = ? AND course_id = ?", u.id, r.id);
    courses.push({ ...(await courseRow(r, u)), nextLesson: next || null, certificate: cert?.code || null });
  }
  const orders = [];
  for (const o of await q.all("SELECT o.id, o.plan, o.status, o.amount_cents, o.currency, o.created_at, c.title course_title, c.slug course_slug FROM orders o JOIN courses c ON c.id = o.course_id WHERE o.user_id = ? ORDER BY o.id DESC", u.id))
    orders.push({ ...o, installments: await q.all("SELECT number, label, amount_cents, due_at, status, paid_at FROM installments WHERE order_id = ? ORDER BY number", o.id) });
  const minutes = (await q.get("SELECT COALESCE(SUM(l.duration_min),0) m FROM progress p JOIN lessons l ON l.id = p.lesson_id WHERE p.user_id = ?", u.id)).m;
  return { courses, orders, minutes };
});
route("POST", "/api/lessons/:id/complete", async (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  const l = await q.get("SELECT * FROM lessons WHERE id = ?", Number(p.id));
  if (!l || !(await canAccessLesson(l, u))) throw new HttpError(403, "Accès refusé");
  await q.run("INSERT OR IGNORE INTO progress(user_id,lesson_id) VALUES(?,?)", u.id, l.id);
  const m = await q.get("SELECT course_id FROM modules WHERE id = ?", l.module_id);
  const cert = await issueIfComplete(u.id, m.course_id);
  return { ok: true, completion: await courseCompletion(u.id, m.course_id), certificate: cert?.code || null };
});
route("DELETE", "/api/lessons/:id/complete", async (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  await q.run("DELETE FROM progress WHERE user_id = ? AND lesson_id = ?", u.id, Number(p.id));
  return { ok: true };
});
route("POST", "/api/lessons/:id/comments", async (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  const l = await q.get("SELECT * FROM lessons WHERE id = ?", Number(p.id));
  if (!l || !(await canAccessLesson(l, u))) throw new HttpError(403, "Accès refusé");
  const b = await readJson(req);
  const body = String(b.body || "").trim().slice(0, 2000);
  if (body.length < 2) throw bad("Message vide");
  if (!auth.rateLimit(`comment:${u.id}`, 30)) throw new HttpError(429, "Trop de messages");
  await q.run("INSERT INTO comments(lesson_id,user_id,body) VALUES(?,?,?)", l.id, u.id, body);
  return { ok: true };
});
async function quizFor(c, id) {
  const u = requireUser(c);
  const z = await q.get("SELECT * FROM quizzes WHERE id = ?", Number(id));
  if (!z) throw new HttpError(404, "Quiz introuvable");
  if (u.role !== "admin" && !(await isEnrolled(u.id, z.course_id))) throw new HttpError(403, "Inscription requise");
  return { u, z };
}
route("GET", "/api/quizzes/:id", async (c, p) => {
  const { u, z } = await quizFor(c, p.id);
  const questions = safeJson(z.questions, []).map((qq) => ({ q: qq.q, options: qq.options }));
  const attempts = await q.all("SELECT score_pct, passed, created_at FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? ORDER BY id DESC LIMIT 10", u.id, z.id);
  const course = await q.get("SELECT slug, title FROM courses WHERE id = ?", z.course_id);
  return { id: z.id, title: z.title, pass_pct: z.pass_pct, questions, attempts, course, isFinal: z.module_id === null };
});
route("POST", "/api/quizzes/:id/attempt", async (c, p, req) => {
  requireHeader(req);
  const { u, z } = await quizFor(c, p.id);
  const b = await readJson(req);
  const questions = safeJson(z.questions, []);
  const answers = Array.isArray(b.answers) ? b.answers.map((a) => (Number.isInteger(a) ? a : -1)) : [];
  if (answers.length !== questions.length) throw bad("Répondez à toutes les questions");
  const results = questions.map((qq, i) => ({ correct: qq.answer === answers[i], answer: qq.answer, why: qq.why || "" }));
  const score = Math.round((results.filter((r) => r.correct).length / questions.length) * 100);
  const passed = score >= z.pass_pct ? 1 : 0;
  await q.run("INSERT INTO quiz_attempts(user_id,quiz_id,score_pct,passed,answers) VALUES(?,?,?,?,?)", u.id, z.id, score, passed, JSON.stringify(answers));
  const cert = await issueIfComplete(u.id, z.course_id);
  return { score, passed: !!passed, results, certificate: cert?.code || null, completion: await courseCompletion(u.id, z.course_id) };
});

// Paiement / inscription
route("POST", "/api/checkout", async (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  const b = await readJson(req);
  const course = await q.get("SELECT * FROM courses WHERE id = ? AND published = 1", Number(b.course_id));
  if (!course) throw new HttpError(404, "Formation introuvable");
  if (await isEnrolled(u.id, course.id)) throw bad("Vous êtes déjà inscrit");
  if (course.price_cents === 0) {
    await q.run("INSERT OR IGNORE INTO enrollments(user_id,course_id,source) VALUES(?,?,'free')", u.id, course.id);
    return { enrolled: true, redirect: `/apprendre/${course.slug}` };
  }
  const pending = await q.get("SELECT id FROM orders WHERE user_id = ? AND course_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1", u.id, course.id);
  const order = pending ? { orderId: pending.id } : await createOrder({ user: u, course, plan: b.plan === "3x" ? "3x" : "full", coupon: b.coupon ? String(b.coupon).trim() : "" });
  const out = await checkoutUrl({ orderId: order.orderId, installmentNumber: 1, course, user: u, baseUrl: c.baseUrl });
  return { enrolled: false, order_id: order.orderId, ...out };
});
route("POST", "/api/orders/:id/pay/:n", async (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  const o = await q.get("SELECT * FROM orders WHERE id = ? AND user_id = ?", Number(p.id), u.id);
  if (!o) throw new HttpError(404, "Commande introuvable");
  const course = await q.get("SELECT * FROM courses WHERE id = ?", o.course_id);
  return checkoutUrl({ orderId: o.id, installmentNumber: Number(p.n), course, user: u, baseUrl: c.baseUrl });
});
route("POST", "/api/checkout/simulate", async (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  if (stripeEnabled()) throw new HttpError(403, "Simulation désactivée : Stripe est configuré");
  const b = await readJson(req);
  const o = await q.get("SELECT * FROM orders WHERE id = ? AND user_id = ?", Number(b.order_id), u.id);
  if (!o) throw new HttpError(404, "Commande introuvable");
  const r = await markInstallmentPaid(o.id, Number(b.n) || 1, `sim_${Date.now()}`);
  const course = await q.get("SELECT slug FROM courses WHERE id = ?", o.course_id);
  return { ok: true, remaining: r.remaining, redirect: `/apprendre/${course.slug}` };
});
route("POST", "/api/stripe/webhook", async (c, p, req) => {
  const raw = (await readBody(req)).toString("utf8");
  if (!verifyStripeSignature(raw, req.headers["stripe-signature"])) throw new HttpError(400, "Signature invalide");
  const ev = safeJson(raw, {});
  if (ev.type === "checkout.session.completed") {
    const s = ev.data?.object || {};
    const [orderId, n] = String(s.client_reference_id || "").split(":").map(Number);
    if (orderId && n && s.payment_status === "paid") await markInstallmentPaid(orderId, n, s.payment_intent || s.id);
  }
  return { received: true };
});

// Admin
route("GET", "/api/admin/stats", async (c) => {
  requireAdmin(c);
  const g = async (sql, ...a) => (await q.get(sql, ...a)).n;
  return {
    students: await g("SELECT COUNT(*) n FROM users WHERE role = 'student'"),
    enrollments: await g("SELECT COUNT(*) n FROM enrollments"),
    revenue_cents: await g("SELECT COALESCE(SUM(amount_cents),0) n FROM installments WHERE status = 'paid'"),
    outstanding_cents: await g("SELECT COALESCE(SUM(i.amount_cents),0) n FROM installments i JOIN orders o ON o.id = i.order_id WHERE i.status = 'pending' AND o.status = 'active'"),
    certificates: await g("SELECT COUNT(*) n FROM certificates"),
    lessons_completed: await g("SELECT COUNT(*) n FROM progress"),
    new_students_30d: await g("SELECT COUNT(*) n FROM users WHERE role = 'student' AND created_at > datetime('now','-30 days')"),
    revenue_30d_cents: await g("SELECT COALESCE(SUM(amount_cents),0) n FROM installments WHERE status = 'paid' AND paid_at > datetime('now','-30 days')"),
    byCourse: await q.all(`SELECT c.id, c.title, c.slug, (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) enrolled,
      (SELECT COUNT(*) FROM certificates x WHERE x.course_id = c.id) certified,
      (SELECT COALESCE(SUM(i.amount_cents),0) FROM installments i JOIN orders o ON o.id = i.order_id WHERE o.course_id = c.id AND i.status = 'paid') revenue_cents FROM courses c ORDER BY c.sort`),
    recent: await q.all("SELECT u.name, u.email, u.created_at FROM users u WHERE role = 'student' ORDER BY id DESC LIMIT 8"),
    overdue: await q.all(`SELECT i.id, i.number, i.amount_cents, i.due_at, u.name, u.email, c.title course_title, o.id order_id FROM installments i JOIN orders o ON o.id = i.order_id JOIN users u ON u.id = o.user_id JOIN courses c ON c.id = o.course_id
      WHERE i.status = 'pending' AND o.status = 'active' AND i.due_at < datetime('now') ORDER BY i.due_at LIMIT 50`),
  };
});
route("GET", "/api/admin/users", async (c) => {
  requireAdmin(c);
  const s = `%${(c.url.searchParams.get("q") || "").toLowerCase()}%`;
  return q.all(`SELECT u.id, u.email, u.name, u.role, u.created_at, u.last_login_at,
    (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) enrollments,
    (SELECT COUNT(*) FROM progress p WHERE p.user_id = u.id) lessons_done,
    (SELECT COALESCE(SUM(i.amount_cents),0) FROM installments i JOIN orders o ON o.id = i.order_id WHERE o.user_id = u.id AND i.status = 'paid') paid_cents
    FROM users u WHERE lower(u.email) LIKE ? OR lower(u.name) LIKE ? ORDER BY u.id DESC LIMIT 500`, s, s);
});
route("GET", "/api/admin/users/:id", async (c, p) => {
  requireAdmin(c);
  const u = await q.get("SELECT id, email, name, role, created_at, last_login_at FROM users WHERE id = ?", Number(p.id));
  if (!u) throw new HttpError(404, "Utilisateur introuvable");
  const enrollments = [];
  for (const e of await q.all("SELECT e.id, e.source, e.created_at, c.id course_id, c.title, c.slug FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ?", u.id))
    enrollments.push({ ...e, completion: await courseCompletion(u.id, e.course_id), certificate: (await q.get("SELECT code FROM certificates WHERE user_id = ? AND course_id = ?", u.id, e.course_id))?.code || null });
  const orders = [];
  for (const o of await q.all("SELECT o.*, c.title course_title FROM orders o JOIN courses c ON c.id = o.course_id WHERE o.user_id = ? ORDER BY o.id DESC", u.id))
    orders.push({ ...o, installments: await q.all("SELECT * FROM installments WHERE order_id = ? ORDER BY number", o.id) });
  const attempts = await q.all("SELECT a.score_pct, a.passed, a.created_at, z.title FROM quiz_attempts a JOIN quizzes z ON z.id = a.quiz_id WHERE a.user_id = ? ORDER BY a.id DESC LIMIT 50", u.id);
  return { user: u, enrollments, orders, attempts };
});
route("PUT", "/api/admin/users/:id", async (c, p, req) => {
  requireHeader(req); const me = requireAdmin(c);
  const b = await readJson(req);
  const id = Number(p.id);
  if (b.role && ["student", "admin"].includes(b.role)) { if (id === me.id && b.role !== "admin") throw bad("Vous ne pouvez pas retirer votre propre rôle admin"); await q.run("UPDATE users SET role = ? WHERE id = ?", b.role, id); }
  if (b.name) await q.run("UPDATE users SET name = ? WHERE id = ?", String(b.name).trim().slice(0, 80), id);
  if (b.password) { if (!auth.validPassword(b.password)) throw bad("Mot de passe trop court"); await q.run("UPDATE users SET password_hash = ? WHERE id = ?", auth.hashPassword(b.password), id); await q.run("DELETE FROM sessions WHERE user_id = ?", id); }
  return { ok: true };
});
route("POST", "/api/admin/enroll", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const u = await q.get("SELECT id FROM users WHERE id = ? OR email = ?", Number(b.user_id) || 0, String(b.email || "").toLowerCase());
  const course = await q.get("SELECT id FROM courses WHERE id = ?", Number(b.course_id));
  if (!u || !course) throw bad("Utilisateur ou formation introuvable");
  await q.run("INSERT OR IGNORE INTO enrollments(user_id,course_id,source) VALUES(?,?,'manual')", u.id, course.id);
  return { ok: true };
});
route("DELETE", "/api/admin/enroll", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  await q.run("DELETE FROM enrollments WHERE user_id = ? AND course_id = ?", Number(b.user_id), Number(b.course_id));
  return { ok: true };
});
route("POST", "/api/admin/installments/:id/paid", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const i = await q.get("SELECT * FROM installments WHERE id = ?", Number(p.id));
  if (!i) throw new HttpError(404, "Versement introuvable");
  await markInstallmentPaid(i.order_id, i.number, "manual");
  return { ok: true };
});
route("GET", "/api/admin/orders", async (c) => {
  requireAdmin(c);
  return q.all(`SELECT o.id, o.plan, o.status, o.amount_cents, o.currency, o.coupon, o.provider, o.created_at, u.name, u.email, c.title course_title,
    (SELECT COALESCE(SUM(amount_cents),0) FROM installments i WHERE i.order_id = o.id AND i.status = 'paid') paid_cents
    FROM orders o JOIN users u ON u.id = o.user_id JOIN courses c ON c.id = o.course_id ORDER BY o.id DESC LIMIT 500`);
});
route("GET", "/api/admin/coupons", async (c) => { requireAdmin(c); return q.all("SELECT * FROM coupons ORDER BY code"); });
route("POST", "/api/admin/coupons", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const code = String(b.code || "").toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30);
  const pct = Number(b.pct_off);
  if (!code || !(pct >= 1 && pct <= 100)) throw bad("Code ou pourcentage invalide");
  await q.run("INSERT INTO coupons(code,pct_off,active) VALUES(?,?,1) ON CONFLICT(code) DO UPDATE SET pct_off = excluded.pct_off, active = 1", code, pct);
  return { ok: true };
});
route("DELETE", "/api/admin/coupons/:code", async (c, p, req) => { requireHeader(req); requireAdmin(c); await q.run("UPDATE coupons SET active = 0 WHERE code = ?", p.code); return { ok: true }; });
route("GET", "/api/admin/settings", async (c) => { requireAdmin(c); return Object.fromEntries((await q.all("SELECT key, value FROM settings")).map((r) => [r.key, r.value])); });
route("PUT", "/api/admin/settings", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  for (const k of ["brand_name", "support_email", "tagline", "calendly_url", "community_url"]) if (b[k] !== undefined) await setSetting(k, String(b[k]).slice(0, 300));
  return { ok: true };
});
route("GET", "/api/admin/export/students.csv", async (c, p, req, res) => {
  requireAdmin(c);
  const rows = await q.all(`SELECT u.id, u.name, u.email, u.created_at, GROUP_CONCAT(c.title, ' | ') courses FROM users u LEFT JOIN enrollments e ON e.user_id = u.id LEFT JOIN courses c ON c.id = e.course_id WHERE u.role = 'student' GROUP BY u.id ORDER BY u.id`);
  const csv = ["id,nom,courriel,inscrit_le,formations", ...rows.map((r) => [r.id, r.name, r.email, r.created_at, r.courses || ""].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=etudiants.csv" });
  res.end("﻿" + csv);
  return undefined;
});

// Admin — contenu
route("GET", "/api/admin/courses", async (c) => { requireAdmin(c); const out = []; for (const r of await q.all("SELECT * FROM courses ORDER BY sort, id")) out.push(await courseRow(r, c.user)); return out; });
route("GET", "/api/admin/courses/:id", async (c, p) => {
  requireAdmin(c);
  const row = await q.get("SELECT * FROM courses WHERE id = ?", Number(p.id));
  if (!row) throw new HttpError(404, "Formation introuvable");
  const outline = await courseOutline(row, c.user);
  for (const m of outline.modulesList) {
    for (const l of m.lessons) { const full = await q.get("SELECT video_url, content, resources, is_preview FROM lessons WHERE id = ?", l.id); Object.assign(l, full, { resources: safeJson(full.resources, []), is_preview: !!full.is_preview }); }
    if (m.quiz) m.quiz.questions = safeJson((await q.get("SELECT questions FROM quizzes WHERE id = ?", m.quiz.id)).questions, []);
  }
  if (outline.finalExam) outline.finalExam.questions = safeJson((await q.get("SELECT questions FROM quizzes WHERE id = ?", outline.finalExam.id)).questions, []);
  return outline;
});
const COURSE_FIELDS = ["slug", "title", "subtitle", "description", "audience", "level", "hours", "price_cents", "currency", "accent", "published", "featured", "sort"];
route("POST", "/api/admin/courses", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const slug = String(b.slug || b.title || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug || !b.title) throw bad("Titre requis");
  const r = await q.run("INSERT INTO courses(slug,title,subtitle,description,price_cents,currency,published) VALUES(?,?,?,?,?,?,0)", slug, String(b.title), String(b.subtitle || ""), String(b.description || ""), Number(b.price_cents) || 0, String(b.currency || "USD"));
  return { id: r.lastInsertRowid };
});
route("PUT", "/api/admin/courses/:id", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const id = Number(p.id);
  for (const f of COURSE_FIELDS) if (b[f] !== undefined) await q.run(`UPDATE courses SET ${f} = ? WHERE id = ?`, typeof b[f] === "boolean" ? (b[f] ? 1 : 0) : b[f], id);
  for (const f of ["outcomes", "includes"]) if (b[f] !== undefined) await q.run(`UPDATE courses SET ${f} = ? WHERE id = ?`, JSON.stringify(b[f]), id);
  if (b.plan !== undefined) await q.run("UPDATE courses SET plan_json = ? WHERE id = ?", b.plan ? JSON.stringify(b.plan) : "", id);
  return { ok: true };
});
route("DELETE", "/api/admin/courses/:id", async (c, p, req) => { requireHeader(req); requireAdmin(c); await q.run("DELETE FROM courses WHERE id = ?", Number(p.id)); return { ok: true }; });
route("POST", "/api/admin/modules", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const sort = (await q.get("SELECT COALESCE(MAX(sort),-1)+1 s FROM modules WHERE course_id = ?", Number(b.course_id))).s;
  const r = await q.run("INSERT INTO modules(course_id,title,summary,sort) VALUES(?,?,?,?)", Number(b.course_id), String(b.title || "Nouveau module"), String(b.summary || ""), sort);
  return { id: r.lastInsertRowid };
});
route("PUT", "/api/admin/modules/:id", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  for (const f of ["title", "summary", "sort"]) if (b[f] !== undefined) await q.run(`UPDATE modules SET ${f} = ? WHERE id = ?`, b[f], Number(p.id));
  return { ok: true };
});
route("DELETE", "/api/admin/modules/:id", async (c, p, req) => { requireHeader(req); requireAdmin(c); await q.run("DELETE FROM modules WHERE id = ?", Number(p.id)); return { ok: true }; });
route("POST", "/api/admin/lessons", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const sort = (await q.get("SELECT COALESCE(MAX(sort),-1)+1 s FROM lessons WHERE module_id = ?", Number(b.module_id))).s;
  const r = await q.run("INSERT INTO lessons(module_id,title,video_url,content,resources,duration_min,is_preview,sort) VALUES(?,?,?,?,?,?,?,?)",
    Number(b.module_id), String(b.title || "Nouvelle leçon"), String(b.video_url || ""), String(b.content || ""), JSON.stringify(b.resources || []), Number(b.duration_min) || 10, b.is_preview ? 1 : 0, sort);
  return { id: r.lastInsertRowid };
});
route("PUT", "/api/admin/lessons/:id", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const id = Number(p.id);
  for (const f of ["title", "video_url", "content", "duration_min", "sort", "module_id"]) if (b[f] !== undefined) await q.run(`UPDATE lessons SET ${f} = ? WHERE id = ?`, b[f], id);
  if (b.is_preview !== undefined) await q.run("UPDATE lessons SET is_preview = ? WHERE id = ?", b.is_preview ? 1 : 0, id);
  if (b.resources !== undefined) await q.run("UPDATE lessons SET resources = ? WHERE id = ?", JSON.stringify(b.resources), id);
  return { ok: true };
});
route("DELETE", "/api/admin/lessons/:id", async (c, p, req) => { requireHeader(req); requireAdmin(c); await q.run("DELETE FROM lessons WHERE id = ?", Number(p.id)); return { ok: true }; });
route("POST", "/api/admin/quizzes", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const r = await q.run("INSERT INTO quizzes(course_id,module_id,title,pass_pct,questions) VALUES(?,?,?,?,?)", Number(b.course_id), b.module_id ? Number(b.module_id) : null, String(b.title || "Quiz"), Number(b.pass_pct) || 70, JSON.stringify(b.questions || []));
  return { id: r.lastInsertRowid };
});
route("PUT", "/api/admin/quizzes/:id", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  if (b.questions !== undefined) {
    if (!Array.isArray(b.questions) || b.questions.some((x) => !x.q || !Array.isArray(x.options) || x.options.length < 2 || !Number.isInteger(x.answer))) throw bad("Questions invalides");
    await q.run("UPDATE quizzes SET questions = ? WHERE id = ?", JSON.stringify(b.questions), Number(p.id));
  }
  for (const f of ["title", "pass_pct"]) if (b[f] !== undefined) await q.run(`UPDATE quizzes SET ${f} = ? WHERE id = ?`, b[f], Number(p.id));
  return { ok: true };
});
route("DELETE", "/api/admin/quizzes/:id", async (c, p, req) => { requireHeader(req); requireAdmin(c); await q.run("DELETE FROM quizzes WHERE id = ?", Number(p.id)); return { ok: true }; });

// Admin — médias. Deux modes :
//   local : PUT /api/admin/upload?name=fichier.mp4 (flux direct sur disque, servi via /media/… aux inscrits)
//   blob  : le navigateur téléverse directement dans Vercel Blob avec un jeton client, puis enregistre le fichier (POST /api/admin/uploads/register)
route("GET", "/api/admin/uploads", async (c) => { requireAdmin(c); return q.all("SELECT * FROM uploads ORDER BY id DESC LIMIT 500"); });
route("PUT", "/api/admin/upload", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  if (BLOB) throw bad("Ce serveur utilise le stockage Blob : téléversez depuis l'interface");
  const original = String(c.url.searchParams.get("name") || "fichier").slice(0, 150);
  const ext = extname(original).toLowerCase();
  if (!ALLOWED_UPLOAD.has(ext)) throw bad(`Type de fichier non autorisé (${ext || "sans extension"})`);
  const len = Number(req.headers["content-length"] || 0);
  if (len > MAX_UPLOAD) throw new HttpError(413, `Fichier trop volumineux (max ${Math.round(MAX_UPLOAD / 1048576)} Mo)`);
  mkdirSync(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  const path = join(UPLOAD_DIR, filename);
  let size = 0;
  await new Promise((resolve, reject) => {
    const ws = createWriteStream(path);
    req.on("data", (chunk) => { size += chunk.length; if (size > MAX_UPLOAD) { ws.destroy(); req.destroy(); reject(new HttpError(413, "Fichier trop volumineux")); } });
    req.pipe(ws); ws.on("finish", resolve); ws.on("error", reject); req.on("error", reject);
  }).catch((e) => { try { unlinkSync(path); } catch {} throw e; });
  const mime = MIME[ext] || "application/octet-stream";
  const url = `/media/${filename}`;
  const r = await q.run("INSERT INTO uploads(filename,original_name,mime,size_bytes,url) VALUES(?,?,?,?,?)", filename, original, mime, size, url);
  return { id: r.lastInsertRowid, url, filename, size_bytes: size, mime };
});
route("POST", "/api/admin/upload-token", async (c, p, req) => {
  requireAdmin(c);
  if (!BLOB) throw bad("Stockage Blob non configuré");
  const { handleUpload } = await import("@vercel/blob/client");
  const body = await readJson(req);
  const json = await handleUpload({
    body, request: new Request(c.baseUrl + c.url.pathname, { method: "POST", headers: { "content-type": "application/json" } }),
    onBeforeGenerateToken: async (pathname) => {
      const ext = extname(pathname).toLowerCase();
      if (!ALLOWED_UPLOAD.has(ext)) throw new Error(`Type de fichier non autorisé (${ext || "sans extension"})`);
      return { allowedContentTypes: ["video/mp4", "video/webm", "video/quicktime", "application/pdf", "image/png", "image/jpeg", "image/webp", "application/zip", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "application/octet-stream"], addRandomSuffix: true, maximumSizeInBytes: MAX_UPLOAD };
    },
    onUploadCompleted: async () => {},
  });
  return json;
});
route("POST", "/api/admin/uploads/register", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const url = String(b.url || "");
  if (!/^https:\/\/[a-z0-9.-]+\.public\.blob\.vercel-storage\.com\//i.test(url)) throw bad("URL de média invalide");
  const filename = url.split("/").pop();
  const ext = extname(filename).toLowerCase();
  await q.run("INSERT OR IGNORE INTO uploads(filename,original_name,mime,size_bytes,url) VALUES(?,?,?,?,?)", url, String(b.name || filename).slice(0, 150), String(b.mime || MIME[ext] || "application/octet-stream"), Number(b.size) || 0, url);
  const row = await q.get("SELECT * FROM uploads WHERE filename = ?", url);
  return { id: row.id, url, filename: row.filename, size_bytes: row.size_bytes, mime: row.mime };
});
route("DELETE", "/api/admin/uploads/:id", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const u = await q.get("SELECT * FROM uploads WHERE id = ?", Number(p.id));
  if (u) {
    if (u.url.startsWith("https://") && BLOB) { try { const { del } = await import("@vercel/blob"); await del(u.url); } catch (e) { console.error("blob del", e.message); } }
    else { try { unlinkSync(join(UPLOAD_DIR, u.filename)); } catch {} }
    await q.run("DELETE FROM uploads WHERE id = ?", u.id);
  }
  return { ok: true };
});

// ---------- Fichiers : médias protégés (avec Range pour la vidéo) et statiques ----------
function streamFile(req, res, path, mime, { cache = "no-store" } = {}) {
  const st = statSync(path);
  const range = req.headers.range;
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", cache);
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? Number(m[1]) : 0;
    const end = m && m[2] ? Number(m[2]) : st.size - 1;
    if (start >= st.size || end >= st.size || start > end) { res.writeHead(416, { "Content-Range": `bytes */${st.size}` }); return res.end(); }
    res.writeHead(206, { "Content-Type": mime, "Content-Length": end - start + 1, "Content-Range": `bytes ${start}-${end}/${st.size}` });
    return createReadStream(path, { start, end }).pipe(res);
  }
  res.writeHead(200, { "Content-Type": mime, "Content-Length": st.size });
  createReadStream(path).pipe(res);
}
async function serveMedia(req, res, c, filename) {
  const up = await q.get("SELECT * FROM uploads WHERE filename = ?", filename);
  if (!up) return html(res, 404, "Fichier introuvable");
  const lessons = await q.all("SELECT l.is_preview, m.course_id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE l.video_url LIKE ? OR l.resources LIKE ?", `%/media/${filename}%`, `%/media/${filename}%`);
  let allowed = c.user?.role === "admin";
  for (const l of lessons) if (!allowed && (l.is_preview || (c.user && (await isEnrolled(c.user.id, l.course_id))))) allowed = true;
  if (!allowed) return html(res, 403, "Accès réservé aux inscrits");
  const path = join(UPLOAD_DIR, filename);
  if (!existsSync(path)) return html(res, 404, "Fichier manquant");
  streamFile(req, res, path, up.mime, { cache: "private, max-age=3600" });
}
async function serveStatic(req, res, pathname) {
  const rel = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const path = join(PUBLIC, rel);
  if (!path.startsWith(PUBLIC)) return html(res, 403, "Interdit");
  if (existsSync(path) && statSync(path).isFile()) {
    const ext = extname(path).toLowerCase();
    return streamFile(req, res, path, MIME[ext] || "application/octet-stream", { cache: ext === ".html" ? "no-cache" : "public, max-age=3600" });
  }
  const index = await readFile(join(PUBLIC, "index.html"), "utf8");
  html(res, 200, index, { "Cache-Control": "no-cache" });
}

// ---------- Démarrage (schéma + catalogue) ----------
let ready;
export function ensureReady() {
  if (!ready) ready = (async () => {
    await openDb();
    if (!(await q.get("SELECT 1 FROM courses LIMIT 1"))) { console.log("Base vide : chargement du catalogue…"); await seed(); }
  })().catch((e) => { ready = undefined; throw e; });
  return ready;
}

// ---------- Gestionnaire HTTP (utilisé par createServer et par Vercel) ----------
export async function handler(req, res) {
  security(res);
  let pathname = "/";
  // Diagnostic sans base de données (utile sur un hébergeur sans accès aux journaux).
  if (/^\/api\/diag(\?|$)/.test(req.url) || /__path=api%2Fdiag|__path=api\/diag/.test(req.url)) {
    const out = { node: process.version, cwd: process.cwd(), db: isPg ? "postgres" : "sqlite", blob: BLOB, stripe: stripeEnabled(), publicDir: existsSync(join(PUBLIC, "index.html")), contentDir: existsSync(join(here, "content", "index.mjs")) };
    try { await openDb(); out.dbOk = true; out.courses = (await q.get("SELECT COUNT(*) n FROM courses")).n; } catch (e) { out.dbOk = false; out.dbError = String(e && e.message || e); }
    return send(res, 200, out);
  }
  try {
    await ensureReady();
    const c = await ctx(req);
    pathname = c.url.pathname;
    if (pathname.startsWith("/api/")) {
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const m = r.re.exec(pathname);
        if (!m) continue;
        const params = Object.fromEntries(Object.entries(m.groups || {}).map(([k, v]) => [k, decodeURIComponent(v)]));
        const out = await r.handler(c, params, req, res);
        if (out === undefined) return;
        if (out && out.__headers) return send(res, 200, out.__body, out.__headers);
        return send(res, 200, out);
      }
      return send(res, 404, { error: "Route introuvable" });
    }
    if (pathname.startsWith("/media/")) return serveMedia(req, res, c, pathname.slice(7));
    if (pathname.startsWith("/certificat/")) {
      const page = await certificateHtml(pathname.slice(12), await getSetting("brand_name", "The 1%"));
      return page ? html(res, 200, page) : html(res, 404, "<h1>Certificat introuvable</h1>");
    }
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { error: "Méthode non autorisée" });
    return serveStatic(req, res, pathname);
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error(e);
    if (pathname.startsWith("/api/")) return send(res, status, { error: status >= 500 ? "Erreur interne" : e.message });
    return html(res, status, `<h1>${status}</h1><p>${status >= 500 ? "Erreur interne" : e.message}</p>`);
  }
}
export const createApp = () => createServer(handler);

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  await ensureReady();
  await auth.purgeExpiredSessions();
  setInterval(() => auth.purgeExpiredSessions().catch(() => {}), 6 * 3600e3).unref();
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, () => console.log(`The 1% → http://localhost:${port}  (base : ${isPg ? "Postgres" : "SQLite"}, Stripe : ${stripeEnabled() ? "activé" : "simulation"}, médias : ${BLOB ? "Vercel Blob" : "disque local"})`));
}
