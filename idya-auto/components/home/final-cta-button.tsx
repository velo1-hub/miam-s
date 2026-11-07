"use client";

import { useBooking } from "@/components/booking/booking-context";
import { Button } from "@/components/ui/button";

export function FinalCtaButton({ label, vehicleId }: { label: string; vehicleId?: string }) {
  const { openBooking } = useBooking();
  return (
    <Button variant="primary" size="lg" onClick={() => openBooking(vehicleId)}>
      {label}
    </Button>
  );
}
