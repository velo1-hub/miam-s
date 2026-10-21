// Charge le catalogue (content/index.mjs) en base et crée le compte admin.
//   node src/seed.mjs            → ajoute ce qui manque (idempotent par slug)
//   node src/seed.mjs --reset    → supprime et recrée tout le contenu (les progrès des étudiants sont perdus)
import { q, getSetting, setSetting, closeDb } from "./db.mjs";
import { hashPassword } from "./auth.mjs";
import { COURSES, BRAND } from "../content/index.mjs";

export async function seed({ reset = false, log = console.log } = {}) {
  await q.tx(async (t) => {
    if (reset) await t.run("DELETE FROM courses");
    for (const c of COURSES) {
      const existing = await t.get("SELECT id FROM courses WHERE slug = ?", c.slug);
      if (existing && !reset) { log(`= ${c.slug} déjà présent`); continue; }
      const r = await t.run(
        `INSERT INTO courses(slug,title,subtitle,description,outcomes,level,hours,price_cents,currency,accent,plan_json,includes,audience,published,featured,sort)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
        c.slug, c.title, c.subtitle, c.description, JSON.stringify(c.outcomes), c.level, c.hours, c.price_cents, c.currency,
        c.accent, c.plan ? JSON.stringify(c.plan) : "", JSON.stringify(c.includes), c.audience, c.featured, c.sort);
      const courseId = r.lastInsertRowid;
      let ms = 0, ls = 0;
      for (const m of c.modules) {
        const mr = await t.run("INSERT INTO modules(course_id,title,summary,sort) VALUES(?,?,?,?)", courseId, m.title, m.summary, ms++);
        const moduleId = mr.lastInsertRowid;
        let sortL = 0;
        for (const l of m.lessons) {
          await t.run("INSERT INTO lessons(module_id,title,video_url,content,resources,duration_min,is_preview,sort) VALUES(?,?,?,?,?,?,?,?)",
            moduleId, l.title, l.video || "", l.content, JSON.stringify(l.resources || []), l.duration, l.preview ? 1 : 0, sortL++);
          ls++;
        }
        if (m.quiz) await t.run("INSERT INTO quizzes(course_id,module_id,title,pass_pct,questions) VALUES(?,?,?,?,?)", courseId, moduleId, m.quiz.title, m.quiz.pass_pct || 70, JSON.stringify(m.quiz.questions));
      }
      if (c.finalExam) await t.run("INSERT INTO quizzes(course_id,module_id,title,pass_pct,questions) VALUES(?,NULL,?,?,?)", courseId, c.finalExam.title, c.finalExam.pass_pct || 75, JSON.stringify(c.finalExam.questions));
      log(`+ ${c.slug}: ${ms} modules, ${ls} leçons`);
    }
    const adminEmail = process.env.ADMIN_EMAIL || "admin@the1percent.academy";
    if (!(await t.get("SELECT id FROM users WHERE email = ?", adminEmail))) {
      const pw = process.env.ADMIN_PASSWORD || "ChangeMe-2026!";
      await t.run("INSERT INTO users(email,name,password_hash,role) VALUES(?,?,?,'admin')", adminEmail, "Administrateur", hashPassword(pw));
      log(`+ admin créé : ${adminEmail} (mot de passe : ${process.env.ADMIN_PASSWORD ? "défini par ADMIN_PASSWORD" : pw + "  ← CHANGEZ-LE"})`);
    }
    if (!(await t.get("SELECT code FROM coupons WHERE code = 'FONDATEUR'"))) await t.run("INSERT INTO coupons(code,pct_off,active) VALUES('FONDATEUR',10,1)");
  });
  if (!(await getSetting("brand_name"))) await setSetting("brand_name", BRAND.name);
  if (!(await getSetting("support_email"))) await setSetting("support_email", BRAND.supportEmail);
}

if (process.argv[1] && /seed\.mjs$/.test(process.argv[1])) {
  await seed({ reset: process.argv.includes("--reset") });
  await closeDb();
}
