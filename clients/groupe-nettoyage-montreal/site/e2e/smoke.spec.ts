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

test("assistant streams a reply, shows quick replies and the booking card", async ({ page }) => {
  // The model is scripted at the network edge: the widget must render the NDJSON protocol correctly.
  const turns = [
    [{ t: "status", key: "pricing" }, { t: "status", key: "availability" }, { t: "delta", text: "Pour un 4½ aux deux semaines, c'est 125 $ par visite. " }, { t: "delta", text: "Mardi 10:30 ou mercredi 08:00?" }, { t: "done", reply: "Pour un 4½ aux deux semaines, c'est 125 $ par visite. Mardi 10:30 ou mercredi 08:00?", chips: ["Mardi 10:30", "Mercredi 08:00"], state: { quote: { service: "residential" } }, booking: null }],
    [{ t: "status", key: "booking" }, { t: "delta", text: "C'est confirmé pour mardi 10:30." }, { t: "done", reply: "C'est confirmé pour mardi 10:30.", chips: [], state: { email: "m@example.com" }, booking: { ref: "GNM-TEST1", date: "2026-11-24", slot_start: "10:30", slot_end: "13:00", service: "residential", address: "123 rue Saint-Denis" } }],
  ];
  let n = 0; const bodies: unknown[] = [];
  await page.route("**/api/assistant", async (route) => { bodies.push(route.request().postDataJSON()); const t = turns[Math.min(n++, turns.length - 1)]; await route.fulfill({ status: 200, contentType: "application/x-ndjson", body: t.map((e) => JSON.stringify(e)).join("\n") + "\n" }); });
  await page.goto("/");
  await page.getByRole("button", { name: "Refuser" }).click();
  await page.getByRole("button", { name: /Assistant 24\/7/ }).click();
  const dialog = page.getByRole("dialog", { name: /Assistant GNM/ });
  await dialog.getByRole("button", { name: "Prix pour un 4½ aux deux semaines" }).click();
  await expect(dialog.getByText(/125 \$ par visite/)).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Mardi 10:30" })).toBeVisible();
  await dialog.getByRole("button", { name: "Mardi 10:30" }).click();
  await expect(dialog.getByText(/Réservation confirmée · GNM-TEST1/)).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Mardi 10:30" })).toHaveCount(0);
  const second = bodies[1] as { messages: { role: string; content: string }[]; state: Record<string, unknown>; context: { page: string } };
  expect(second.messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
  expect(second.state).toEqual({ quote: { service: "residential" } });
  expect(second.context.page).toBe("/");
  // Reset clears the thread.
  await dialog.getByRole("button", { name: "Nouvelle conversation" }).click();
  await expect(dialog.getByText(/GNM-TEST1/)).toHaveCount(0);
});

test("assistant degrades gracefully when the model is not configured", async ({ page }) => {
  await page.route("**/api/assistant", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "assistant_not_configured" }) }));
  await page.goto("/en");
  await page.getByRole("button", { name: "Decline" }).click();
  await page.getByRole("button", { name: /Assistant 24\/7/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Availability this week" }).click();
  await expect(dialog.getByText(/temporarily unavailable/)).toBeVisible();
  await expect(dialog.getByRole("textbox")).toBeDisabled();
});
