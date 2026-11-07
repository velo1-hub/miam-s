import { buildIcs } from "@/lib/booking/ics";
import { env } from "@/lib/env";
import { getLeadRepository } from "@/lib/leads";
import { getSettings } from "@/lib/settings";
import { getVehicleRepository } from "@/lib/vehicles";
import { vehicleFullTitle } from "@/lib/vehicles/types";

/** .ics download for a booking — brief §12 « Ajouter à mon calendrier ». */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = await getLeadRepository();
  const booking = await repo.getBooking(id);
  if (!booking) return new Response("Not found", { status: 404 });
  const settings = await getSettings();
  const vehicle = booking.vehicleId ? await (await getVehicleRepository()).getById(booking.vehicleId) : null;
  const fr = booking.lead.locale === "fr";
  const title = vehicle ? vehicleFullTitle(vehicle) : settings.business.displayName;
  const ics = buildIcs({
    uid: booking.id,
    startsAt: booking.startsAt,
    durationMinutes: settings.booking.slotMinutes,
    title: fr ? `Essai routier · ${title}` : `Test drive · ${title}`,
    description: fr ? `Idya Auto. Apportez votre permis de conduire. ${settings.business.phone}` : `Idya Auto. Bring your driver's licence. ${settings.business.phone}`,
    location: `${settings.business.addressLine1}, ${settings.business.city}, ${settings.business.province} ${settings.business.postalCode}`,
    url: env.siteUrl,
  });
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="essai-routier-${booking.id}.ics"` } });
}
