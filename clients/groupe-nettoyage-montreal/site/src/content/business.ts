export const BIZ = {
  name: "Groupe Nettoyage Montréal",
  legalName: "Groupe Nettoyage Montréal", // [Q1] confirm legal name + NEQ
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.groupenettoyagemontreal.ca",
  phone: "+15142605194",
  phoneDisplay: "(514) 260-5194",
  email: "info@groupenettoyagemontreal.ca",
  address: { street: "1420, rue Towers", city: "Montréal", region: "QC", postal: "H3H 2E1", country: "CA" }, // [Q2]
  geo: { lat: 45.4926348, lng: -73.5818442 },
  hours: { opens: "07:00", closes: "21:00" },
  serviceArea: ["Montréal", "Laval", "Longueuil", "Brossard", "Ouest-de-l'Île"],
  insurance: { amount: "2 000 000 $", note: "[Q4] confirm carrier and amount" },
  founded: 2022, // [Q3] confirm
  gtmId: process.env.NEXT_PUBLIC_GTM_ID ?? "",
  social: { facebook: "", instagram: "", linkedin: "", google: "" },
};
