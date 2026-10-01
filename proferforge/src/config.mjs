// Business facts for Pro Fer Forgé. Everything marked null/empty is NOT shown on the site until filled in.
// See ../TODO.md for what the owner must supply.
export const BIZ = {
  name: "Pro Fer Forgé",
  legalName: "Pro Fer Forgé",
  url: "https://proferforge.ca",
  phone: "+14388157232",
  phoneDisplay: "(438) 815-7232",
  email: "info@proferforge.ca",
  street: "936 Avenue du Mont-Royal E",
  city: "Montréal",
  region: "QC",
  postal: "H2J 1X2",
  country: "CA",
  // Approximate coordinates for the address above. TODO(owner): verify on the Google Business Profile.
  geo: { lat: 45.5268, lng: -73.5688 },
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Pro+Fer+Forg%C3%A9+936+Avenue+du+Mont-Royal+E+Montr%C3%A9al",
  minimumProject: { fr: "3 000 $", en: "$3,000" },
  // Verified on the Google profile at audit time (Oct 2026). Re-check before launch.
  rating: { value: 5.0, count: 55 },
  // --- Facts the owner must supply. Leave empty and the section simply does not render. ---
  rbq: "",            // e.g. "1234-5678-90"
  insurance: "",      // e.g. { fr: "Assurance responsabilité 2 M$", en: "$2M liability insurance" }
  warranty: null,     // { fr: "...", en: "..." } real warranty terms
  founded: null,      // e.g. 2018
  owner: null,        // e.g. "Prénom Nom"
  hours: null,        // [{ days: ["Monday",...], opens: "08:00", closes: "17:00" }]
  social: { facebook: "", instagram: "", linkedin: "", youtube: "" },
  privacyOfficer: { name: "", email: "info@proferforge.ca" },
  // Boroughs / cities. TODO(owner): confirm this list before launch.
  areas: [
    "Le Plateau-Mont-Royal", "Rosemont–La Petite-Patrie", "Villeray–Saint-Michel–Parc-Extension",
    "Mercier–Hochelaga-Maisonneuve", "Ville-Marie", "Le Sud-Ouest", "Verdun", "Outremont",
    "Côte-des-Neiges–Notre-Dame-de-Grâce", "Ahuntsic-Cartierville", "Laval", "Longueuil",
  ],
};

// Production Supabase project "pro-fer-forge" (ca-central-1). The URL and publishable key are public by design:
// row-level security protects the data. Override with env vars for another project; set PF_ASSISTANT_URL="" to hide Félix.
const SUPABASE = { url: "https://dmslnxnqpqlkqqxaxwyl.supabase.co", key: "sb_publishable_l_nmPpb_4DtIbnDcDGRWAA_UfaiXZpP" };
const envOr = (name, fallback) => (process.env[name] !== undefined ? process.env[name] : fallback);

// Runtime integrations, read from environment at build time. Nothing secret goes in the repo.
export const ENV = {
  formEndpoint: process.env.PF_FORM_ENDPOINT || "",   // Formspree / Netlify / Supabase function URL
  gaId: process.env.PF_GA_ID || "",                   // G-XXXXXXXXXX (loaded only after consent)
  heroVideoUrl: process.env.PF_HERO_VIDEO_URL || "", // optional remote mp4 for the hero until a local hero.mp4 exists (self-host before launch)
  assistantUrl: envOr("PF_ASSISTANT_URL", `${SUPABASE.url}/functions/v1/assistant`), // Félix endpoint. Empty = no assistant on the site
  assistantDemo: process.env.PF_ASSISTANT_DEMO === "1",  // label the widget as a demo (local dev server)
  supabaseUrl: envOr("PF_SUPABASE_URL", SUPABASE.url),          // staff dashboard (/admin/): project URL
  supabaseAnonKey: envOr("PF_SUPABASE_ANON_KEY", SUPABASE.key), // public publishable key (safe in the browser; RLS protects the data)
  turnstileKey: process.env.PF_TURNSTILE_KEY || "",   // Cloudflare Turnstile site key
};

export const BUILD_DATE = "2026-10-01";
