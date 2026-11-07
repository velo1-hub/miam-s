import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/fr", "/en", "/fr/inventaire", "/en/inventory", "/fr/inventaire/2023-toyota-rav4-xle-ti-a2301", "/en/inventory/2023-toyota-rav4-xle-ti-a2301", "/fr/financement", "/en/financing", "/fr/echange", "/en/trade-in", "/fr/a-propos", "/fr/contact", "/en/contact", "/fr/confidentialite", "/en/terms", "/fr/favoris", "/fr/comparer"];

/** axe on every public page in both locales — brief §23. */
for (const path of PAGES) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    // Trigger every in-view reveal so axe measures the settled page, not a mid-animation frame.
    await page.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(900);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`).join("\n")).toEqual([]);
  });
}
