/**
 * Renders the « Signature rouge » hero loop placeholder from the 3D studio (brief §11) at 24 fps,
 * 7.0 s, landscape 1920×1080 and portrait 720×1280. Frames land in .cache/hero/{landscape,portrait}
 * and scripts/encode-hero.sh turns them into the delivery files. Replace with the Higgsfield
 * master when it arrives — the encode script and player do not change.
 *
 *   pnpm tsx scripts/render-hero.ts [--fps 24] [--only landscape|portrait]
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
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
const args = process.argv.slice(2);
const FPS = args.includes("--fps") ? Number(args[args.indexOf("--fps") + 1]) : 24;
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
// --test renders three sample instants (opening, mid-sweep, peak) for a quick composition check
const TEST_TIMES = args.includes("--test") ? [0, 2.0, 3.8] : null;
const DURATION = 7.0;
const VARIANTS = [
  { name: "landscape", width: 1920, height: 1080, portrait: false },
  { name: "portrait", width: 720, height: 1280, portrait: true },
].filter((v) => !only || v.name === only);

const mime: Record<string, string> = { ".js": "text/javascript", ".html": "text/html" };

async function serve() {
  const server = createServer((req, res) => {
    const url = (req.url ?? "/").split("?")[0];
    let file: string | null = null;
    if (url === "/" || url === "/scene.html") file = path.join(here, "render", "scene.html");
    else if (url === "/scene.js") file = path.join(here, "render", "scene.js");
    else if (url.startsWith("/three/")) file = path.join(threeDir, url.slice("/three/".length));
    if (!file || !existsSync(file)) return void res.writeHead(404).end();
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const a = server.address();
  return { url: `http://127.0.0.1:${typeof a === "object" && a ? a.port : 0}/scene.html`, close: () => server.close() };
}

async function main() {
  const { url, close } = await serve();
  const executablePath = process.env.PW_CHROMIUM_PATH ?? (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
  const browser = await chromium.launch({
    executablePath,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"],
  });
  const frames = Math.round(DURATION * FPS);
  for (const v of VARIANTS) {
    const dir = path.join(root, ".cache", "hero", v.name);
    mkdirSync(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1 });
    page.on("pageerror", (e: Error) => console.error("[page]", e.message));
    await page.goto(url);
    await page.waitForFunction(() => Boolean((window as unknown as { idya?: { ready: boolean } }).idya?.ready), null, { timeout: 60_000 });
    await page.evaluate(([w, h]: [number, number]) => (window as unknown as { idya: { setSize: (w: number, h: number) => void } }).idya.setSize(w, h), [v.width, v.height] as [number, number]);
    await page.evaluate((portrait: boolean) => (window as unknown as { idya: { loadHero: (o: { portrait: boolean }) => void } }).idya.loadHero({ portrait }), v.portrait);
    const t0 = Date.now();
    const count = TEST_TIMES ? TEST_TIMES.length : frames;
    for (let i = 0; i < count; i++) {
      const t = TEST_TIMES ? TEST_TIMES[i] : i / FPS;
      await page.evaluate((tt: number) => (window as unknown as { idya: { renderHero: (t: number) => void } }).idya.renderHero(tt), t);
      await page.locator("#c").screenshot({ path: path.join(dir, `${String(i + 1).padStart(4, "0")}.png`), type: "png", animations: "disabled" });
    }
    console.log(`${v.name}: ${count} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    await page.close();
  }
  await browser.close();
  close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
