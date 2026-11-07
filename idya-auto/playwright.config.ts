import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const executablePath = existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;

/** E2E — brief §23. Runs against a production build (`pnpm build && pnpm e2e`). */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3081", trace: "off", locale: "fr-CA", timezoneId: "America/Toronto" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, launchOptions: { executablePath } } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, launchOptions: { executablePath } } },
  ],
  webServer: { command: "pnpm start -p 3081", url: "http://localhost:3081/fr", reuseExistingServer: true, timeout: 60_000 },
});
