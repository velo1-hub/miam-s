// The 1% — serveur HTTP + API JSON + fichiers statiques. Node ≥ 22.5, aucune dépendance.
//   npm start            (PORT=3000 par défaut)
// Variables : PORT, ACADEMY_DB, BASE_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, UPLOAD_DIR, MAX_UPLOAD_MB
import { createServer } from "node:http";
import { createReadStream, statSync, existsSync, mkdirSync, createWriteStream, unlinkSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { openDb, q, getSetting, setSetting } from "./src/db.mjs";
import * as auth from "./src/auth.mjs";
import { createOrder, checkoutUrl, markInstallmentPaid, verifyStripeSignature, stripeEnabled } from "./src/payments.mjs";
import { courseCompletion, issueIfComplete, certificateHtml } from "./src/certificates.mjs";
import { seed } from "./src/seed.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(here, "public");
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(here, "data", "uploads");
const MAX_UPLOAD = (Number(process.env.MAX_UPLOAD_MB) || 2048) * 1024 * 1024;
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime", ".pdf": "application/pdf", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
const ALLOWED_UPLOAD = new Set([".mp4", ".webm", ".mov", ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".zip", ".xlsx", ".csv"]);

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const bad = (m) => new HttpError(400, m);
const withHeaders = (body, headers) => ({ __body: body, __headers: headers });
const safeJson = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };

// ---------- Réponses ----------
function send(res, status, body, headers = {}) {
  const h = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers };
  res.writeHead(status, h);
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
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new HttpError(413, "Corps trop volumineux");
    chunks.push(c);
  }
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
function ctx(req) {
  const url = new URL(req.url, "http://x");
  const cookies = auth.parseCookies(req.headers.cookie);
  const user = auth.userFromToken(cookies[auth.COOKIE]);
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const baseUrl = process.env.BASE_URL || `${proto}://${host}`;
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "?";
  return { url, cookies, user, baseUrl, ip, secure: proto === "https", token: cookies[auth.COOKIE] };
}
const requireUser = (c) => { if (!c.user) throw new HttpError(401, "Connexion requise"); return c.user; };
const requireAdmin = (c) => { const u = requireUser(c); if (u.role !== "admin") throw new HttpError(403, "Réservé à l'administration"); return u; };
// Protection CSRF : les requêtes qui modifient l'état exigent un en-tête personnalisé (impossible via un formulaire cross-site).
const requireHeader = (req) => { if (req.headers["x-requested-with"] !== "the1percent") throw new HttpError(403, "En-tête X-Requested-With manquant"); };

// ---------- Données ----------
function courseRow(c, user) {
  const counts = q.get("SELECT COUNT(DISTINCT m.id) modules, COUNT(l.id) lessons, COALESCE(SUM(l.duration_min),0) minutes FROM modules m LEFT JOIN lessons l ON l.module_id = m.id WHERE m.course_id = ?", c.id);
  const quizzes = q.get("SELECT COUNT(*) n FROM quizzes WHERE course_id = ?", c.id).n;
  const enrolled = user ? Boolean(q.get("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?", user.id, c.id)) : false;
  const out = {
    id: c.id, slug: c.slug, title: c.title, subtitle: c.subtitle, description: c.description, audience: c.audience,
    outcomes: safeJson(c.outcomes, []), includes: safeJson(c.includes, []), level: c.level, hours: c.hours,
    price_cents: c.price_cents, currency: c.currency, accent: c.accent, featured: !!c.featured, published: !!c.published,
    plan: c.plan_json ? safeJson(c.plan_json, null) : null, modules: counts.modules, lessons: counts.lessons, minutes: counts.minutes, quizzes,
    enrolled, progress: enrolled ? courseCompletion(user.id, c.id) : null,
  };
  return out;
}

function courseOutline(c, user) {
  const enrolled = user ? Boolean(q.get("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?", user.id, c.id)) : false;
  const admin = user?.role === "admin";
  const done = new Set(user ? q.all("SELECT lesson_id FROM progress WHERE user_id = ?", user.id).map((r) => r.lesson_id) : []);
  const modules = q.all("SELECT * FROM modules WHERE course_id = ? ORDER BY sort, id", c.id).map((m) => {
    const lessons = q.all("SELECT id, title, duration_min, is_preview, sort, video_url != '' AS has_video FROM lessons WHERE module_id = ? ORDER BY sort, id", m.id).map((l) => ({
      id: l.id, title: l.title, duration_min: l.duration_min, is_preview: !!l.is_preview, has_video: !!l.has_video, done: done.has(l.id), locked: !(enrolled || admin || l.is_preview),
    }));
    const quiz = q.get("SELECT id, title, pass_pct FROM quizzes WHERE module_id = ?", m.id);
    const best = quiz && user ? q.get("SELECT MAX(score_pct) score, MAX(passed) passed FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?", user.id, quiz.id) : null;
    return { id: m.id, title: m.title, summary: m.summary, lessons, quiz: quiz ? { ...quiz, best: best?.score ?? null, passed: !!best?.passed } : null };
  });
  const finalQ = q.get("SELECT id, title, pass_pct FROM quizzes WHERE course_id = ? AND module_id IS NULL", c.id);
  const finalBest = finalQ && user ? q.get("SELECT MAX(score_pct) score, MAX(passed) passed FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?", user.id, finalQ.id) : null;
  const cert = user ? q.get("SELECT code, issued_at FROM certificates WHERE user_id = ? AND course_id = ?", user.id, c.id) : null;
  const order = user ? q.get("SELECT id, plan, status, amount_cents, currency FROM orders WHERE user_id = ? AND course_id = ? AND status IN ('active','paid','pending') ORDER BY id DESC LIMIT 1", user.id, c.id) : null;
  const installments = order ? q.all("SELECT number, label, amount_cents, due_at, status, paid_at FROM installments WHERE order_id = ? ORDER BY number", order.id) : [];
  return { ...courseRow(c, user), modulesList: modules, finalExam: finalQ ? { ...finalQ, best: finalBest?.score ?? null, passed: !!finalBest?.passed } : null, certificate: cert || null, order: order ? { ...order, installments } : null };
}

function canAccessLesson(lesson, user) {
  if (lesson.is_preview) return true;
  if (!user) return false;
  if (user.role === "admin") return true;
  const m = q.get("SELECT course_id FROM modules WHERE id = ?", lesson.module_id);
  return Boolean(q.get("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?", user.id, m.course_id));
}

// ---------- Routeur ----------
const routes = [];
const route = (method, pattern, handler) => routes.push({ method, re: new RegExp("^" + pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$"), handler });

// Public
route("GET", "/api/health", () => ({ ok: true, stripe: stripeEnabled() }));
route("GET", "/api/config", () => ({ brand: getSetting("brand_name", "The 1%"), supportEmail: getSetting("support_email", ""), stripe: stripeEnabled(), currency: "USD" }));
route("GET", "/api/courses", (c) => q.all("SELECT * FROM courses WHERE published = 1 ORDER BY sort, id").map((r) => courseRow(r, c.user)));
route("GET", "/api/courses/:slug", (c, p) => {
  const row = q.get("SELECT * FROM courses WHERE slug = ? AND (published = 1 OR ? = 'admin')", p.slug, c.user?.role || "");
  if (!row) throw new HttpError(404, "Formation introuvable");
  return courseOutline(row, c.user);
});
route("GET", "/api/lessons/:id", (c, p) => {
  const l = q.get("SELECT * FROM lessons WHERE id = ?", Number(p.id));
  if (!l) throw new HttpError(404, "Leçon introuvable");
  if (!canAccessLesson(l, c.user)) throw new HttpError(403, "Inscrivez-vous pour accéder à cette leçon");
  const m = q.get("SELECT m.*, c.slug course_slug, c.title course_title FROM modules m JOIN courses c ON c.id = m.course_id WHERE m.id = ?", l.module_id);
  const siblings = q.all("SELECT l.id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ? ORDER BY m.sort, m.id, l.sort, l.id", m.course_id).map((r) => r.id);
  const i = siblings.indexOf(l.id);
  const comments = q.all("SELECT c.id, c.body, c.created_at, u.name, u.role FROM comments c JOIN users u ON u.id = c.user_id WHERE c.lesson_id = ? ORDER BY c.id DESC LIMIT 100", l.id);
  const done = c.user ? Boolean(q.get("SELECT 1 FROM progress WHERE user_id = ? AND lesson_id = ?", c.user.id, l.id)) : false;
  return { id: l.id, title: l.title, video_url: l.video_url, content: l.content, resources: safeJson(l.resources, []), duration_min: l.duration_min, is_preview: !!l.is_preview,
    module: { id: m.id, title: m.title }, course: { slug: m.course_slug, title: m.course_title }, prev: siblings[i - 1] || null, next: siblings[i + 1] || null, done, comments };
});
route("GET", "/api/certificates/:code", (c, p) => {
  const r = q.get("SELECT c.code, c.issued_at, u.name, co.title FROM certificates c JOIN users u ON u.id = c.user_id JOIN courses co ON co.id = c.course_id WHERE c.code = ?", p.code);
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
  if (q.get("SELECT 1 FROM users WHERE email = ?", email)) throw new HttpError(409, "Un compte existe déjà avec ce courriel");
  const r = q.run("INSERT INTO users(email,name,password_hash) VALUES(?,?,?)", email, name, auth.hashPassword(b.password));
  const s = auth.createSession(Number(r.lastInsertRowid));
  return withHeaders({ user: auth.userFromToken(s.token) }, { "Set-Cookie": auth.sessionCookie(s.token, s.expires, c.secure) });
});
route("POST", "/api/auth/login", async (c, p, req) => {
  requireHeader(req);
  if (!auth.rateLimit(`login:${c.ip}`, 20)) throw new HttpError(429, "Trop de tentatives, réessayez dans 10 minutes");
  const b = await readJson(req);
  const email = String(b.email || "").trim().toLowerCase();
  const u = q.get("SELECT * FROM users WHERE email = ?", email);
  if (!u || !auth.verifyPassword(String(b.password || ""), u.password_hash)) throw new HttpError(401, "Courriel ou mot de passe incorrect");
  const s = auth.createSession(u.id);
  return withHeaders({ user: auth.userFromToken(s.token) }, { "Set-Cookie": auth.sessionCookie(s.token, s.expires, c.secure) });
});
route("POST", "/api/auth/logout", (c, p, req) => { requireHeader(req); auth.destroySession(c.token); return withHeaders({ ok: true }, { "Set-Cookie": auth.clearCookie() }); });
route("GET", "/api/me", (c) => ({ user: c.user }));
route("PUT", "/api/me", async (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  const b = await readJson(req);
  if (b.name !== undefined) { const name = String(b.name).trim().slice(0, 80); if (name.length < 2) throw bad("Nom requis"); q.run("UPDATE users SET name = ? WHERE id = ?", name, u.id); }
  if (b.password) {
    const row = q.get("SELECT password_hash FROM users WHERE id = ?", u.id);
    if (!auth.verifyPassword(String(b.current_password || ""), row.password_hash)) throw bad("Mot de passe actuel incorrect");
    if (!auth.validPassword(b.password)) throw bad("Nouveau mot de passe : 8 caractères minimum");
    q.run("UPDATE users SET password_hash = ? WHERE id = ?", auth.hashPassword(b.password), u.id);
  }
  return { user: auth.userFromToken(c.token) };
});
route("POST", "/api/auth/forgot", async (c, p, req) => {
  requireHeader(req);
  if (!auth.rateLimit(`forgot:${c.ip}`, 5)) throw new HttpError(429, "Trop de tentatives");
  const b = await readJson(req);
  const u = q.get("SELECT id FROM users WHERE email = ?", String(b.email || "").trim().toLowerCase());
  if (u) {
    const token = randomBytes(24).toString("base64url");
    q.run("INSERT INTO password_resets(token,user_id,expires_at) VALUES(?,?,?)", token, u.id, new Date(Date.now() + 3600e3).toISOString());
    // Sans service de courriel configuré, le lien est consigné pour que l'admin le transmette (voir README).
    console.log(`[reset] ${c.baseUrl}/reinitialiser/${token}`);
  }
  return { ok: true };
});
route("POST", "/api/auth/reset", async (c, p, req) => {
  requireHeader(req);
  const b = await readJson(req);
  const r = q.get("SELECT * FROM password_resets WHERE token = ? AND expires_at > datetime('now')", String(b.token || ""));
  if (!r) throw bad("Lien expiré ou invalide");
  if (!auth.validPassword(b.password)) throw bad("Mot de passe : 8 caractères minimum");
  q.run("UPDATE users SET password_hash = ? WHERE id = ?", auth.hashPassword(b.password), r.user_id);
  q.run("DELETE FROM password_resets WHERE user_id = ?", r.user_id);
  q.run("DELETE FROM sessions WHERE user_id = ?", r.user_id);
  return { ok: true };
});

// Étudiant
route("GET", "/api/dashboard", (c) => {
  const u = requireUser(c);
  const courses = q.all("SELECT c.* FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? ORDER BY e.id DESC", u.id).map((r) => {
    const next = q.get(`SELECT l.id, l.title FROM lessons l JOIN modules m ON m.id = l.module_id
      WHERE m.course_id = ? AND l.id NOT IN (SELECT lesson_id FROM progress WHERE user_id = ?) ORDER BY m.sort, m.id, l.sort, l.id LIMIT 1`, r.id, u.id);
    const cert = q.get("SELECT code FROM certificates WHERE user_id = ? AND course_id = ?", u.id, r.id);
    return { ...courseRow(r, u), nextLesson: next || null, certificate: cert?.code || null };
  });
  const orders = q.all("SELECT o.id, o.plan, o.status, o.amount_cents, o.currency, o.created_at, c.title course_title, c.slug course_slug FROM orders o JOIN courses c ON c.id = o.course_id WHERE o.user_id = ? ORDER BY o.id DESC", u.id)
    .map((o) => ({ ...o, installments: q.all("SELECT number, label, amount_cents, due_at, status, paid_at FROM installments WHERE order_id = ? ORDER BY number", o.id) }));
  const minutes = q.get("SELECT COALESCE(SUM(l.duration_min),0) m FROM progress p JOIN lessons l ON l.id = p.lesson_id WHERE p.user_id = ?", u.id).m;
  return { courses, orders, minutes };
});
route("POST", "/api/lessons/:id/complete", (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  const l = q.get("SELECT * FROM lessons WHERE id = ?", Number(p.id));
  if (!l || !canAccessLesson(l, u)) throw new HttpError(403, "Accès refusé");
  q.run("INSERT OR IGNORE INTO progress(user_id,lesson_id) VALUES(?,?)", u.id, l.id);
  const m = q.get("SELECT course_id FROM modules WHERE id = ?", l.module_id);
  const cert = issueIfComplete(u.id, m.course_id);
  return { ok: true, completion: courseCompletion(u.id, m.course_id), certificate: cert?.code || null };
});
route("DELETE", "/api/lessons/:id/complete", (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  q.run("DELETE FROM progress WHERE user_id = ? AND lesson_id = ?", u.id, Number(p.id));
  return { ok: true };
});
route("POST", "/api/lessons/:id/comments", async (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  const l = q.get("SELECT * FROM lessons WHERE id = ?", Number(p.id));
  if (!l || !canAccessLesson(l, u)) throw new HttpError(403, "Accès refusé");
  const b = await readJson(req);
  const body = String(b.body || "").trim().slice(0, 2000);
  if (body.length < 2) throw bad("Message vide");
  if (!auth.rateLimit(`comment:${u.id}`, 30)) throw new HttpError(429, "Trop de messages");
  q.run("INSERT INTO comments(lesson_id,user_id,body) VALUES(?,?,?)", l.id, u.id, body);
  return { ok: true };
});
route("GET", "/api/quizzes/:id", (c, p) => {
  const u = requireUser(c);
  const z = q.get("SELECT * FROM quizzes WHERE id = ?", Number(p.id));
  if (!z) throw new HttpError(404, "Quiz introuvable");
  if (u.role !== "admin" && !q.get("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?", u.id, z.course_id)) throw new HttpError(403, "Inscription requise");
  const questions = safeJson(z.questions, []).map((qq) => ({ q: qq.q, options: qq.options }));
  const attempts = q.all("SELECT score_pct, passed, created_at FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? ORDER BY id DESC LIMIT 10", u.id, z.id);
  const course = q.get("SELECT slug, title FROM courses WHERE id = ?", z.course_id);
  return { id: z.id, title: z.title, pass_pct: z.pass_pct, questions, attempts, course, isFinal: z.module_id === null };
});
route("POST", "/api/quizzes/:id/attempt", async (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  const z = q.get("SELECT * FROM quizzes WHERE id = ?", Number(p.id));
  if (!z) throw new HttpError(404, "Quiz introuvable");
  if (u.role !== "admin" && !q.get("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?", u.id, z.course_id)) throw new HttpError(403, "Inscription requise");
  const b = await readJson(req);
  const questions = safeJson(z.questions, []);
  const answers = Array.isArray(b.answers) ? b.answers.map((a) => (Number.isInteger(a) ? a : -1)) : [];
  if (answers.length !== questions.length) throw bad("Répondez à toutes les questions");
  const results = questions.map((qq, i) => ({ correct: qq.answer === answers[i], answer: qq.answer, why: qq.why || "" }));
  const score = Math.round((results.filter((r) => r.correct).length / questions.length) * 100);
  const passed = score >= z.pass_pct ? 1 : 0;
  q.run("INSERT INTO quiz_attempts(user_id,quiz_id,score_pct,passed,answers) VALUES(?,?,?,?,?)", u.id, z.id, score, passed, JSON.stringify(answers));
  const cert = issueIfComplete(u.id, z.course_id);
  return { score, passed: !!passed, results, certificate: cert?.code || null, completion: courseCompletion(u.id, z.course_id) };
});

// Paiement / inscription
route("POST", "/api/checkout", async (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  const b = await readJson(req);
  const course = q.get("SELECT * FROM courses WHERE id = ? AND published = 1", Number(b.course_id));
  if (!course) throw new HttpError(404, "Formation introuvable");
  if (q.get("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?", u.id, course.id)) throw bad("Vous êtes déjà inscrit");
  if (course.price_cents === 0) {
    q.run("INSERT OR IGNORE INTO enrollments(user_id,course_id,source) VALUES(?,?,'free')", u.id, course.id);
    return { enrolled: true, redirect: `/apprendre/${course.slug}` };
  }
  const pending = q.get("SELECT id FROM orders WHERE user_id = ? AND course_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1", u.id, course.id);
  const order = pending ? { orderId: pending.id } : createOrder({ user: u, course, plan: b.plan === "3x" ? "3x" : "full", coupon: b.coupon ? String(b.coupon).trim() : "" });
  const out = await checkoutUrl({ orderId: order.orderId, installmentNumber: 1, course, user: u, baseUrl: c.baseUrl });
  return { enrolled: false, order_id: order.orderId, ...out };
});
route("POST", "/api/orders/:id/pay/:n", async (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  const o = q.get("SELECT * FROM orders WHERE id = ? AND user_id = ?", Number(p.id), u.id);
  if (!o) throw new HttpError(404, "Commande introuvable");
  const course = q.get("SELECT * FROM courses WHERE id = ?", o.course_id);
  return checkoutUrl({ orderId: o.id, installmentNumber: Number(p.n), course, user: u, baseUrl: c.baseUrl });
});
// Simulation de paiement (uniquement quand Stripe n'est pas configuré) : remplace la page Stripe en démo.
route("POST", "/api/checkout/simulate", async (c, p, req) => {
  requireHeader(req); const u = requireUser(c);
  if (stripeEnabled()) throw new HttpError(403, "Simulation désactivée : Stripe est configuré");
  const b = await readJson(req);
  const o = q.get("SELECT * FROM orders WHERE id = ? AND user_id = ?", Number(b.order_id), u.id);
  if (!o) throw new HttpError(404, "Commande introuvable");
  const r = markInstallmentPaid(o.id, Number(b.n) || 1, `sim_${Date.now()}`);
  const course = q.get("SELECT slug FROM courses WHERE id = ?", o.course_id);
  return { ok: true, remaining: r.remaining, redirect: `/apprendre/${course.slug}` };
});
route("POST", "/api/stripe/webhook", async (c, p, req, res) => {
  const raw = (await readBody(req)).toString("utf8");
  if (!verifyStripeSignature(raw, req.headers["stripe-signature"])) throw new HttpError(400, "Signature invalide");
  const ev = safeJson(raw, {});
  if (ev.type === "checkout.session.completed") {
    const s = ev.data?.object || {};
    const [orderId, n] = String(s.client_reference_id || "").split(":").map(Number);
    if (orderId && n && s.payment_status === "paid") markInstallmentPaid(orderId, n, s.payment_intent || s.id);
  }
  return { received: true };
});

// Admin
route("GET", "/api/admin/stats", (c) => {
  requireAdmin(c);
  const g = (sql, ...a) => q.get(sql, ...a);
  return {
    students: g("SELECT COUNT(*) n FROM users WHERE role = 'student'").n,
    enrollments: g("SELECT COUNT(*) n FROM enrollments").n,
    revenue_cents: g("SELECT COALESCE(SUM(amount_cents),0) n FROM installments WHERE status = 'paid'").n,
    outstanding_cents: g("SELECT COALESCE(SUM(i.amount_cents),0) n FROM installments i JOIN orders o ON o.id = i.order_id WHERE i.status = 'pending' AND o.status = 'active'").n,
    certificates: g("SELECT COUNT(*) n FROM certificates").n,
    lessons_completed: g("SELECT COUNT(*) n FROM progress").n,
    new_students_30d: g("SELECT COUNT(*) n FROM users WHERE role = 'student' AND created_at > datetime('now','-30 days')").n,
    revenue_30d_cents: g("SELECT COALESCE(SUM(amount_cents),0) n FROM installments WHERE status = 'paid' AND paid_at > datetime('now','-30 days')").n,
    byCourse: q.all(`SELECT c.id, c.title, c.slug, (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) enrolled,
      (SELECT COUNT(*) FROM certificates x WHERE x.course_id = c.id) certified,
      (SELECT COALESCE(SUM(i.amount_cents),0) FROM installments i JOIN orders o ON o.id = i.order_id WHERE o.course_id = c.id AND i.status = 'paid') revenue_cents FROM courses c ORDER BY c.sort`),
    recent: q.all("SELECT u.name, u.email, u.created_at FROM users u WHERE role = 'student' ORDER BY id DESC LIMIT 8"),
    overdue: q.all(`SELECT i.id, i.number, i.amount_cents, i.due_at, u.name, u.email, c.title course_title, o.id order_id FROM installments i JOIN orders o ON o.id = i.order_id JOIN users u ON u.id = o.user_id JOIN courses c ON c.id = o.course_id
      WHERE i.status = 'pending' AND o.status = 'active' AND i.due_at < datetime('now') ORDER BY i.due_at LIMIT 50`),
  };
});
route("GET", "/api/admin/users", (c) => {
  requireAdmin(c);
  const s = `%${(c.url.searchParams.get("q") || "").toLowerCase()}%`;
  return q.all(`SELECT u.id, u.email, u.name, u.role, u.created_at, u.last_login_at,
    (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) enrollments,
    (SELECT COUNT(*) FROM progress p WHERE p.user_id = u.id) lessons_done,
    (SELECT COALESCE(SUM(i.amount_cents),0) FROM installments i JOIN orders o ON o.id = i.order_id WHERE o.user_id = u.id AND i.status = 'paid') paid_cents
    FROM users u WHERE lower(u.email) LIKE ? OR lower(u.name) LIKE ? ORDER BY u.id DESC LIMIT 500`, s, s);
});
route("GET", "/api/admin/users/:id", (c, p) => {
  requireAdmin(c);
  const u = q.get("SELECT id, email, name, role, created_at, last_login_at FROM users WHERE id = ?", Number(p.id));
  if (!u) throw new HttpError(404, "Utilisateur introuvable");
  const enrollments = q.all("SELECT e.id, e.source, e.created_at, c.id course_id, c.title, c.slug FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ?", u.id)
    .map((e) => ({ ...e, completion: courseCompletion(u.id, e.course_id), certificate: q.get("SELECT code FROM certificates WHERE user_id = ? AND course_id = ?", u.id, e.course_id)?.code || null }));
  const orders = q.all("SELECT o.*, c.title course_title FROM orders o JOIN courses c ON c.id = o.course_id WHERE o.user_id = ? ORDER BY o.id DESC", u.id)
    .map((o) => ({ ...o, installments: q.all("SELECT * FROM installments WHERE order_id = ? ORDER BY number", o.id) }));
  const attempts = q.all("SELECT a.score_pct, a.passed, a.created_at, z.title FROM quiz_attempts a JOIN quizzes z ON z.id = a.quiz_id WHERE a.user_id = ? ORDER BY a.id DESC LIMIT 50", u.id);
  return { user: u, enrollments, orders, attempts };
});
route("PUT", "/api/admin/users/:id", async (c, p, req) => {
  requireHeader(req); const me = requireAdmin(c);
  const b = await readJson(req);
  const id = Number(p.id);
  if (b.role && ["student", "admin"].includes(b.role)) { if (id === me.id && b.role !== "admin") throw bad("Vous ne pouvez pas retirer votre propre rôle admin"); q.run("UPDATE users SET role = ? WHERE id = ?", b.role, id); }
  if (b.name) q.run("UPDATE users SET name = ? WHERE id = ?", String(b.name).trim().slice(0, 80), id);
  if (b.password) { if (!auth.validPassword(b.password)) throw bad("Mot de passe trop court"); q.run("UPDATE users SET password_hash = ? WHERE id = ?", auth.hashPassword(b.password), id); q.run("DELETE FROM sessions WHERE user_id = ?", id); }
  return { ok: true };
});
route("POST", "/api/admin/enroll", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const u = q.get("SELECT id FROM users WHERE id = ? OR email = ?", Number(b.user_id) || 0, String(b.email || "").toLowerCase());
  const course = q.get("SELECT id FROM courses WHERE id = ?", Number(b.course_id));
  if (!u || !course) throw bad("Utilisateur ou formation introuvable");
  q.run("INSERT OR IGNORE INTO enrollments(user_id,course_id,source) VALUES(?,?,'manual')", u.id, course.id);
  return { ok: true };
});
route("DELETE", "/api/admin/enroll", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  q.run("DELETE FROM enrollments WHERE user_id = ? AND course_id = ?", Number(b.user_id), Number(b.course_id));
  return { ok: true };
});
route("POST", "/api/admin/installments/:id/paid", (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const i = q.get("SELECT * FROM installments WHERE id = ?", Number(p.id));
  if (!i) throw new HttpError(404, "Versement introuvable");
  markInstallmentPaid(i.order_id, i.number, "manual");
  return { ok: true };
});
route("GET", "/api/admin/orders", (c) => {
  requireAdmin(c);
  return q.all(`SELECT o.id, o.plan, o.status, o.amount_cents, o.currency, o.coupon, o.provider, o.created_at, u.name, u.email, c.title course_title,
    (SELECT COALESCE(SUM(amount_cents),0) FROM installments i WHERE i.order_id = o.id AND i.status = 'paid') paid_cents
    FROM orders o JOIN users u ON u.id = o.user_id JOIN courses c ON c.id = o.course_id ORDER BY o.id DESC LIMIT 500`);
});
route("GET", "/api/admin/coupons", (c) => { requireAdmin(c); return q.all("SELECT * FROM coupons ORDER BY code"); });
route("POST", "/api/admin/coupons", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const code = String(b.code || "").toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30);
  const pct = Number(b.pct_off);
  if (!code || !(pct >= 1 && pct <= 100)) throw bad("Code ou pourcentage invalide");
  q.run("INSERT INTO coupons(code,pct_off,active) VALUES(?,?,1) ON CONFLICT(code) DO UPDATE SET pct_off = excluded.pct_off, active = 1", code, pct);
  return { ok: true };
});
route("DELETE", "/api/admin/coupons/:code", (c, p, req) => { requireHeader(req); requireAdmin(c); q.run("UPDATE coupons SET active = 0 WHERE code = ?", p.code); return { ok: true }; });
route("GET", "/api/admin/settings", (c) => { requireAdmin(c); return Object.fromEntries(q.all("SELECT key, value FROM settings").map((r) => [r.key, r.value])); });
route("PUT", "/api/admin/settings", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  for (const k of ["brand_name", "support_email", "tagline", "calendly_url", "community_url"]) if (b[k] !== undefined) setSetting(k, String(b[k]).slice(0, 300));
  return { ok: true };
});
route("GET", "/api/admin/export/students.csv", (c, p, req, res) => {
  requireAdmin(c);
  const rows = q.all(`SELECT u.id, u.name, u.email, u.created_at, GROUP_CONCAT(c.title, ' | ') courses FROM users u LEFT JOIN enrollments e ON e.user_id = u.id LEFT JOIN courses c ON c.id = e.course_id WHERE u.role = 'student' GROUP BY u.id ORDER BY u.id`);
  const csv = ["id,nom,courriel,inscrit_le,formations", ...rows.map((r) => [r.id, r.name, r.email, r.created_at, r.courses || ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
  res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=etudiants.csv" });
  res.end("﻿" + csv);
  return undefined;
});

// Admin — contenu (cours, modules, leçons, quiz)
route("GET", "/api/admin/courses", (c) => { requireAdmin(c); return q.all("SELECT * FROM courses ORDER BY sort, id").map((r) => courseRow(r, c.user)); });
route("GET", "/api/admin/courses/:id", (c, p) => {
  requireAdmin(c);
  const row = q.get("SELECT * FROM courses WHERE id = ?", Number(p.id));
  if (!row) throw new HttpError(404, "Formation introuvable");
  const outline = courseOutline(row, c.user);
  outline.modulesList = outline.modulesList.map((m) => ({ ...m, lessons: m.lessons.map((l) => ({ ...l, ...q.get("SELECT video_url, content, resources, is_preview FROM lessons WHERE id = ?", l.id), resources: safeJson(q.get("SELECT resources FROM lessons WHERE id = ?", l.id).resources, []) })), quiz: m.quiz ? { ...m.quiz, questions: safeJson(q.get("SELECT questions FROM quizzes WHERE id = ?", m.quiz.id).questions, []) } : null }));
  if (outline.finalExam) outline.finalExam.questions = safeJson(q.get("SELECT questions FROM quizzes WHERE id = ?", outline.finalExam.id).questions, []);
  return outline;
});
const COURSE_FIELDS = ["slug", "title", "subtitle", "description", "audience", "level", "hours", "price_cents", "currency", "accent", "published", "featured", "sort"];
route("POST", "/api/admin/courses", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const slug = String(b.slug || b.title || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug || !b.title) throw bad("Titre requis");
  const r = q.run("INSERT INTO courses(slug,title,subtitle,description,price_cents,currency,published) VALUES(?,?,?,?,?,?,0)", slug, String(b.title), String(b.subtitle || ""), String(b.description || ""), Number(b.price_cents) || 0, String(b.currency || "USD"));
  return { id: Number(r.lastInsertRowid) };
});
route("PUT", "/api/admin/courses/:id", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const id = Number(p.id);
  for (const f of COURSE_FIELDS) if (b[f] !== undefined) q.run(`UPDATE courses SET ${f} = ? WHERE id = ?`, typeof b[f] === "boolean" ? (b[f] ? 1 : 0) : b[f], id);
  for (const f of ["outcomes", "includes"]) if (b[f] !== undefined) q.run(`UPDATE courses SET ${f} = ? WHERE id = ?`, JSON.stringify(b[f]), id);
  if (b.plan !== undefined) q.run("UPDATE courses SET plan_json = ? WHERE id = ?", b.plan ? JSON.stringify(b.plan) : "", id);
  return { ok: true };
});
route("DELETE", "/api/admin/courses/:id", (c, p, req) => { requireHeader(req); requireAdmin(c); q.run("DELETE FROM courses WHERE id = ?", Number(p.id)); return { ok: true }; });
route("POST", "/api/admin/modules", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const sort = q.get("SELECT COALESCE(MAX(sort),-1)+1 s FROM modules WHERE course_id = ?", Number(b.course_id)).s;
  const r = q.run("INSERT INTO modules(course_id,title,summary,sort) VALUES(?,?,?,?)", Number(b.course_id), String(b.title || "Nouveau module"), String(b.summary || ""), sort);
  return { id: Number(r.lastInsertRowid) };
});
route("PUT", "/api/admin/modules/:id", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  for (const f of ["title", "summary", "sort"]) if (b[f] !== undefined) q.run(`UPDATE modules SET ${f} = ? WHERE id = ?`, b[f], Number(p.id));
  return { ok: true };
});
route("DELETE", "/api/admin/modules/:id", (c, p, req) => { requireHeader(req); requireAdmin(c); q.run("DELETE FROM modules WHERE id = ?", Number(p.id)); return { ok: true }; });
route("POST", "/api/admin/lessons", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const sort = q.get("SELECT COALESCE(MAX(sort),-1)+1 s FROM lessons WHERE module_id = ?", Number(b.module_id)).s;
  const r = q.run("INSERT INTO lessons(module_id,title,video_url,content,resources,duration_min,is_preview,sort) VALUES(?,?,?,?,?,?,?,?)",
    Number(b.module_id), String(b.title || "Nouvelle leçon"), String(b.video_url || ""), String(b.content || ""), JSON.stringify(b.resources || []), Number(b.duration_min) || 10, b.is_preview ? 1 : 0, sort);
  return { id: Number(r.lastInsertRowid) };
});
route("PUT", "/api/admin/lessons/:id", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const id = Number(p.id);
  for (const f of ["title", "video_url", "content", "duration_min", "sort", "module_id"]) if (b[f] !== undefined) q.run(`UPDATE lessons SET ${f} = ? WHERE id = ?`, b[f], id);
  if (b.is_preview !== undefined) q.run("UPDATE lessons SET is_preview = ? WHERE id = ?", b.is_preview ? 1 : 0, id);
  if (b.resources !== undefined) q.run("UPDATE lessons SET resources = ? WHERE id = ?", JSON.stringify(b.resources), id);
  return { ok: true };
});
route("DELETE", "/api/admin/lessons/:id", (c, p, req) => { requireHeader(req); requireAdmin(c); q.run("DELETE FROM lessons WHERE id = ?", Number(p.id)); return { ok: true }; });
route("POST", "/api/admin/quizzes", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  const r = q.run("INSERT INTO quizzes(course_id,module_id,title,pass_pct,questions) VALUES(?,?,?,?,?)", Number(b.course_id), b.module_id ? Number(b.module_id) : null, String(b.title || "Quiz"), Number(b.pass_pct) || 70, JSON.stringify(b.questions || []));
  return { id: Number(r.lastInsertRowid) };
});
route("PUT", "/api/admin/quizzes/:id", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const b = await readJson(req);
  if (b.questions !== undefined) {
    if (!Array.isArray(b.questions) || b.questions.some((x) => !x.q || !Array.isArray(x.options) || x.options.length < 2 || !Number.isInteger(x.answer))) throw bad("Questions invalides");
    q.run("UPDATE quizzes SET questions = ? WHERE id = ?", JSON.stringify(b.questions), Number(p.id));
  }
  for (const f of ["title", "pass_pct"]) if (b[f] !== undefined) q.run(`UPDATE quizzes SET ${f} = ? WHERE id = ?`, b[f], Number(p.id));
  return { ok: true };
});
route("DELETE", "/api/admin/quizzes/:id", (c, p, req) => { requireHeader(req); requireAdmin(c); q.run("DELETE FROM quizzes WHERE id = ?", Number(p.id)); return { ok: true }; });

// Admin — téléversement (vidéos, PDF, images) en flux direct vers le disque. PUT /api/admin/upload?name=fichier.mp4
route("GET", "/api/admin/uploads", (c) => { requireAdmin(c); return q.all("SELECT * FROM uploads ORDER BY id DESC LIMIT 500"); });
route("PUT", "/api/admin/upload", async (c, p, req) => {
  requireHeader(req); requireAdmin(c);
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
    req.pipe(ws);
    ws.on("finish", resolve);
    ws.on("error", reject);
    req.on("error", reject);
  }).catch((e) => { try { unlinkSync(path); } catch {} throw e; });
  const mime = MIME[ext] || "application/octet-stream";
  const r = q.run("INSERT INTO uploads(filename,original_name,mime,size_bytes) VALUES(?,?,?,?)", filename, original, mime, size);
  return { id: Number(r.lastInsertRowid), url: `/media/${filename}`, filename, size_bytes: size, mime };
});
route("DELETE", "/api/admin/uploads/:id", (c, p, req) => {
  requireHeader(req); requireAdmin(c);
  const u = q.get("SELECT * FROM uploads WHERE id = ?", Number(p.id));
  if (u) { try { unlinkSync(join(UPLOAD_DIR, u.filename)); } catch {} q.run("DELETE FROM uploads WHERE id = ?", u.id); }
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
    let start = m && m[1] ? Number(m[1]) : 0;
    let end = m && m[2] ? Number(m[2]) : st.size - 1;
    if (start >= st.size || end >= st.size || start > end) { res.writeHead(416, { "Content-Range": `bytes */${st.size}` }); return res.end(); }
    res.writeHead(206, { "Content-Type": mime, "Content-Length": end - start + 1, "Content-Range": `bytes ${start}-${end}/${st.size}` });
    return createReadStream(path, { start, end }).pipe(res);
  }
  res.writeHead(200, { "Content-Type": mime, "Content-Length": st.size });
  createReadStream(path).pipe(res);
}

function serveMedia(req, res, c, filename) {
  const up = q.get("SELECT * FROM uploads WHERE filename = ?", filename);
  if (!up) return html(res, 404, "Fichier introuvable");
  // Un média est accessible si l'utilisateur est admin ou inscrit à une formation dont une leçon le référence (ou si la leçon est un aperçu).
  const lessons = q.all("SELECT l.is_preview, m.course_id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE l.video_url LIKE ? OR l.resources LIKE ?", `%/media/${filename}%`, `%/media/${filename}%`);
  const allowed = c.user?.role === "admin" || lessons.some((l) => l.is_preview || (c.user && q.get("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?", c.user.id, l.course_id)));
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
  // Application monopage : toute autre URL rend index.html
  const index = await readFile(join(PUBLIC, "index.html"), "utf8");
  html(res, 200, index, { "Cache-Control": "no-cache" });
}

// ---------- Serveur ----------
export function createApp() {
  openDb();
  return createServer(async (req, res) => {
    security(res);
    const c = ctx(req);
    const { pathname } = c.url;
    try {
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
        const page = certificateHtml(pathname.slice(12), getSetting("brand_name", "The 1%"));
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
  });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  openDb();
  if (!q.get("SELECT 1 FROM courses LIMIT 1")) { console.log("Base vide : chargement du catalogue…"); seed(); }
  auth.purgeExpiredSessions();
  setInterval(auth.purgeExpiredSessions, 6 * 3600e3).unref();
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, () => console.log(`The 1% → http://localhost:${port}  (Stripe : ${stripeEnabled() ? "activé" : "simulation"})`));
}
