import { test, expect } from "@playwright/test";

const pages = ["/", "/en", "/services", "/services/nettoyage-bureaux", "/en/services/office-cleaning", "/zones/laval", "/en/areas/west-island", "/soumission", "/en/quote", "/reserver", "/a-propos", "/notre-methode", "/carrieres", "/blogue", "/blogue/combien-coute-nettoyage-bureau-montreal", "/contact", "/confidentialite", "/ma-reservation"];
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
test("quote request is saved, then the free walkthrough is booked and found again", async ({ page }) => {
  await page.goto("/soumission");
  await page.getByRole("button", { name: "Nettoyage de restaurants" }).click();
  await page.fill("#q-sqft", "1800"); await page.fill("#q-address", "99 rue Saint-Paul, Montréal, H2Y 1Z3");
  await page.fill("#q-company", "Bistro Test"); await page.fill("#q-name", "Test Client"); await page.fill("#q-email", "test@example.com"); await page.fill("#q-phone", "5145550123");
  await page.check("[data-testid=quote-request] input[type=checkbox]");
  await page.getByRole("button", { name: /Envoyer ma demande/ }).click();
  await expect(page.getByText(/Demande reçue/)).toBeVisible();
  await page.getByRole("link", { name: /Choisir le créneau de la visite/ }).click();
  await expect(page).toHaveURL(/\/reserver\?service=restaurant/);
  await expect(page.getByText(/Visite d'évaluation/).first()).toBeVisible();
  await page.locator("button.chip").filter({ hasText: /\d{2}:\d{2} – \d{2}:\d{2}/ }).first().click();
  await page.fill("#b-company", "Bistro Test"); await page.fill("#b-name", "Test Client"); await page.fill("#b-phone", "5145550123"); await page.fill("#b-email", "test@example.com"); await page.fill("#b-addr", "99 rue Saint-Paul, Montréal, H2Y 1Z3");
  await page.check("input[type=checkbox]");
  await page.getByRole("button", { name: /Confirmer la visite/ }).click();
  await expect(page.getByText(/Votre visite est confirmée/)).toBeVisible({ timeout: 15000 });
  const ref = await page.locator("dd.text-xl").textContent(); expect(ref).toMatch(/^GNM-[A-Z0-9]{6}$/);
  await page.goto("/ma-reservation"); await page.fill("#lk-ref", ref!); await page.fill("#lk-email", "test@example.com"); await page.getByRole("button", { name: /Retrouver/ }).click();
  await expect(page.getByText(ref!)).toBeVisible();
});
test("no price is rendered anywhere on the public pages", async ({ page }) => {
  for (const path of ["/", "/services", "/services/nettoyage-bureaux", "/soumission", "/reserver", "/tarifs", "/en", "/en/services/office-cleaning", "/blogue/combien-coute-nettoyage-bureau-montreal"]) {
    await page.goto(path);
    // The liability coverage amount is not a price; everything else with a dollar sign is.
    const text = (await page.locator("main").innerText()).replace(/2[  ]000[  ]000[  ]?\$|\$2M/g, "");
    expect(text, `${path} shows a dollar amount`).not.toMatch(/\d\s?\$|\$\s?\d/);
    // Body copy may say "no residential cleaning"; nothing promoted (headings, links, buttons) may offer it.
    const promoted = (await page.locator("main h1, main h2, main h3, main a, main button, nav a").allInnerTexts()).join("\n").toLowerCase();
    expect(promoted, `${path} promotes residential`).not.toMatch(/résidentiel|residential|grand ménage|deep clean/);
  }
});
test("retired pricing and residential URLs redirect", async ({ request }) => {
  for (const [from, to] of [["/tarifs", "/soumission"], ["/en/pricing", "/en/quote"], ["/services/entretien-residentiel", "/services"], ["/en/services/deep-cleaning", "/en/services"]]) {
    const r = await request.get(from, { maxRedirects: 0 }); expect(r.status(), from).toBe(308); expect(r.headers()["location"]).toContain(to);
  }
});
test("availability API respects lead time and capacity", async ({ request }) => {
  const r = await request.get("/api/availability"); const j = await r.json();
  expect(j.days.length).toBeGreaterThan(0); const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); expect(j.days[0].date > today).toBeTruthy(); for (const d of j.days) { const dow = new Date(`${d.date}T12:00:00Z`).getUTCDay(); expect(dow).toBeGreaterThan(0); expect(dow).toBeLessThan(6); }
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
    [{ t: "status", key: "availability" }, { t: "delta", text: "Pour un bureau de 2 000 pi² trois soirs par semaine, je planifie la visite gratuite. " }, { t: "delta", text: "Mardi 11:00 ou mercredi 14:00?" }, { t: "done", reply: "Pour un bureau de 2 000 pi² trois soirs par semaine, je planifie la visite gratuite. Mardi 11:00 ou mercredi 14:00?", chips: ["Mardi 11:00", "Mercredi 14:00"], state: { service: "office", sqft: 2000 }, booking: null }],
    [{ t: "status", key: "booking" }, { t: "delta", text: "C'est confirmé pour mardi 11:00." }, { t: "done", reply: "C'est confirmé pour mardi 11:00.", chips: [], state: { email: "m@example.com" }, booking: { ref: "GNM-TEST1", date: "2026-11-24", slot_start: "11:00", slot_end: "11:30", service: "office", address: "123 rue Saint-Denis" } }],
  ];
  let n = 0; const bodies: unknown[] = [];
  await page.route("**/api/assistant", async (route) => { bodies.push(route.request().postDataJSON()); const t = turns[Math.min(n++, turns.length - 1)]; await route.fulfill({ status: 200, contentType: "application/x-ndjson", body: t.map((e) => JSON.stringify(e)).join("\n") + "\n" }); });
  await page.goto("/");
  await page.getByRole("button", { name: "Refuser" }).click();
  await page.getByRole("button", { name: /Assistant 24\/7/ }).click();
  const dialog = page.getByRole("dialog", { name: /Assistant GNM/ });
  await dialog.getByRole("button", { name: "Bureau de 2 000 pi², 3 soirs/semaine" }).click();
  await expect(dialog.getByText(/je planifie la visite gratuite/)).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Mardi 11:00" })).toBeVisible();
  await dialog.getByRole("button", { name: "Mardi 11:00" }).click();
  await expect(dialog.getByText(/Visite confirmée · GNM-TEST1/)).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Mardi 11:00" })).toHaveCount(0);
  const second = bodies[1] as { messages: { role: string; content: string }[]; state: Record<string, unknown>; context: { page: string } };
  expect(second.messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
  expect(second.state).toEqual({ service: "office", sqft: 2000 });
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
  await dialog.getByRole("button", { name: "2,000 sq ft office, 3 evenings/week" }).click();
  await expect(dialog.getByText(/temporarily unavailable/)).toBeVisible();
  await expect(dialog.getByRole("textbox")).toBeDisabled();
});
