// Charge le catalogue (content/index.mjs) en base et crée le compte admin.
//   node src/seed.mjs            → ajoute ce qui manque (idempotent par slug)
//   node src/seed.mjs --reset    → supprime et recrée tout le contenu (les comptes et progrès sont conservés si les ids correspondent, sinon perdus)
import { openDb, q, setSetting, getSetting, closeDb } from "./db.mjs";
import { hashPassword } from "./auth.mjs";
import { COURSES, BRAND } from "../content/index.mjs";

export function seed({ reset = false, log = console.log } = {}) {
  const db = openDb();
  db.exec("BEGIN");
  try {
    if (reset) {
      db.exec("DELETE FROM courses");
    }
    for (const c of COURSES) {
      const existing = q.get("SELECT id FROM courses WHERE slug = ?", c.slug);
      if (existing && !reset) { log(`= ${c.slug} déjà présent`); continue; }
      const r = q.run(
        `INSERT INTO courses(slug,title,subtitle,description,outcomes,level,hours,price_cents,currency,accent,plan_json,includes,audience,published,featured,sort)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
        c.slug, c.title, c.subtitle, c.description, JSON.stringify(c.outcomes), c.level, c.hours, c.price_cents, c.currency,
        c.accent, c.plan ? JSON.stringify(c.plan) : "", JSON.stringify(c.includes), c.audience, c.featured, c.sort
      );
      const courseId = Number(r.lastInsertRowid);
      let ms = 0, ls = 0;
      for (const m of c.modules) {
        const mr = q.run("INSERT INTO modules(course_id,title,summary,sort) VALUES(?,?,?,?)", courseId, m.title, m.summary, ms++);
        const moduleId = Number(mr.lastInsertRowid);
        let sortL = 0;
        for (const l of m.lessons) {
          q.run(
            "INSERT INTO lessons(module_id,title,video_url,content,resources,duration_min,is_preview,sort) VALUES(?,?,?,?,?,?,?,?)",
            moduleId, l.title, l.video || "", l.content, JSON.stringify(l.resources || []), l.duration, l.preview ? 1 : 0, sortL++
          );
          ls++;
        }
        if (m.quiz) {
          q.run("INSERT INTO quizzes(course_id,module_id,title,pass_pct,questions) VALUES(?,?,?,?,?)", courseId, moduleId, m.quiz.title, m.quiz.pass_pct || 70, JSON.stringify(m.quiz.questions));
        }
      }
      if (c.finalExam) {
        q.run("INSERT INTO quizzes(course_id,module_id,title,pass_pct,questions) VALUES(?,NULL,?,?,?)", courseId, c.finalExam.title, c.finalExam.pass_pct || 75, JSON.stringify(c.finalExam.questions));
      }
      log(`+ ${c.slug}: ${ms} modules, ${ls} leçons`);
    }

    // Compte admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@the1percent.academy";
    if (!q.get("SELECT id FROM users WHERE email = ?", adminEmail)) {
      const pw = process.env.ADMIN_PASSWORD || "ChangeMe-2026!";
      q.run("INSERT INTO users(email,name,password_hash,role) VALUES(?,?,?,'admin')", adminEmail, "Administrateur", hashPassword(pw));
      log(`+ admin créé : ${adminEmail} (mot de passe : ${process.env.ADMIN_PASSWORD ? "défini par ADMIN_PASSWORD" : pw + "  ← CHANGEZ-LE"})`);
    }
    if (!getSetting("brand_name")) setSetting("brand_name", BRAND.name);
    if (!getSetting("support_email")) setSetting("support_email", BRAND.supportEmail);
    if (!q.get("SELECT code FROM coupons WHERE code = 'FONDATEUR'")) {
      q.run("INSERT INTO coupons(code,pct_off,active) VALUES('FONDATEUR',10,1)");
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  seed({ reset: process.argv.includes("--reset") });
  closeDb();
}
