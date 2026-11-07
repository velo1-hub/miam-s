import { expect, test } from "@playwright/test";

test.describe("Lead flows", () => {
  test("book a test drive end to end", async ({ page }, testInfo) => {
    await page.goto("/fr/inventaire/2023-toyota-rav4-xle-ti-a2301");
    await page.locator("main").getByRole("button", { name: "Réserver un essai" }).locator("visible=true").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Each project books a different slot so parallel runs never compete for the same one.
    const slot = dialog.locator("ul.grid [role=radio]:not([disabled])").nth(testInfo.project.name === "mobile" ? 2 : 0);
    await expect(slot).toBeVisible();
    await page.waitForTimeout(400);
    await slot.click();
    await dialog.getByRole("button", { name: "Suivant" }).click();
    await dialog.getByLabel("Prénom").fill("Playwright");
    await dialog.getByLabel("Nom", { exact: true }).fill("Test");
    await dialog.getByLabel("Courriel").fill("e2e@example.com");
    await dialog.getByLabel("Téléphone").fill("514 555 0188");
    await dialog.getByLabel("Je détiens un permis de conduire valide").check();
    await dialog.getByRole("button", { name: "Suivant" }).click();
    await dialog.locator("input[type=checkbox]").check();
    await dialog.getByRole("button", { name: "Confirmer la réservation" }).click();
    await expect(dialog.getByText("C'est réservé.")).toBeVisible({ timeout: 20_000 });
    await expect(dialog.getByRole("link", { name: "Ajouter à mon calendrier" })).toHaveAttribute("href", /\/api\/ics\//);
  });

  test("question form submits with consent and refuses without it", async ({ page }) => {
    await page.goto("/fr/inventaire/2023-toyota-rav4-xle-ti-a2301");
    await page.getByRole("button", { name: "Poser une question" }).locator("visible=true").first().click();
    await page.waitForTimeout(400);
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nom complet").fill("Testeur");
    await dialog.getByLabel("Courriel").fill("q@example.com");
    await dialog.getByLabel("Message").fill("Est-il toujours disponible ?");
    await dialog.getByRole("button", { name: "Envoyer" }).click();
    await expect(dialog.getByText("Votre consentement est requis.")).toBeVisible();
    await dialog.locator("input[type=checkbox]").check();
    await dialog.getByRole("button", { name: "Envoyer" }).click();
    await expect(dialog.getByText("Message reçu.")).toBeVisible({ timeout: 20_000 });
  });

  test("contact and trade-in forms render in no-red zones", async ({ page }) => {
    await page.goto("/fr/echange");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Combien vaut");
    await expect(page.getByRole("button", { name: "Envoyer" })).toBeVisible();
    await page.goto("/fr/contact");
    await expect(page.getByRole("button", { name: "Envoyer" })).toBeVisible();
  });
});
