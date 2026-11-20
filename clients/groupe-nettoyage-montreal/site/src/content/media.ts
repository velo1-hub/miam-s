import type { ServiceId } from "./services";
/** Photo per service. Files live in public/media; a missing file falls back to the dark aurora hero. */
export const SERVICE_PHOTO: Record<ServiceId, string> = {
  residential: "/media/visit.webp", // TODO swap for residential.webp once generated
  deep: "/media/after.webp", // TODO swap for deep.webp once generated
  move: "/media/move.webp",
  postconstruction: "/media/postcon.webp",
  airbnb: "/media/airbnb.webp",
  office: "/media/office.webp", // temporary crop of the lobby entrance until the office photo is generated
  restaurant: "/media/restaurant.webp",
  property: "/media/lobby.webp",
};
export const PHOTO = { visit: "/media/visit.webp", team: "/media/team.webp", report: "/media/report.webp", after: "/media/after.webp", before: "/media/before.webp" };
