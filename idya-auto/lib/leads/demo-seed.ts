import type { Booking, Lead, LeadAiBrief } from "./types";

/**
 * 25 realistic demo leads, their AI briefs and this week's bookings (brief §28.1). Deterministic so
 * the admin demo looks the same on every start. Names are invented; no real people.
 */
const NAMES: [string, string][] = [
  ["Marie-Ève", "Tremblay"], ["Samuel", "Gagnon"], ["Nadia", "Bouchard"], ["Olivier", "Roy"], ["Camille", "Côté"],
  ["Jonathan", "Lavoie"], ["Amélie", "Fortin"], ["Karim", "Benali"], ["Isabelle", "Pelletier"], ["Mathieu", "Bélanger"],
  ["Sophie", "Lévesque"], ["David", "Morin"], ["Élise", "Girard"], ["Hugo", "Nguyen"], ["Catherine", "Simard"],
  ["Patrick", "Leblanc"], ["Jade", "Paquette"], ["Rachid", "Haddad"], ["Véronique", "Bergeron"], ["Alexandre", "Poirier"],
  ["Emily", "Carter"], ["Laurence", "Dubé"], ["Nicolas", "Lapointe"], ["Fatima", "Zahra"], ["Guillaume", "Caron"],
];
const VEHICLES = ["v01", "v02", "v03", "v04", "v05", "v06", "v07", "v08", "v10", "v11", "v12"];
const TYPES = ["test_drive", "question", "financing", "trade_in", "contact", "test_drive", "question", "test_drive"] as const;

export function buildDemoLeads(now = new Date()): { leads: Lead[]; bookings: Booking[]; briefs: LeadAiBrief[] } {
  const leads: Lead[] = [];
  const bookings: Booking[] = [];
  const briefs: LeadAiBrief[] = [];
  const day = 86_400_000;
  for (let i = 0; i < NAMES.length; i++) {
    const [firstName, lastName] = NAMES[i];
    const type = TYPES[i % TYPES.length];
    const vehicleId = type === "contact" ? null : VEHICLES[i % VEHICLES.length];
    const createdAt = new Date(now.getTime() - (i * 0.7 + (i % 3) * 0.2) * day).toISOString();
    const locale = i % 7 === 6 ? "en" : "fr";
    const slug = `${firstName}.${lastName}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z.]/g, "");
    const id = `lead-demo-${String(i + 1).padStart(2, "0")}`;
    const messages: Record<string, string> = {
      question: locale === "fr" ? "Bonjour, est-ce que les pneus d'hiver sont inclus et le véhicule a-t-il eu des réparations de carrosserie ?" : "Hi, are winter tires included and has the vehicle had any body repairs?",
      financing: locale === "fr" ? "Je voudrais connaître mes options avec une mise de fonds de 3 000 $." : "I'd like to know my options with a $3,000 down payment.",
      trade_in: locale === "fr" ? "J'ai un Honda Civic 2018 avec 92 000 km à échanger." : "I have a 2018 Honda Civic with 92,000 km to trade in.",
      contact: locale === "fr" ? "Offrez-vous un service de livraison à domicile ?" : "Do you offer home delivery?",
      test_drive: locale === "fr" ? "Je suis disponible en fin de journée cette semaine." : "I'm available at the end of the day this week.",
    };
    const lead: Lead = {
      id,
      type,
      status: i < 6 ? "new" : i < 14 ? "contacted" : i < 20 ? "qualified" : i % 2 ? "won" : "lost",
      vehicleId,
      firstName,
      lastName,
      email: `${slug}@example.com`,
      phone: `+1514555${String(1000 + i * 37).slice(-4)}`,
      locale,
      preferredContact: (["email", "phone", "sms"] as const)[i % 3],
      message: messages[type],
      payload: type === "financing" ? { employment: "employed", income: "4000_6000", desiredPayment: "300_500" } : type === "trade_in" ? { year: 2018, make: "Honda", model: "Civic", km: 92_000, condition: 4, accidents: "no", balance: "yes" } : {},
      consentText: locale === "fr" ? "Je consens à ce qu'Idya Auto utilise mes coordonnées pour répondre à ma demande." : "I consent to Idya Auto using my contact details to answer my request.",
      consentAt: createdAt,
      assignedTo: null,
      utm: i % 4 === 0 ? { source: "google", medium: "cpc" } : null,
      chatSessionId: null,
      createdAt,
    };
    leads.push(lead);
    if (type === "test_drive") {
      // This week's bookings, Mon–Sat, 10:00–18:30 local
      const offset = (i % 6) - 2;
      const d = new Date(now.getTime() + offset * day);
      d.setUTCHours(14 + (i % 5) * 2, i % 2 ? 30 : 0, 0, 0);
      bookings.push({ id: `booking-demo-${String(i + 1).padStart(2, "0")}`, leadId: id, vehicleId, startsAt: d.toISOString(), status: offset < 0 ? "completed" : i % 4 === 0 ? "confirmed" : "new", createdAt });
    }
    const hot = type === "test_drive" || type === "financing";
    briefs.push({
      leadId: id,
      summary: locale === "fr" ? `${firstName} ${lastName} — ${type === "test_drive" ? "souhaite un essai routier cette semaine" : type === "financing" ? "demande de financement avec mise de fonds" : type === "trade_in" ? "véhicule d'échange à évaluer" : "question sur un véhicule"}.` : `${firstName} ${lastName} — ${type === "test_drive" ? "wants a test drive this week" : type === "financing" ? "financing request with down payment" : type === "trade_in" ? "trade-in to appraise" : "question about a vehicle"}.`,
      intent: hot ? "hot" : type === "trade_in" ? "warm" : "cold",
      score: hot ? 78 + (i % 15) : type === "trade_in" ? 55 + (i % 10) : 30 + (i % 12),
      reasons: hot ? ["Demande d'action concrète", "Véhicule précis identifié", "Disponibilité donnée"] : ["Question générale", "Pas de véhicule précis"],
      vehiclesOfInterest: vehicleId ? [vehicleId] : [],
      suggestedReplyFr: `Bonjour ${firstName}, merci pour votre message. ${type === "test_drive" ? "Votre essai est confirmé; apportez votre permis de conduire." : "Un conseiller vous rappelle aujourd'hui pour en discuter."}`,
      suggestedReplyEn: `Hello ${firstName}, thank you for your message. ${type === "test_drive" ? "Your test drive is confirmed; please bring your driver's licence." : "An advisor will call you today to discuss."}`,
      model: "demo",
      createdAt,
    });
  }
  return { leads, bookings, briefs };
}
