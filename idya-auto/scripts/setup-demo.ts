/** Generates the demo admin credentials into .env.local (brief §28.1) if they are not set. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const file = ".env.local";
const current = existsSync(file) ? readFileSync(file, "utf8") : "";
if (/DEMO_ADMIN_PASSWORD=/.test(current)) {
  console.log("Demo admin credentials already present in .env.local");
} else {
  const password = randomBytes(9).toString("base64url");
  writeFileSync(file, `${current.trimEnd()}\nDEMO_MODE=true\nDEMO_ADMIN_EMAIL=demo@idya-auto.example\nDEMO_ADMIN_PASSWORD=${password}\n`.trimStart());
  console.log(`Demo admin: demo@idya-auto.example / ${password} (written to .env.local)`);
}
