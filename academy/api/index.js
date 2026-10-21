// Point d'entrée Vercel : toutes les routes sont réécrites ici (voir vercel.json) et traitées par server.mjs.
// L'import est dynamique pour qu'une erreur de démarrage soit renvoyée en clair (diagnostic) au lieu d'un 500 muet.
import { readdirSync } from "node:fs";
let mod;
export default async function (req, res) {
  try {
    mod ||= await import("../server.mjs");
    return await mod.handler(req, res);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    let files = [];
    try { files = readdirSync(process.cwd()); } catch {}
    res.end(JSON.stringify({ error: "Erreur de démarrage", detail: String(e && e.stack || e), cwd: process.cwd(), files, node: process.version }));
  }
}
