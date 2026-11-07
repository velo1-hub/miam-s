"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { VehicleRail } from "@/components/vehicle/vehicle-rail";
import { Link, usePathname } from "@/i18n/navigation";
import type { VehicleCardData } from "@/lib/vehicles/card";

/**
 * 404 content. On vehicle URLs it becomes the brief's §8.7 page (« Ce véhicule a déjà trouvé
 * preneur. » + search + recent arrivals) while keeping a real 404 status from notFound().
 */
export function NotFoundContent() {
  const t = useTranslations("notFound");
  const tv = useTranslations("vehicle");
  const pathname = usePathname();
  const vehicle = /^\/inventory\/.+/.test(pathname) || /\/(inventaire|inventory)\/.+/.test(pathname);
  const [recent, setRecent] = useState<VehicleCardData[]>([]);
  useEffect(() => {
    if (!vehicle) return;
    const ctrl = new AbortController();
    fetch("/api/inventory?sort=newest", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j: { items: VehicleCardData[] }) => setRecent(j.items.slice(0, 6)))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [vehicle]);

  return (
    <div className="container-content flex min-h-[70svh] flex-col justify-center pb-24 pt-40">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-h1">{vehicle ? tv("notFoundTitle") : t("title")}</h1>
      <p className="mt-4 max-w-md text-body-lg text-text-2">{vehicle ? tv("notFoundBody") : t("body")}</p>
      <div className="mt-8">
        <Button asChild variant="light">
          <Link href={vehicle ? "/inventory" : "/"}>{vehicle ? tv("notFoundSearch") : t("home")}</Link>
        </Button>
      </div>
      {vehicle && recent.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-h3">{tv("recentArrivals")}</h2>
          <VehicleRail vehicles={recent} />
        </section>
      )}
    </div>
  );
}
