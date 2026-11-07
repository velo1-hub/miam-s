/**
 * Renders demo 360° spin sets and gallery shots for every vehicle in demo/seed.json that has a
 * `render` spec (brief §28.3). Output: public/demo/vehicles/{id}/raw/{nn}.png at 1600×900 plus
 * raw/gallery-*.png. Run scripts/process-media.ts afterwards to produce the delivery formats.
 *
 *   pnpm tsx scripts/render-spin.ts [--only v01,v02] [--frames 36]
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
// Playwright is pre-installed globally in the build environment; fall back to the project copy.
type PlaywrightModule = typeof import("@playwright/test");
const { chromium } = (() => {
  try {
    return require("playwright") as PlaywrightModule;
  } catch {
    return require("@playwright/test") as PlaywrightModule;
  }
})();

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const threeDir = path.join(root, "node_modules", "three");
const outRoot = path.join(root, "public", "demo", "vehicles");

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const FRAMES = args.includes("--frames") ? Number(args[args.indexOf("--frames") + 1]) : 36;
const WIDTH = 1600;
const HEIGHT = 900;
const GALLERY = ["front-low", "rear", "side", "wheel"] as const;

interface SeedVehicle {
  id: string;
  render?: { body: string; paint: string; finish: string };
}

const mime: Record<string, string> = { ".js": "text/javascript", ".html": "text/html", ".json": "application/json" };

async function serve(): Promise<{ url: string; close: () => void }> {
  const server = createServer((req, res) => {
    const url = (req.url ?? "/").split("?")[0];
    let file: string | null = null;
    if (url === "/" || url === "/scene.html") file = path.join(here, "render", "scene.html");
    else if (url === "/scene.js") file = path.join(here, "render", "scene.js");
    else if (url.startsWith("/three/")) file = path.join(threeDir, url.slice("/three/".length));
    if (!file || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return { url: `http://127.0.0.1:${port}/scene.html`, close: () => server.close() };
}

async function main() {
  const seed = JSON.parse(await readFile(path.join(root, "demo", "seed.json"), "utf8")) as { vehicles: SeedVehicle[] };
  const vehicles = seed.vehicles.filter((v) => v.render && (!only || only.includes(v.id)));
  const { url, close } = await serve();
  // The build environment pre-installs Chromium at /opt/pw-browsers/chromium; honour it when present.
  const executablePath = process.env.PW_CHROMIUM_PATH ?? (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
  const browser = await chromium.launch({
    executablePath,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  page.on("pageerror", (e: Error) => console.error("[page]", e.message));
  page.on("console", (msg: { type: () => string; text: () => string }) => { if (msg.type() === "error") console.error("[console]", msg.text()); });
  await page.goto(url);
  await page.waitForFunction(() => Boolean((window as unknown as { idya?: { ready: boolean } }).idya?.ready), null, { timeout: 60_000 });
  await page.evaluate(([w, h]: [number, number]) => (window as unknown as { idya: { setSize: (w: number, h: number) => void } }).idya.setSize(w, h), [WIDTH, HEIGHT] as [number, number]);

  const started = Date.now();
  for (const v of vehicles) {
    const dir = path.join(outRoot, v.id, "raw");
    mkdirSync(dir, { recursive: true });
    await page.evaluate((spec: unknown) => (window as unknown as { idya: { load: (s: unknown) => void } }).idya.load(spec), v.render);
    const t0 = Date.now();
    for (let i = 0; i < FRAMES; i++) {
      await page.evaluate(([i, n]: [number, number]) => (window as unknown as { idya: { renderFrame: (i: number, n: number) => void } }).idya.renderFrame(i, n), [i, FRAMES] as [number, number]);
      await page.locator("#c").screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, "0")}.png`), type: "png", animations: "disabled" });
    }
    for (const g of GALLERY) {
      await page.evaluate((k: string) => (window as unknown as { idya: { renderGallery: (k: string) => void } }).idya.renderGallery(k), g);
      await page.locator("#c").screenshot({ path: path.join(dir, `gallery-${g}.png`), type: "png", animations: "disabled" });
    }
    console.log(`${v.id}: ${FRAMES} frames + ${GALLERY.length} gallery in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  console.log(`done in ${((Date.now() - started) / 1000).toFixed(0)} s`);
  await browser.close();
  close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
