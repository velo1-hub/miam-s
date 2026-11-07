import { expect, test } from "@playwright/test";

test.describe("Public site", () => {
  test("home renders in French with the hero and the counter", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Votre prochaine voiture");
    await expect(page.getByText(/véhicules en inventaire/)).toBeVisible();
  });

  test("language toggle keeps the equivalent page", async ({ page }) => {
    await page.goto("/fr/inventaire");
    const mobile = (page.viewportSize()?.width ?? 1440) < 768;
    if (mobile) await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await page.getByRole("button", { name: "Switch to English" }).locator("visible=true").first().click();
    await expect(page).toHaveURL(/\/en\/inventory$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Inventory");
  });

  test("inventory: filter + sort live in the URL and the URL is shareable", async ({ page }) => {
    await page.goto("/fr/inventaire?body=suv&sort=price_asc");
    await expect(page.getByText(/véhicule/).first()).toBeVisible();
    const nums = (await page.locator("article [data-price]").evaluateAll((els) => els.map((el) => Number(el.getAttribute("data-price")))));
    expect(nums.length).toBeGreaterThan(1);
    expect(nums).toEqual([...nums].sort((a, b) => a - b));
    await page.goto("/fr/inventaire?q=rav4%20hybride&ai=true");
    await expect(page.getByText("Votre recherche, telle que comprise").first()).toBeVisible();
  });

  test("vehicle page: 360° viewer rotates with the keyboard and the calculator shows the credit rate before the payment", async ({ page }) => {
    await page.goto("/fr/inventaire/2023-toyota-rav4-xle-ti-a2301");
    const viewer = page.getByRole("img", { name: /Vue 360°/ });
    await expect(viewer).toBeVisible();
    await viewer.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Home");
    const calc = page.getByRole("heading", { name: "Calculateur de financement" });
    await calc.scrollIntoViewIfNeeded();
    const block = page.locator("[aria-live=polite]").filter({ hasText: "Taux de crédit" });
    const text = await block.innerText();
    expect(text.indexOf("Taux de crédit")).toBeLessThan(text.indexOf("Paiement"));
    expect(text).toContain("Obligation totale");
  });

  test("unknown vehicle gives the custom 404", async ({ page }) => {
    const res = await page.goto("/fr/inventaire/2019-ford-fiesta-zz9999");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Ce véhicule a déjà trouvé preneur.")).toBeVisible();
  });
});
