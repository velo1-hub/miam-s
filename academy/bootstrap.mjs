// Amorçage Vercel : télécharge le dossier academy/ depuis la branche GitHub indiquée et le dépose dans le répertoire courant.
// Utilisé comme installCommand ("node bootstrap.mjs && npm install") pour déployer sans connexion Git Vercel ↔ dépôt.
import { execSync } from "node:child_process";
import { writeFileSync, mkdtempSync, cpSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const REPO = process.env.BOOTSTRAP_REPO || "velo1-hub/miam-s";
const REF = process.env.BOOTSTRAP_REF || "claude/loving-tesla-60o26o";
const SUBDIR = process.env.BOOTSTRAP_SUBDIR || "academy";
const url = `https://codeload.github.com/${REPO}/tar.gz/refs/heads/${REF}`;
console.log(`[bootstrap] ${url} → ./ (${SUBDIR}/)`);
const res = await fetch(url);
if (!res.ok) throw new Error(`Téléchargement impossible : ${res.status}`);
const tmp = mkdtempSync(join(tmpdir(), "academy-src-"));
const tgz = join(tmp, "src.tgz");
writeFileSync(tgz, Buffer.from(await res.arrayBuffer()));
execSync(`tar -xzf "${tgz}" -C "${tmp}"`, { stdio: "inherit" });
const root = execSync(`ls -d "${tmp}"/*/`, { encoding: "utf8" }).trim();
cpSync(join(root, SUBDIR), process.cwd(), { recursive: true, force: true, filter: (p) => !/\/(data|node_modules|test)(\/|$)/.test(p) });
rmSync(tmp, { recursive: true, force: true });
console.log("[bootstrap] sources en place");
