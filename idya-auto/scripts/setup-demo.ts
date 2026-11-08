/** Writes the demo admin passcode into .env.local (brief §28.1) if it is not set. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const file = ".env.local";
const current = existsSync(file) ? readFileSync(file, "utf8") : "";
if (/DEMO_ADMIN_PASSCODE=/.test(current)) {
  console.log("Demo admin credentials already present in .env.local");
} else {
  const passcode = "00000";
  writeFileSync(file, `${current.trimEnd()}\nDEMO_MODE=true\nDEMO_ADMIN_EMAIL=demo@idya-auto.example\nDEMO_ADMIN_PASSCODE=${passcode}\n`.trimStart());
  console.log(`Demo admin passcode: ${passcode} (written to .env.local)`);
}
