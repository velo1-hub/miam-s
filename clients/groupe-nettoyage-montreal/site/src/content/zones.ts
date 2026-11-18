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
  popular: Array<"residential" | "deep" | "move" | "postconstruction" | "airbnb" | "office" | "restaurant" | "property">;
  travelFee: number; // CAD added to residential bookings
}
export const ZONES: Zone[] = [
  { id: "montreal", slug: { fr: "montreal", en: "montreal" }, name: { fr: "Montréal", en: "Montréal" }, region: { fr: "Île de Montréal", en: "Island of Montréal" },
    intro: { fr: "Notre base est à Montréal : équipes attitrées dans chaque arrondissement, créneaux le lendemain, aucun frais de déplacement sur l'île.", en: "Our home base is Montréal: dedicated teams in every borough, next-day slots, no travel fee on the island." },
    local: { fr: "De Villeray à Verdun et de NDG à Hochelaga, nous connaissons les réalités du parc immobilier montréalais : triplex avec escaliers extérieurs, condos de 2010 avec planchers de béton ciré, appartements chauffés à l'eau chaude où la poussière se dépose sur les radiateurs. Nos listes de vérification tiennent compte de ces détails.", en: "From Villeray to Verdun and NDG to Hochelaga, we know the realities of Montréal housing: triplexes with outdoor staircases, 2010s condos with polished concrete floors, hot-water-heated apartments where dust settles on radiators. Our checklists account for these details." },
    sectors: ["Villeray", "Rosemont", "La Petite-Patrie", "Hochelaga-Maisonneuve", "Verdun", "Sud-Ouest", "Notre-Dame-de-Grâce", "Côte-des-Neiges", "Outremont", "Ahuntsic", "Saint-Laurent", "Mercier"],
    popular: ["residential", "deep", "move", "airbnb", "office", "property"], travelFee: 0 },
  { id: "plateau", slug: { fr: "plateau-mont-royal", en: "plateau-mont-royal" }, name: { fr: "Plateau-Mont-Royal et Mile End", en: "Plateau-Mont-Royal and Mile End" }, region: { fr: "Montréal", en: "Montréal" },
    intro: { fr: "Le quartier avec le plus de rotations Airbnb et de restaurants au mètre carré. Nous y avons deux équipes dédiées, sept jours sur sept.", en: "The neighbourhood with the most Airbnb turnovers and restaurants per square metre. We have two dedicated teams there, seven days a week." },
    local: { fr: "Lofts de l'avenue du Parc, 5½ sur Saint-Denis avec boiseries d'origine, cafés et bars de Saint-Laurent : le Plateau demande du soin pour le bois, des produits sans odeur pour les voyageurs et des passages tôt le matin pour les commerces. Le stationnement est compliqué, nos équipes arrivent en véhicule compact ou en transport en commun avec le matériel.", en: "Park Avenue lofts, Saint-Denis 5½s with original woodwork, Saint-Laurent cafés and bars: the Plateau calls for care with wood, odour-free products for guests and early-morning visits for shops. Parking is hard, so our teams arrive in compact vehicles or by transit with the equipment." },
    sectors: ["Mile End", "Plateau Est", "Plateau Ouest", "Milton-Parc", "Laurier", "Mont-Royal avenue"],
    popular: ["airbnb", "residential", "restaurant", "move"], travelFee: 0 },
  { id: "centre-ville", slug: { fr: "centre-ville", en: "downtown" }, name: { fr: "Centre-ville et Vieux-Montréal", en: "Downtown and Old Montréal" }, region: { fr: "Ville-Marie", en: "Ville-Marie" },
    intro: { fr: "Bureaux, tours de condos avec sécurité, hôtels-appartements et restaurants du Vieux-Port : nos équipes sont habituées aux protocoles d'accès et aux heures de nuit.", en: "Offices, secured condo towers, apartment-hotels and Old Port restaurants: our teams are used to access protocols and night hours." },
    local: { fr: "Griffintown, Quartier international, Vieux-Montréal : accès par le quai de chargement, enregistrement à la sécurité, ascenseurs de service réservés à l'avance. Nous gérons ces contraintes pour vous et les consignons dans la fiche de votre immeuble. Les condos du Vieux-Montréal, avec pierre et bois anciens, ont leur propre liste de produits.", en: "Griffintown, Quartier international, Old Montréal: loading-dock access, security sign-in, service elevators booked in advance. We handle these constraints and record them in your building file. Old Montréal condos, with heritage stone and wood, have their own product list." },
    sectors: ["Griffintown", "Vieux-Montréal", "Quartier des spectacles", "Quartier international", "Shaughnessy Village", "Centre-Sud"],
    popular: ["office", "residential", "airbnb", "restaurant", "property"], travelFee: 0 },
  { id: "laval", slug: { fr: "laval", en: "laval" }, name: { fr: "Laval", en: "Laval" }, region: { fr: "Rive-Nord", en: "North Shore" },
    intro: { fr: "Maisons unifamiliales, parcs industriels et bureaux de Chomedey : une équipe basée à Laval, sans frais de déplacement pour les services récurrents.", en: "Single-family homes, industrial parks and Chomedey offices: a Laval-based team, no travel fee for recurring service." },
    local: { fr: "À Laval, les maisons sont plus grandes et les sous-sols aménagés : nos forfaits résidentiels tiennent compte des étages supplémentaires. Les bureaux de Chomedey et les parcs industriels de Vimont et Saint-François ont des passages de soir avec stationnement facile, ce qui nous permet d'y proposer des tarifs commerciaux parmi les plus compétitifs.", en: "In Laval, homes are bigger with finished basements: our residential packages account for extra floors. Chomedey offices and the Vimont and Saint-François industrial parks get evening visits with easy parking, which lets us offer some of our most competitive commercial rates there." },
    sectors: ["Chomedey", "Laval-des-Rapides", "Pont-Viau", "Vimont", "Sainte-Rose", "Sainte-Dorothée", "Duvernay", "Saint-François"],
    popular: ["residential", "deep", "office", "postconstruction"], travelFee: 15 },
  { id: "longueuil", slug: { fr: "longueuil", en: "longueuil" }, name: { fr: "Longueuil", en: "Longueuil" }, region: { fr: "Rive-Sud", en: "South Shore" },
    intro: { fr: "Vieux-Longueuil, Saint-Hubert, Greenfield Park : résidentiel récurrent, remises de clés et bureaux du boulevard Taschereau.", en: "Old Longueuil, Saint-Hubert, Greenfield Park: recurring residential, key handovers and Taschereau boulevard offices." },
    local: { fr: "Les plex du Vieux-Longueuil et les bungalows de Saint-Hubert font l'essentiel de nos visites sur la Rive-Sud. Nos équipes traversent le pont Jacques-Cartier à contre-courant, ce qui nous permet d'offrir des créneaux de 8 h fiables même en semaine.", en: "Old Longueuil plexes and Saint-Hubert bungalows make up most of our South Shore visits. Our teams cross the Jacques-Cartier bridge against traffic, which lets us offer reliable 8 a.m. slots even on weekdays." },
    sectors: ["Vieux-Longueuil", "Saint-Hubert", "Greenfield Park", "Le Moyne", "Saint-Lambert"],
    popular: ["residential", "move", "office", "property"], travelFee: 15 },
  { id: "brossard", slug: { fr: "brossard", en: "brossard" }, name: { fr: "Brossard", en: "Brossard" }, region: { fr: "Rive-Sud", en: "South Shore" },
    intro: { fr: "Quartier DIX30, secteurs L, M et R, tours de condos près du REM : entretien résidentiel haut de gamme et commerces.", en: "Quartier DIX30, L, M and R sectors, condo towers near the REM: premium residential and retail." },
    local: { fr: "Brossard combine de grandes maisons récentes avec planchers de bois franc et quartz, et les commerces du DIX30 avec des passages avant l'ouverture. Nous intervenons aussi dans les nouvelles tours Solar Uniquartier, où l'accès se fait par la conciergerie.", en: "Brossard combines large newer homes with hardwood and quartz, and DIX30 retail with pre-opening visits. We also serve the new Solar Uniquartier towers, where access goes through the concierge." },
    sectors: ["DIX30", "Secteur L", "Secteur M", "Secteur R", "Secteur P", "Solar Uniquartier"],
    popular: ["residential", "deep", "office", "postconstruction"], travelFee: 20 },
  { id: "ouest", slug: { fr: "ouest-de-lile", en: "west-island" }, name: { fr: "Ouest-de-l'Île", en: "West Island" }, region: { fr: "Montréal", en: "Montréal" },
    intro: { fr: "Pointe-Claire, Dollard, Kirkland, Beaconsfield : maisons familiales, bureaux de l'autoroute 40 et locations court terme près de l'aéroport.", en: "Pointe-Claire, Dollard, Kirkland, Beaconsfield: family homes, Highway 40 offices and short-term rentals near the airport." },
    local: { fr: "Grandes maisons avec piscine et sous-sol, animaux dans la majorité des foyers, et un parc de bureaux dense le long de la 40 : notre équipe de l'Ouest travaille en anglais et en français et réserve les créneaux du matin aux familles.", en: "Large homes with pools and basements, pets in most households, and a dense office park along the 40: our West Island team works in English and French and keeps morning slots for families." },
    sectors: ["Pointe-Claire", "Dollard-des-Ormeaux", "Kirkland", "Beaconsfield", "Dorval", "Pierrefonds", "Île-Bizard"],
    popular: ["residential", "deep", "office", "airbnb"], travelFee: 15 },
];
export const zoneBySlug = (locale: Locale, slug: string) => ZONES.find((z) => z.slug[locale] === slug);
