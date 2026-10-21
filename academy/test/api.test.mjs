// Tests de bout en bout de l'API (node --test). Base SQLite temporaire, serveur sur port aléatoire, Stripe en simulation.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "academy-"));
process.env.ACADEMY_DB = join(dir, "test.db");
process.env.UPLOAD_DIR = join(dir, "uploads");
process.env.ADMIN_PASSWORD = "AdminTest-123";
delete process.env.STRIPE_SECRET_KEY;

const { createApp } = await import("../server.mjs");
const { seed } = await import("../src/seed.mjs");
const { closeDb } = await import("../src/db.mjs");

let server, base;
const jars = {};
async function call(who, method, path, body, raw) {
  const headers = { "X-Requested-With": "the1percent" };
  if (jars[who]) headers.Cookie = jars[who];
  const opts = { method, headers };
  if (raw !== undefined) opts.body = raw;
  else if (body !== undefined) { headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
  const res = await fetch(base + path, opts);
  const sc = res.headers.get("set-cookie");
  if (sc) jars[who] = sc.split(";")[0];
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("json") ? await res.json() : await res.text();
  return { status: res.status, data, headers: res.headers };
}

before(async () => {
  await seed({ log: () => {} });
  server = createApp();
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise((r) => server.close(r)); await closeDb(); if (!process.env.DATABASE_URL) rmSync(dir, { recursive: true, force: true }); });

test("catalogue public : 2 formations, programme vedette à 20 000 $ en 3 versements", async () => {
  const r = await call("anon", "GET", "/api/courses");
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const flag = r.data.find((c) => c.slug === "the-1-percent");
  assert.equal(flag.price_cents, 2000000);
  assert.equal(flag.modules, 14);
  assert.equal(flag.lessons, 63);
  assert.deepEqual(flag.plan.installments.map((i) => i.amount_cents), [500000, 500000, 1000000]);
  assert.equal(flag.plan.installments.reduce((s, i) => s + i.amount_cents, 0), flag.price_cents);
});

test("page d'une formation : leçons verrouillées sauf aperçus", async () => {
  const r = await call("anon", "GET", "/api/courses/the-1-percent");
  const lessons = r.data.modulesList.flatMap((m) => m.lessons);
  assert.ok(lessons.filter((l) => l.is_preview).length >= 2);
  assert.ok(lessons.every((l) => l.locked === !l.is_preview));
  assert.equal(r.data.finalExam.pass_pct, 75);
});

test("inscription : validation et création de session", async () => {
  let r = await call("alice", "POST", "/api/auth/register", { name: "Alice", email: "pas-un-courriel", password: "12345678" });
  assert.equal(r.status, 400);
  r = await call("alice", "POST", "/api/auth/register", { name: "Alice Tremblay", email: "alice@example.com", password: "Secret-123" });
  assert.equal(r.status, 200);
  assert.equal(r.data.user.role, "student");
  assert.ok(jars.alice.startsWith("academy_session="));
  r = await call("alice", "POST", "/api/auth/register", { name: "Alice", email: "alice@example.com", password: "Secret-123" });
  assert.equal(r.status, 409);
  r = await call("alice", "GET", "/api/me");
  assert.equal(r.data.user.email, "alice@example.com");
});

test("protection CSRF : les écritures sans en-tête sont refusées", async () => {
  const res = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "x@y.z", password: "x" }) });
  assert.equal(res.status, 403);
});

test("leçon verrouillée refusée, aperçu accessible", async () => {
  const outline = (await call("alice", "GET", "/api/courses/the-1-percent")).data;
  const locked = outline.modulesList.flatMap((m) => m.lessons).find((l) => !l.is_preview);
  const preview = outline.modulesList.flatMap((m) => m.lessons).find((l) => l.is_preview);
  assert.equal((await call("alice", "GET", `/api/lessons/${locked.id}`)).status, 403);
  const r = await call("anon", "GET", `/api/lessons/${preview.id}`);
  assert.equal(r.status, 200);
  assert.ok(r.data.content.length > 500);
});

test("masterclass gratuite : inscription immédiate", async () => {
  const free = (await call("alice", "GET", "/api/courses")).data.find((c) => c.price_cents === 0);
  const r = await call("alice", "POST", "/api/checkout", { course_id: free.id });
  assert.equal(r.data.enrolled, true);
  const d = await call("alice", "GET", "/api/dashboard");
  assert.equal(d.data.courses.length, 1);
});

test("achat en 3 versements (simulation) : accès au 1er versement, échéancier correct, coupon appliqué", async () => {
  const flag = (await call("alice", "GET", "/api/courses")).data.find((c) => c.slug === "the-1-percent");
  let r = await call("alice", "POST", "/api/checkout", { course_id: flag.id, plan: "3x", coupon: "FONDATEUR" });
  assert.equal(r.status, 200);
  assert.equal(r.data.simulated, true);
  assert.ok(r.data.url.includes("/paiement/simulation"));
  const orderId = r.data.order_id;
  // Pas encore inscrit
  assert.equal((await call("alice", "GET", "/api/courses/the-1-percent")).data.enrolled, false);
  r = await call("alice", "POST", "/api/checkout/simulate", { order_id: orderId, n: 1 });
  assert.equal(r.status, 200);
  assert.equal(r.data.remaining, 2);
  const c = (await call("alice", "GET", "/api/courses/the-1-percent")).data;
  assert.equal(c.enrolled, true);
  assert.equal(c.order.plan, "3x");
  assert.equal(c.order.status, "active");
  assert.equal(c.order.amount_cents, 1800000); // −10 % FONDATEUR
  assert.deepEqual(c.order.installments.map((i) => i.status), ["paid", "pending", "pending"]);
  assert.equal(c.order.installments.reduce((s, i) => s + i.amount_cents, 0), 1800000);
  const d2 = new Date(c.order.installments[1].due_at), d3 = new Date(c.order.installments[2].due_at);
  assert.ok(Math.round((d2 - Date.now()) / 864e5) === 30 && Math.round((d3 - Date.now()) / 864e5) === 60);
});

test("un coupon invalide est refusé", async () => {
  await call("bob", "POST", "/api/auth/register", { name: "Bob Gagnon", email: "bob@example.com", password: "Secret-123" });
  const flag = (await call("bob", "GET", "/api/courses")).data.find((c) => c.slug === "the-1-percent");
  const r = await call("bob", "POST", "/api/checkout", { course_id: flag.id, plan: "full", coupon: "NOPE" });
  assert.equal(r.status, 400);
});

test("progression, quiz, examen final et certificat", async () => {
  const c = (await call("alice", "GET", "/api/courses/the-1-percent")).data;
  const lessons = c.modulesList.flatMap((m) => m.lessons);
  for (const l of lessons) assert.equal((await call("alice", "POST", `/api/lessons/${l.id}/complete`)).status, 200);
  let after = (await call("alice", "GET", "/api/courses/the-1-percent")).data;
  assert.equal(after.progress.pct, 100);
  assert.equal(after.certificate, null, "pas de certificat sans les quiz");
  // Quiz : répondre faux puis juste
  const quizIds = [...c.modulesList.map((m) => m.quiz.id), c.finalExam.id];
  for (const id of quizIds) {
    const z = (await call("alice", "GET", `/api/quizzes/${id}`)).data;
    assert.ok(z.questions.every((qq) => qq.answer === undefined), "les bonnes réponses ne sont pas exposées");
    const wrong = await call("alice", "POST", `/api/quizzes/${id}/attempt`, { answers: z.questions.map(() => 99) });
    assert.equal(wrong.data.score, 0);
    assert.equal(wrong.data.passed, false);
    const right = await call("alice", "POST", `/api/quizzes/${id}/attempt`, { answers: wrong.data.results.map((r) => r.answer) });
    assert.equal(right.data.score, 100);
  }
  after = (await call("alice", "GET", "/api/courses/the-1-percent")).data;
  assert.ok(after.certificate?.code.startsWith("1P-"));
  const page = await call("anon", "GET", `/certificat/${after.certificate.code}`);
  assert.equal(page.status, 200);
  assert.ok(page.data.includes("Alice Tremblay"));
  assert.equal((await call("anon", "GET", "/api/certificates/1P-NOPE")).status, 404);
});

test("admin : accès réservé, stats, inscription manuelle, versement marqué payé, export CSV", async () => {
  assert.equal((await call("alice", "GET", "/api/admin/stats")).status, 403);
  let r = await call("admin", "POST", "/api/auth/login", { email: "admin@the1percent.academy", password: "AdminTest-123" });
  assert.equal(r.status, 200);
  const stats = (await call("admin", "GET", "/api/admin/stats")).data;
  assert.equal(stats.students, 2);
  assert.equal(stats.revenue_cents, 450000);
  assert.equal(stats.outstanding_cents, 1350000);
  assert.equal(stats.certificates, 1);
  const users = (await call("admin", "GET", "/api/admin/users?q=bob")).data;
  assert.equal(users.length, 1);
  const flag = (await call("admin", "GET", "/api/admin/courses")).data.find((c) => c.slug === "the-1-percent");
  r = await call("admin", "POST", "/api/admin/enroll", { email: "bob@example.com", course_id: flag.id });
  assert.equal(r.status, 200);
  const bob = (await call("admin", "GET", `/api/admin/users/${users[0].id}`)).data;
  assert.equal(bob.enrollments.length, 1);
  const alice = (await call("admin", "GET", "/api/admin/users?q=alice")).data[0];
  const detail = (await call("admin", "GET", `/api/admin/users/${alice.id}`)).data;
  const pending = detail.orders[0].installments.find((i) => i.status === "pending");
  r = await call("admin", "POST", `/api/admin/installments/${pending.id}/paid`);
  assert.equal(r.status, 200);
  const csv = await call("admin", "GET", "/api/admin/export/students.csv");
  assert.ok(csv.data.includes("alice@example.com"));
});

test("admin : édition du contenu et téléversement de média protégé", async () => {
  const flag = (await call("admin", "GET", "/api/admin/courses")).data.find((c) => c.slug === "the-1-percent");
  const full = (await call("admin", "GET", `/api/admin/courses/${flag.id}`)).data;
  const lesson = full.modulesList[0].lessons[1]; // pas un aperçu ? (leçon 2 du module 1 est un aperçu) → on prend la 3e
  const privateLesson = full.modulesList[0].lessons.find((l) => !l.is_preview);
  // Téléversement
  const payload = Buffer.alloc(1024, 1);
  let r = await call("admin", "PUT", "/api/admin/upload?name=intro.mp4", undefined, payload);
  assert.equal(r.status, 200);
  assert.ok(r.data.url.startsWith("/media/"));
  assert.equal((await call("admin", "PUT", "/api/admin/upload?name=virus.exe", undefined, payload)).status, 400);
  // Attacher à une leçon privée
  r = await call("admin", "PUT", `/api/admin/lessons/${privateLesson.id}`, { video_url: r.data.url, title: privateLesson.title + " (vidéo)" });
  assert.equal(r.status, 200);
  const url = (await call("admin", "GET", `/api/lessons/${privateLesson.id}`)).data.video_url;
  // Média : refusé aux anonymes et à bob (inscrit manuellement → autorisé), autorisé à alice
  assert.equal((await call("anon", "GET", url)).status, 403);
  assert.equal((await call("alice", "GET", url)).status, 200);
  const range = await fetch(base + url, { headers: { Cookie: jars.alice, Range: "bytes=0-99" } });
  assert.equal(range.status, 206);
  assert.equal(range.headers.get("content-length"), "100");
  // Quiz invalide refusé
  r = await call("admin", "PUT", `/api/admin/quizzes/${full.modulesList[0].quiz.id}`, { questions: [{ q: "x", options: ["a"], answer: 0 }] });
  assert.equal(r.status, 400);
  void lesson;
});

test("déconnexion et expiration", async () => {
  await call("alice", "POST", "/api/auth/logout");
  const r = await call("alice", "GET", "/api/me");
  assert.equal(r.data.user, null);
});
