// Construction pour Vercel (Build Output API v3) : télécharge academy/ depuis GitHub, puis dépose
//   .vercel/output/static/            ← public/ (fichiers statiques servis en premier)
//   .vercel/output/functions/api/index.func/  ← serveur complet + node_modules (pg, @vercel/blob)
// Utilisé comme buildCommand ("node bootstrap.mjs"). Variables : BOOTSTRAP_REPO, BOOTSTRAP_REF, BOOTSTRAP_SUBDIR.
import { execSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdirSync, mkdtempSync, cpSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const REPO = process.env.BOOTSTRAP_REPO || "velo1-hub/miam-s";
const REF = process.env.BOOTSTRAP_REF || "claude/loving-tesla-60o26o";
const SUBDIR = process.env.BOOTSTRAP_SUBDIR || "academy";
const LOCAL = process.env.BOOTSTRAP_LOCAL; // chemin local du dossier academy (tests) au lieu du téléchargement

let src;
if (LOCAL) src = LOCAL;
else {
  const url = `https://codeload.github.com/${REPO}/tar.gz/refs/heads/${REF}`;
  console.log(`[bootstrap] ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Téléchargement impossible : ${res.status}`);
  const tmp = mkdtempSync(join(tmpdir(), "academy-src-"));
  writeFileSync(join(tmp, "src.tgz"), Buffer.from(await res.arrayBuffer()));
  execSync(`tar -xzf "${join(tmp, "src.tgz")}" -C "${tmp}"`, { stdio: "inherit" });
  src = join(execSync(`ls -d "${tmp}"/*/`, { encoding: "utf8" }).trim(), SUBDIR);
}
const out = join(process.cwd(), ".vercel", "output");
rmSync(out, { recursive: true, force: true });
const fn = join(out, "functions", "api", "index.func");
mkdirSync(join(out, "static"), { recursive: true });
mkdirSync(fn, { recursive: true });
const skip = (p) => !/\/(data|node_modules|test|\.vercel)(\/|$)/.test(p) && !/\.(md|db)$/.test(p);
cpSync(join(src, "public"), join(out, "static"), { recursive: true });
// Visuels de marque : téléchargement depuis le manifeste et conversion WebP (sharp installé le temps de la construction).
const manifestPath = join(src, "public", "img", "manifest.json");
if (existsSync(manifestPath)) {
  const m = JSON.parse(readFileSync(manifestPath, "utf8"));
  const imgDir = join(out, "static", "img");
  mkdirSync(imgDir, { recursive: true });
  const tools = mkdtempSync(join(tmpdir(), "img-tools-"));
  writeFileSync(join(tools, "package.json"), '{"name":"img-tools","private":true}');
  execSync("npm install sharp@0.34 --no-audit --no-fund", { cwd: tools, stdio: "inherit" });
  const sharp = (await import(join(tools, "node_modules", "sharp", "lib", "index.js"))).default;
  for (const [name, meta] of Object.entries(m.images)) {
    const res = await fetch(m.base + meta.file);
    if (!res.ok) { console.warn(`[bootstrap] image ${name} : ${res.status}`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf).webp({ quality: 82 }).toFile(join(imgDir, `${name}.webp`));
    await sharp(buf).resize({ width: 640 }).webp({ quality: 74 }).toFile(join(imgDir, `${name}-sm.webp`));
    console.log(`[bootstrap] image ${name} ok`);
  }
}
for (const item of ["package.json", "package-lock.json", "server.mjs", "api", "src", "content", "public"]) if (existsSync(join(src, item))) cpSync(join(src, item), join(fn, item), { recursive: true, filter: skip });
execSync("npm install --omit=dev --no-audit --no-fund", { cwd: fn, stdio: "inherit" });
writeFileSync(join(fn, ".vc-config.json"), JSON.stringify({ runtime: "nodejs22.x", handler: "api/index.js", launcherType: "Nodejs", maxDuration: 30, memory: 1024, environment: {}, shouldAddHelpers: false, supportsResponseStreaming: false }, null, 2));
writeFileSync(join(out, "config.json"), JSON.stringify({ version: 3, routes: [{ handle: "filesystem" }, { src: "/(.*)", dest: "/api/index?__path=$1" }] }, null, 2));
console.log(`[bootstrap] sortie prête : ${out}`);
