// Business facts used everywhere (website, schema, footer, screens).
// ⚠️ Values in {BRACES} are placeholders until the owner answers the Phase 0 questions (Q1, Q4).
// Change them here once; `node site/build.mjs` propagates them to every page.
export const BIZ = {
  name: "Miam's Resto Café",
  url: "https://www.miamsrestocafe.ca", // {DOMAIN}: confirm and register (Phase 6 §7)
  phone: "+1-514-000-0000", // {PHONE}
  phoneDisplay: "514 000-0000",
  email: "bonjour@miamsrestocafe.ca", // {EMAIL}
  street: "{ADDRESS}", // e.g. "1234, rue Saint-Denis"
  city: "Montréal",
  region: "QC",
  postal: "H2X 0X0", // {POSTAL}
  country: "CA",
  neighbourhood: { fr: "{NEIGHBOURHOOD}", en: "{NEIGHBOURHOOD}" },
  geo: { lat: 45.5231, lng: -73.5817 }, // {GEO}: set to the exact storefront
  priceRange: "$$",
  hours: [
    { days: ["Monday", "Tuesday", "Wednesday"], opens: "07:30", closes: "16:00" },
    { days: ["Thursday", "Friday"], opens: "07:30", closes: "21:00" },
    { days: ["Saturday", "Sunday"], opens: "08:30", closes: "16:00" },
  ],
  instagram: "https://www.instagram.com/miamsrestocafe",
  facebook: "https://www.facebook.com/miamsrestocafe",
  tiktok: "https://www.tiktok.com/@miamsrestocafe",
  // Third-party links (Phase 6 §7). Leave empty to show the "coming soon" state.
  orderUrl: "", // POS provider's commission-free online ordering page
  reserveUrl: "", // reservation provider (e.g. Libro) booking page
  giftCardUrl: "", // POS provider's e-gift card page
  googleReviewUrl: "", // https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Miam%27s+Resto+Caf%C3%A9+Montr%C3%A9al",
  gtmId: "", // Google Tag Manager container, e.g. GTM-XXXXXXX (loads only after consent, Law 25)
  newsletterAction: "", // form endpoint from the email provider
};
