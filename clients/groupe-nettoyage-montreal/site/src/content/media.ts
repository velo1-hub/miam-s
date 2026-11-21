import type { ServiceId } from "./services";
/** Photo per service. Files live in public/media; a missing file falls back to the dark aurora hero. */
export const SERVICE_PHOTO: Record<ServiceId, string> = {
  residential: "/media/residential.webp",
  deep: "/media/deep.webp",
  move: "/media/move.webp",
  postconstruction: "/media/postcon.webp",
  airbnb: "/media/airbnb.webp",
  office: "/media/office.webp",
  restaurant: "/media/restaurant.webp",
  property: "/media/lobby.webp",
};
export const PHOTO = { visit: "/media/visit.webp", team: "/media/team.webp", report: "/media/report.webp", after: "/media/after.webp", before: "/media/before.webp" };
