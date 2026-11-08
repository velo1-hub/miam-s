import { expect, test } from "@playwright/test";

test.describe("Lead flows", () => {
  // Lead forms allow 5 submissions per hour per client address (brief §13). Each test acts as a
  // distinct visitor so the suite does not trip that limit; the limit itself is unchanged.
  test.beforeEach(async ({ page }, testInfo) => {
    const n = (testInfo.workerIndex * 97 + testInfo.testId.length * 13 + Date.now()) % 250;
    await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${testInfo.project.name === "mobile" ? 2 : 1}.${testInfo.line % 250}.${n + 1}` });
  });

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

  test("sell my car: the owner's asking price reaches the admin", async ({ page }, testInfo) => {
    const lastName = `Vendeur${testInfo.project.name}${Date.now() % 100000}`;
    await page.goto("/fr/vendre-mon-auto");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Vendez-nous votre auto");
    const form = page.locator("form").filter({ has: page.getByLabel("Prix demandé ($)") });
    await form.getByLabel("Année").fill("2019");
    await form.getByLabel("Marque").fill("Subaru");
    await form.getByLabel("Modèle", { exact: true }).fill("Outback");
    await form.getByLabel("Kilométrage (km)").fill("84000");
    await form.getByRole("button", { name: "Envoyer" }).click();
    await expect(form.getByText("Entrez un prix entre 500 $ et 500 000 $.")).toBeVisible();
    await expect(form.getByText("Seul le propriétaire inscrit peut vendre le véhicule.")).toBeVisible();
    await form.getByLabel("Prix demandé ($)").fill("21500");
    await form.getByLabel("Votre prix est-il négociable ?").selectOption("firm");
    await form.getByLabel("Prénom").fill("Playwright");
    await form.getByLabel("Nom", { exact: true }).fill(lastName);
    await form.getByLabel("Courriel").fill("vendeur@example.com");
    await form.getByLabel("Téléphone").fill("514 555 0142");
    await form.getByLabel("Je suis le propriétaire inscrit de ce véhicule.").check();
    await form.getByLabel(/Je consens/).check();
    await form.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByText("Offre reçue.")).toBeVisible({ timeout: 20_000 });

    await page.goto("/admin/login");
    await page.fill("input[name=passcode]", process.env.DEMO_ADMIN_PASSCODE ?? "00000");
    await page.click("button[type=submit]");
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/leads");
    const row = page.getByRole("link").filter({ hasText: lastName });
    await expect(row).toContainText("Vente directe · 2019 Subaru Outback · 21 500 $");
    await row.click();
    await expect(page.getByText("Véhicule proposé à l’achat")).toBeVisible();
    await expect(page.getByText("prix ferme")).toBeVisible();
  });
});
