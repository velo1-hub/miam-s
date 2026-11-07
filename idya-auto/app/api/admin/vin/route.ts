import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import type { BodyType, Drivetrain, FuelType } from "@/lib/vehicles/types";

/** « Décoder le NIV » — brief §15: free NHTSA vPIC API, fills year/make/model/trim/engine. Staff only. */
export async function GET(req: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const vin = new URL(req.url).searchParams.get("vin")?.toUpperCase().trim() ?? "";
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return NextResponse.json({ ok: false, error: "NIV invalide" }, { status: 400 });
  try {
    const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`, { next: { revalidate: 86_400 } });
    const json = (await res.json()) as { Results?: Record<string, string>[] };
    const r = json.Results?.[0];
    if (!r || r.ErrorCode?.startsWith("1")) return NextResponse.json({ ok: false, error: r?.ErrorText ?? "Aucun résultat" });
    const body = (r.BodyClass ?? "").toLowerCase();
    const bodyType: BodyType | undefined = /pickup|truck/.test(body) ? "truck" : /suv|crossover|sport utility/.test(body) ? "suv" : /minivan|van/.test(body) ? "minivan" : /coupe/.test(body) ? "coupe" : /hatchback/.test(body) ? "hatchback" : /wagon/.test(body) ? "wagon" : /convertible|roadster/.test(body) ? "convertible" : /sedan/.test(body) ? "sedan" : undefined;
    const fuel = (r.FuelTypePrimary ?? "").toLowerCase();
    const fuelType: FuelType | undefined = r.ElectrificationLevel?.toLowerCase().includes("bev") || /electric/.test(fuel) ? "electric" : r.ElectrificationLevel?.toLowerCase().includes("phev") ? "plug_in_hybrid" : r.ElectrificationLevel?.toLowerCase().includes("hev") ? "hybrid" : /diesel/.test(fuel) ? "diesel" : /gasoline/.test(fuel) ? "gasoline" : undefined;
    const drive = (r.DriveType ?? "").toLowerCase();
    const drivetrain: Drivetrain | undefined = /4wd|4x4/.test(drive) ? "4wd" : /awd|all/.test(drive) ? "awd" : /rwd|rear/.test(drive) ? "rwd" : /fwd|front/.test(drive) ? "fwd" : undefined;
    const engine = [r.DisplacementL ? `${Number(r.DisplacementL).toFixed(1).replace(".", ",")} L` : "", r.EngineCylinders ? `${r.EngineCylinders} cylindres` : "", /turbo/i.test(r.Turbo ?? "") ? "turbo" : ""].filter(Boolean).join(" ");
    return NextResponse.json({ ok: true, year: Number(r.ModelYear) || undefined, make: r.Make ? titleCase(r.Make) : undefined, model: r.Model || undefined, trim: r.Trim || undefined, engine: engine || undefined, bodyType, fuelType, drivetrain, doors: Number(r.Doors) || undefined });
  } catch {
    return NextResponse.json({ ok: false, error: "Service NHTSA indisponible" }, { status: 502 });
  }
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()).replace(/\bBmw\b/, "BMW").replace(/\bGmc\b/, "GMC");
