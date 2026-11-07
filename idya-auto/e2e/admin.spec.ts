import { expect, test } from "@playwright/test";

test.describe("Admin (demo auth)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test("create a vehicle, publish validation, mark as sold", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill("input[name=email]", process.env.DEMO_ADMIN_EMAIL ?? "demo@idya-auto.example");
    await page.fill("input[name=password]", process.env.DEMO_ADMIN_PASSWORD ?? "idya-demo-2026");
    await page.click("button[type=submit]");
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/vehicules");
    await page.getByRole("button", { name: "Ajouter un véhicule" }).click();
    await expect(page).toHaveURL(/\/admin\/vehicules\/v-/);
    await page.getByRole("button", { name: "Publier" }).click();
    await expect(page.getByText("Publication impossible")).toBeVisible();
    await page.goto("/admin/vehicules/v01");
    await page.getByRole("tab", { name: "Publication" }).click();
    await page.getByLabel("Statut").selectOption("sold");
    await expect(page.getByText("Brouillon enregistré")).toBeVisible({ timeout: 10_000 });
    await page.goto("/admin/journal");
    await expect(page.locator("tbody tr").first()).toContainText("vehicles");
    // restore
    await page.goto("/admin/vehicules/v01");
    await page.getByRole("tab", { name: "Publication" }).click();
    await page.getByLabel("Statut").selectOption("available");
    await expect(page.getByText("Brouillon enregistré")).toBeVisible({ timeout: 10_000 });
  });
});
