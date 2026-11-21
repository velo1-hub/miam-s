import type { ServiceId } from "./services";
/** Photo per service. Files live in public/media; a missing file falls back to the dark aurora hero. */
export const SERVICE_PHOTO: Record<ServiceId, string> = {
  office: "/media/office.webp",
  restaurant: "/media/restaurant.webp",
  property: "/media/lobby.webp",
  airbnb: "/media/airbnb.webp",
  postconstruction: "/media/postcon.webp",
  move: "/media/unit.webp",
};
export const PHOTO = { visit: "/media/visit.webp", team: "/media/team.webp", report: "/media/report.webp", after: "/media/after.webp", before: "/media/before.webp" };
