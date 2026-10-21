// Certificats : émission (après leçons + quiz) et page de vérification publique imprimable.
import { randomBytes } from "node:crypto";
import { q } from "./db.mjs";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function courseCompletion(userId, courseId) {
  const lessons = q.get("SELECT COUNT(*) n FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ?", courseId).n;
  const done = q.get("SELECT COUNT(*) n FROM progress p JOIN lessons l ON l.id = p.lesson_id JOIN modules m ON m.id = l.module_id WHERE p.user_id = ? AND m.course_id = ?", userId, courseId).n;
  const quizzes = q.all("SELECT id FROM quizzes WHERE course_id = ?", courseId);
  const passed = quizzes.filter((z) => q.get("SELECT 1 FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? AND passed = 1 LIMIT 1", userId, z.id)).length;
  return { lessons, done, quizzes: quizzes.length, quizzesPassed: passed, pct: lessons ? Math.round((done / lessons) * 100) : 0, complete: lessons > 0 && done >= lessons && passed >= quizzes.length };
}

export function issueIfComplete(userId, courseId) {
  const existing = q.get("SELECT * FROM certificates WHERE user_id = ? AND course_id = ?", userId, courseId);
  if (existing) return existing;
  const c = courseCompletion(userId, courseId);
  if (!c.complete) return null;
  const code = `1P-${randomBytes(4).toString("hex").toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
  q.run("INSERT INTO certificates(code,user_id,course_id) VALUES(?,?,?)", code, userId, courseId);
  return q.get("SELECT * FROM certificates WHERE code = ?", code);
}

export function certificateHtml(code, brand) {
  const cert = q.get(
    `SELECT c.code, c.issued_at, u.name, co.title, co.hours
       FROM certificates c JOIN users u ON u.id = c.user_id JOIN courses co ON co.id = c.course_id WHERE c.code = ?`, code);
  if (!cert) return null;
  const date = new Date(cert.issued_at + "Z").toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Certificat ${esc(cert.code)} — ${esc(brand)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;background:#0B0B0D;color:#F3EFE6;font-family:Georgia,"Times New Roman",serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
.cert{max-width:900px;width:100%;border:2px solid #C9A227;padding:56px 48px;position:relative;background:linear-gradient(160deg,#121214,#0B0B0D)}
.cert:before{content:"";position:absolute;inset:10px;border:1px solid rgba(201,162,39,.45);pointer-events:none}
.brand{font-family:Inter,system-ui,sans-serif;letter-spacing:.35em;font-size:12px;text-transform:uppercase;color:#C9A227}
h1{font-weight:400;font-size:40px;margin:18px 0 6px}
.name{font-size:34px;color:#C9A227;margin:28px 0 8px;font-style:italic}
p{line-height:1.6;color:#D9D3C7}
.meta{display:flex;justify-content:space-between;gap:24px;margin-top:40px;font-family:Inter,system-ui,sans-serif;font-size:13px;color:#A39E93;flex-wrap:wrap}
.verify{font-family:Inter,system-ui,sans-serif;font-size:12px;color:#7D786E;margin-top:28px}
@media print{body{background:#fff;color:#111}.cert{background:#fff;color:#111}p{color:#222}.meta{color:#444}}
</style></head><body>
<article class="cert">
  <div class="brand">${esc(brand)} · Certificat de réussite</div>
  <h1>Certificat The 1 %</h1>
  <p>Ce certificat atteste que</p>
  <div class="name">${esc(cert.name)}</div>
  <p>a complété avec succès l'ensemble des leçons, des quiz de module et l'examen final de la formation</p>
  <p><strong>${esc(cert.title)}</strong> (${esc(cert.hours)} h de contenu)</p>
  <div class="meta"><span>Émis le ${esc(date)}</span><span>Code de vérification : <strong>${esc(cert.code)}</strong></span></div>
  <div class="verify">Vérifiable publiquement à l'adresse /certificat/${esc(cert.code)}</div>
</article>
</body></html>`;
}
