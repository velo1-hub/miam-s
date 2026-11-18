import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e", timeout: 60_000, retries: 0, use: { baseURL: process.env.BASE_URL ?? "http://localhost:3100", trace: "off", launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : undefined },
  webServer: process.env.BASE_URL ? undefined : { command: "pnpm exec next start -p 3100", port: 3100, reuseExistingServer: true, timeout: 120_000 },
});
