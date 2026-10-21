// Base de données : deux moteurs derrière la même API asynchrone.
//   - SQLite intégré à Node (node:sqlite) par défaut : fichier academy/data/academy.db, zéro dépendance.
//   - PostgreSQL (Supabase, Neon, RDS…) si DATABASE_URL est défini : pour l'hébergement sans disque persistant (Vercel).
// Le SQL est écrit dans un sous-ensemble portable ; les quelques différences sont traduites ici (voir toPg).
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const DB_PATH = process.env.ACADEMY_DB || join(here, "..", "data", "academy.db");
export const isPg = Boolean(process.env.DATABASE_URL);

const TABLES = `
CREATE TABLE IF NOT EXISTS users (
  id {{ID}},
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  created_at {{TS}} NOT NULL DEFAULT {{NOW}},
  last_login_at {{TS}}
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at {{TS}} NOT NULL,
  created_at {{TS}} NOT NULL DEFAULT {{NOW}}
);
CREATE TABLE IF NOT EXISTS courses (
  id {{ID}},
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  outcomes TEXT NOT NULL DEFAULT '[]',
  level TEXT NOT NULL DEFAULT 'Débutant',
  hours {{REAL}} NOT NULL DEFAULT 0,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  accent TEXT NOT NULL DEFAULT '#C9A227',
  plan_json TEXT NOT NULL DEFAULT '',
  includes TEXT NOT NULL DEFAULT '[]',
  audience TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at {{TS}} NOT NULL DEFAULT {{NOW}}
);
CREATE TABLE IF NOT EXISTS modules (
  id {{ID}},
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS lessons (
  id {{ID}},
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  resources TEXT NOT NULL DEFAULT '[]',
  duration_min INTEGER NOT NULL DEFAULT 10,
  is_preview INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS quizzes (
  id {{ID}},
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pass_pct INTEGER NOT NULL DEFAULT 70,
  questions TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS enrollments (
  id {{ID}},
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'purchase',
  created_at {{TS}} NOT NULL DEFAULT {{NOW}},
  UNIQUE (user_id, course_id)
);
CREATE TABLE IF NOT EXISTS progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at {{TS}} NOT NULL DEFAULT {{NOW}},
  PRIMARY KEY (user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id {{ID}},
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score_pct INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  answers TEXT NOT NULL,
  created_at {{TS}} NOT NULL DEFAULT {{NOW}}
);
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  pct_off INTEGER NOT NULL CHECK (pct_off BETWEEN 1 AND 100),
  active INTEGER NOT NULL DEFAULT 1,
  uses INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS orders (
  id {{ID}},
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  coupon TEXT,
  plan TEXT NOT NULL DEFAULT 'full' CHECK (plan IN ('full','3x')),
  provider TEXT NOT NULL,
  provider_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','paid','failed','refunded')),
  created_at {{TS}} NOT NULL DEFAULT {{NOW}},
  paid_at {{TS}}
);
CREATE TABLE IF NOT EXISTS installments (
  id {{ID}},
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  label TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  due_at {{TS}} NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  provider_ref TEXT,
  paid_at {{TS}},
  UNIQUE (order_id, number)
);
CREATE TABLE IF NOT EXISTS uploads (
  id {{ID}},
  filename TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  created_at {{TS}} NOT NULL DEFAULT {{NOW}}
);
CREATE TABLE IF NOT EXISTS certificates (
  id {{ID}},
  code TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  issued_at {{TS}} NOT NULL DEFAULT {{NOW}},
  UNIQUE (user_id, course_id)
);
CREATE TABLE IF NOT EXISTS comments (
  id {{ID}},
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at {{TS}} NOT NULL DEFAULT {{NOW}}
);
CREATE TABLE IF NOT EXISTS password_resets (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at {{TS}} NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id, sort);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id, sort);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
`;
const schemaFor = (pg) => TABLES
  .replaceAll("{{ID}}", pg ? "INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT")
  .replaceAll("{{TS}}", pg ? "TIMESTAMPTZ" : "TEXT")
  .replaceAll("{{NOW}}", pg ? "now()" : "(datetime('now'))")
  .replaceAll("{{REAL}}", pg ? "DOUBLE PRECISION" : "REAL");

// Tables dont les INSERT renvoient un id (pour lastInsertRowid côté Postgres).
const ID_TABLES = /^\s*INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+(users|courses|modules|lessons|quizzes|enrollments|quiz_attempts|orders|installments|uploads|certificates|comments)\b/i;

// Traduction du dialecte portable (écrit pour SQLite) vers Postgres.
export function toPg(sql) {
  let i = 0;
  let out = sql.replace(/\?/g, () => `$${++i}`);
  out = out.replace(/datetime\('now',\s*'(-?\d+) days?'\)/gi, (m, d) => `(now() + interval '${d} days')`);
  out = out.replace(/datetime\('now'\)/gi, "now()");
  out = out.replace(/GROUP_CONCAT\(/gi, "string_agg(");
  const ignore = /^\s*INSERT\s+OR\s+IGNORE\s+INTO/i.test(out);
  if (ignore) out = out.replace(/^\s*INSERT\s+OR\s+IGNORE\s+INTO/i, "INSERT INTO") + " ON CONFLICT DO NOTHING";
  if (ID_TABLES.test(sql) && !/RETURNING/i.test(out)) out += " RETURNING id";
  return out;
}

// ---------- Moteur SQLite ----------
async function sqliteBackend(path) {
  const { DatabaseSync } = await import("node:sqlite");
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(schemaFor(false));
  const api = {
    kind: "sqlite",
    get: async (sql, ...p) => db.prepare(sql).get(...p),
    all: async (sql, ...p) => db.prepare(sql).all(...p),
    run: async (sql, ...p) => { const r = db.prepare(sql).run(...p); return { changes: r.changes, lastInsertRowid: Number(r.lastInsertRowid) }; },
    exec: async (sql) => db.exec(sql),
    tx: async (fn) => { db.exec("BEGIN"); try { const r = await fn(api); db.exec("COMMIT"); return r; } catch (e) { db.exec("ROLLBACK"); throw e; } },
    close: async () => db.close(),
  };
  return api;
}

// ---------- Moteur Postgres ----------
async function pgBackend(url) {
  const pg = (await import("pg")).default;
  pg.types.setTypeParser(20, (v) => Number(v));   // int8 (COUNT)
  pg.types.setTypeParser(1700, (v) => Number(v)); // numeric (SUM)
  // Les pooleurs Supabase sont nommés aws-0-<région> ou aws-1-<région> selon l'âge du projet : on tente l'autre en cas d'hôte introuvable.
  const candidates = [url];
  if (/aws-1-/.test(url)) candidates.push(url.replace("aws-1-", "aws-0-"));
  else if (/aws-0-/.test(url)) candidates.push(url.replace("aws-0-", "aws-1-"));
  let pool, lastErr;
  for (const c of candidates) {
    pool = new pg.Pool({ connectionString: c, ssl: /localhost|127\.0\.0\.1/.test(c) ? false : { rejectUnauthorized: false }, max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
    try { await pool.query("SELECT 1"); lastErr = null; break; } catch (e) { lastErr = e; await pool.end().catch(() => {}); pool = null; }
  }
  if (!pool) throw lastErr;
  await pool.query(schemaFor(true));
  const wrap = (client) => ({
    kind: "pg",
    get: async (sql, ...p) => (await client.query(toPg(sql), p)).rows[0],
    all: async (sql, ...p) => (await client.query(toPg(sql), p)).rows,
    run: async (sql, ...p) => { const r = await client.query(toPg(sql), p); return { changes: r.rowCount, lastInsertRowid: r.rows?.[0]?.id ?? 0 }; },
    exec: async (sql) => { await client.query(sql); },
  });
  const api = {
    ...wrap(pool),
    tx: async (fn) => {
      const client = await pool.connect();
      try { await client.query("BEGIN"); const r = await fn(wrap(client)); await client.query("COMMIT"); return r; }
      catch (e) { await client.query("ROLLBACK").catch(() => {}); throw e; }
      finally { client.release(); }
    },
    close: async () => pool.end(),
  };
  return api;
}

let backendPromise;
export function openDb() {
  if (!backendPromise) backendPromise = isPg ? pgBackend(process.env.DATABASE_URL) : sqliteBackend(DB_PATH);
  return backendPromise;
}
export async function closeDb() {
  if (backendPromise) { const b = await backendPromise; await b.close(); backendPromise = undefined; }
}

// API de requêtes : toujours paramétrée (jamais de concaténation SQL).
export const q = {
  get: async (sql, ...p) => (await openDb()).get(sql, ...p),
  all: async (sql, ...p) => (await openDb()).all(sql, ...p),
  run: async (sql, ...p) => (await openDb()).run(sql, ...p),
  exec: async (sql) => (await openDb()).exec(sql),
  tx: async (fn) => (await openDb()).tx(fn),
};

export async function getSetting(key, fallback = null) {
  const r = await q.get("SELECT value FROM settings WHERE key = ?", key);
  return r ? r.value : fallback;
}
export async function setSetting(key, value) {
  await q.run("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", key, String(value));
}
