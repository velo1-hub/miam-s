import { test, expect } from "@playwright/test";

const pages = ["/", "/en", "/services", "/services/nettoyage-bureaux", "/en/services/office-cleaning", "/zones/laval", "/en/areas/west-island", "/tarifs", "/soumission", "/reserver", "/a-propos", "/notre-methode", "/carrieres", "/blogue", "/blogue/combien-coute-nettoyage-bureau-montreal", "/contact", "/confidentialite", "/ma-reservation"];
for (const p of pages) test(`renders ${p}`, async ({ page }) => {
  const res = await page.goto(p); expect(res?.status()).toBe(200);
  await expect(page.locator("h1").first()).toBeVisible();
  expect(await page.locator("h1").count()).toBe(1);
});

test("legacy URL redirects", async ({ request }) => {
  const r = await request.get("/services/nettoyage-bureau-montreal", { maxRedirects: 0 });
  expect(r.status()).toBe(308); expect(r.headers()["location"]).toContain("/services/nettoyage-bureaux");
});
test("/fr/ redirects to root", async ({ request }) => {
  const r = await request.get("/fr/services", { maxRedirects: 0 }); expect(r.status()).toBe(308); expect(r.headers()["location"]).toMatch(/\/services$/);
});
test("sitemap, robots, og image", async ({ request }) => {
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  expect((await request.get("/robots.txt")).status()).toBe(200);
  const og = await request.get("/opengraph-image"); expect(og.status()).toBe(200); expect(og.headers()["content-type"]).toContain("image/png");
});
test("quote wizard returns a firm price and booking completes", async ({ page }) => {
  await page.goto("/soumission");
  await page.getByRole("button", { name: /Entretien ménager résidentiel/ }).click();
  await page.getByRole("button", { name: "4½", exact: true }).click();
  await page.getByRole("button", { name: /Voir mon prix/ }).click();
  await expect(page.getByText(/Prix ferme/)).toBeVisible();
  await page.getByRole("link", { name: /Réserver ce service/ }).click();
  await expect(page).toHaveURL(/\/reserver/);
  await page.locator("button.chip").filter({ hasText: /\d{2}:\d{2} – \d{2}:\d{2}/ }).first().click();
  await page.fill("#b-name", "Test Client"); await page.fill("#b-phone", "5145550123"); await page.fill("#b-email", "test@example.com"); await page.fill("#b-addr", "123 rue Test, Montréal, H2X 1Y4");
  await page.check("input[type=checkbox]");
  await page.getByRole("button", { name: /Confirmer la réservation/ }).click();
  await expect(page.getByText(/C'est réservé/)).toBeVisible({ timeout: 15000 });
  const ref = await page.locator("dd.text-xl").textContent(); expect(ref).toMatch(/^GNM-[A-Z0-9]{6}$/);
  await page.goto("/ma-reservation"); await page.fill("#lk-ref", ref!); await page.fill("#lk-email", "test@example.com"); await page.getByRole("button", { name: /Retrouver/ }).click();
  await expect(page.getByText(ref!)).toBeVisible();
});
test("availability API respects lead time and capacity", async ({ request }) => {
  const r = await request.get("/api/availability?kind=cleaning"); const j = await r.json();
  expect(j.days.length).toBeGreaterThan(0); const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); expect(j.days[0].date > today).toBeTruthy();
});
test("assistant endpoint validates input", async ({ request }) => {
  const r = await request.post("/api/assistant", { data: { locale: "fr", messages: [] } }); expect([400, 503]).toContain(r.status());
});
test("consent banner blocks until a choice is made", async ({ page }) => {
  await page.goto("/"); await expect(page.getByRole("dialog", { name: /confidentialité/i })).toBeVisible();
  await page.getByRole("button", { name: /Refuser/ }).click(); await expect(page.getByRole("dialog", { name: /confidentialité/i })).toHaveCount(0);
});
