import type { Locale } from "@/i18n/config";
type L = Record<Locale, string>;
export interface Zone {
  id: string;
  slug: L;
  name: L;
  region: L;
  intro: L;
  local: L; // genuinely local paragraph
  sectors: string[];
  popular: Array<"move" | "postconstruction" | "airbnb" | "office" | "restaurant" | "property">;
}
export const ZONES: Zone[] = [
  { id: "montreal", slug: { fr: "montreal", en: "montreal" }, name: { fr: "Montréal", en: "Montréal" }, region: { fr: "Île de Montréal", en: "Island of Montréal" },
    intro: { fr: "Notre base est à Montréal : équipes attitrées dans chaque arrondissement, visite d'évaluation en 48 heures, bureaux, immeubles et commerces de toute l'île.", en: "Our home base is Montréal: dedicated teams in every borough, walkthrough within 48 hours, offices, buildings and shops across the island." },
    local: { fr: "De Villeray à Verdun et de NDG à Hochelaga, nous connaissons les réalités du parc immobilier montréalais : plex avec escaliers extérieurs, tours de condos de 2010 avec planchers de béton ciré, immeubles chauffés à l'eau chaude où la poussière se dépose sur les radiateurs des aires communes. Nos listes de vérification par immeuble tiennent compte de ces détails.", en: "From Villeray to Verdun and NDG to Hochelaga, we know the realities of Montréal buildings: plexes with outdoor staircases, 2010s condo towers with polished concrete floors, hot-water-heated buildings where dust settles on common-area radiators. Our per-building checklists account for these details." },
    sectors: ["Villeray", "Rosemont", "La Petite-Patrie", "Hochelaga-Maisonneuve", "Verdun", "Sud-Ouest", "Notre-Dame-de-Grâce", "Côte-des-Neiges", "Outremont", "Ahuntsic", "Saint-Laurent", "Mercier"],
    popular: ["office", "property", "airbnb", "restaurant", "move"] },
  { id: "plateau", slug: { fr: "plateau-mont-royal", en: "plateau-mont-royal" }, name: { fr: "Plateau-Mont-Royal et Mile End", en: "Plateau-Mont-Royal and Mile End" }, region: { fr: "Montréal", en: "Montréal" },
    intro: { fr: "Le quartier avec le plus de rotations Airbnb et de restaurants au mètre carré. Nous y avons deux équipes dédiées, sept jours sur sept.", en: "The neighbourhood with the most Airbnb turnovers and restaurants per square metre. We have two dedicated teams there, seven days a week." },
    local: { fr: "Lofts de l'avenue du Parc, 5½ sur Saint-Denis avec boiseries d'origine, cafés et bars de Saint-Laurent : le Plateau demande du soin pour le bois, des produits sans odeur pour les voyageurs et des passages tôt le matin pour les commerces. Le stationnement est compliqué, nos équipes arrivent en véhicule compact ou en transport en commun avec le matériel.", en: "Park Avenue lofts, Saint-Denis 5½s with original woodwork, Saint-Laurent cafés and bars: the Plateau calls for care with wood, odour-free products for guests and early-morning visits for shops. Parking is hard, so our teams arrive in compact vehicles or by transit with the equipment." },
    sectors: ["Mile End", "Plateau Est", "Plateau Ouest", "Milton-Parc", "Laurier", "Mont-Royal avenue"],
    popular: ["airbnb", "restaurant", "property", "move"] },
  { id: "centre-ville", slug: { fr: "centre-ville", en: "downtown" }, name: { fr: "Centre-ville et Vieux-Montréal", en: "Downtown and Old Montréal" }, region: { fr: "Ville-Marie", en: "Ville-Marie" },
    intro: { fr: "Bureaux, tours de condos avec sécurité, hôtels-appartements et restaurants du Vieux-Port : nos équipes sont habituées aux protocoles d'accès et aux heures de nuit.", en: "Offices, secured condo towers, apartment-hotels and Old Port restaurants: our teams are used to access protocols and night hours." },
    local: { fr: "Griffintown, Quartier international, Vieux-Montréal : accès par le quai de chargement, enregistrement à la sécurité, ascenseurs de service réservés à l'avance. Nous gérons ces contraintes pour vous et les consignons dans la fiche de votre immeuble. Les condos du Vieux-Montréal, avec pierre et bois anciens, ont leur propre liste de produits.", en: "Griffintown, Quartier international, Old Montréal: loading-dock access, security sign-in, service elevators booked in advance. We handle these constraints and record them in your building file. Old Montréal condos, with heritage stone and wood, have their own product list." },
    sectors: ["Griffintown", "Vieux-Montréal", "Quartier des spectacles", "Quartier international", "Shaughnessy Village", "Centre-Sud"],
    popular: ["office", "property", "airbnb", "restaurant"] },
  { id: "laval", slug: { fr: "laval", en: "laval" }, name: { fr: "Laval", en: "Laval" }, region: { fr: "Rive-Nord", en: "North Shore" },
    intro: { fr: "Parcs industriels, bureaux de Chomedey, immeubles locatifs et chantiers neufs : une équipe basée à Laval pour les passages de soir.", en: "Industrial parks, Chomedey offices, rental buildings and new builds: a Laval-based team for evening visits." },
    local: { fr: "Les bureaux de Chomedey et les parcs industriels de Vimont et Saint-François ont des passages de soir avec stationnement facile et accès direct par la 15 et la 440. Les promoteurs qui livrent des condos à Sainte-Dorothée et Duvernay nous réservent les passes de finition dès la pose des planchers.", en: "Chomedey offices and the Vimont and Saint-François industrial parks get evening visits with easy parking and direct access via the 15 and 440. Developers handing over condos in Sainte-Dorothée and Duvernay book our finishing passes as soon as the floors go in." },
    sectors: ["Chomedey", "Laval-des-Rapides", "Pont-Viau", "Vimont", "Sainte-Rose", "Sainte-Dorothée", "Duvernay", "Saint-François"],
    popular: ["office", "postconstruction", "property"] },
  { id: "longueuil", slug: { fr: "longueuil", en: "longueuil" }, name: { fr: "Longueuil", en: "Longueuil" }, region: { fr: "Rive-Sud", en: "South Shore" },
    intro: { fr: "Vieux-Longueuil, Saint-Hubert, Greenfield Park : immeubles locatifs, remises de clés et bureaux du boulevard Taschereau.", en: "Old Longueuil, Saint-Hubert, Greenfield Park: rental buildings, key handovers and Taschereau boulevard offices." },
    local: { fr: "Les plex et petits immeubles du Vieux-Longueuil et les bureaux de Taschereau font l'essentiel de nos passages sur la Rive-Sud. Nos équipes traversent le pont Jacques-Cartier à contre-courant, ce qui nous permet d'offrir des créneaux de 6 h et de 18 h fiables même en semaine.", en: "Old Longueuil plexes and small buildings and the Taschereau offices make up most of our South Shore visits. Our teams cross the Jacques-Cartier bridge against traffic, which lets us offer reliable 6 a.m. and 6 p.m. slots even on weekdays." },
    sectors: ["Vieux-Longueuil", "Saint-Hubert", "Greenfield Park", "Le Moyne", "Saint-Lambert"],
    popular: ["property", "move", "office"] },
  { id: "brossard", slug: { fr: "brossard", en: "brossard" }, name: { fr: "Brossard", en: "Brossard" }, region: { fr: "Rive-Sud", en: "South Shore" },
    intro: { fr: "Quartier DIX30, tours de condos près du REM, bureaux et commerces : syndicats, gestionnaires et détaillants de Brossard.", en: "Quartier DIX30, condo towers near the REM, offices and retail: Brossard condo boards, managers and retailers." },
    local: { fr: "Les commerces du DIX30 demandent des passages avant l'ouverture, et les nouvelles tours Solar Uniquartier un accès par la conciergerie et des aires communes au fini haut de gamme. Nous consignons ces protocoles dans la fiche de chaque immeuble.", en: "DIX30 retail calls for pre-opening visits, and the new Solar Uniquartier towers for concierge access and high-end common-area finishes. We record those protocols in each building's file." },
    sectors: ["DIX30", "Secteur L", "Secteur M", "Secteur R", "Secteur P", "Solar Uniquartier"],
    popular: ["office", "postconstruction", "property"] },
  { id: "ouest", slug: { fr: "ouest-de-lile", en: "west-island" }, name: { fr: "Ouest-de-l'Île", en: "West Island" }, region: { fr: "Montréal", en: "Montréal" },
    intro: { fr: "Pointe-Claire, Dollard, Kirkland, Beaconsfield : parc de bureaux de l'autoroute 40, cliniques et locations court terme près de l'aéroport.", en: "Pointe-Claire, Dollard, Kirkland, Beaconsfield: the Highway 40 office park, clinics and short-term rentals near the airport." },
    local: { fr: "Un parc de bureaux dense le long de la 40, des cliniques à Pointe-Claire et des locations meublées près de Dorval : notre équipe de l'Ouest travaille en anglais et en français et planifie les passages de bureaux après 18 h.", en: "A dense office park along the 40, clinics in Pointe-Claire and furnished rentals near Dorval: our West Island team works in English and French and schedules office visits after 6 p.m." },
    sectors: ["Pointe-Claire", "Dollard-des-Ormeaux", "Kirkland", "Beaconsfield", "Dorval", "Pierrefonds", "Île-Bizard"],
    popular: ["office", "airbnb", "property"] },
];
export const zoneBySlug = (locale: Locale, slug: string) => ZONES.find((z) => z.slug[locale] === slug);
