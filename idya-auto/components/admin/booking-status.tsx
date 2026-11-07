"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateBookingAction } from "@/app/admin/actions";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/leads/types";

const FR: Record<BookingStatus, string> = { new: "Nouveau", confirmed: "Confirmé", completed: "Complété", cancelled: "Annulé", no_show: "Absent" };

export function BookingStatusSelect({ id, status }: { id: string; status: BookingStatus }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => start(async () => { await updateBookingAction(id, e.target.value as BookingStatus); router.refresh(); })}
      aria-label="Statut de l'essai"
      className="no-red mt-1 h-7 w-full rounded-chip border border-line bg-surface px-2 text-caption text-text outline-none"
    >
      {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{FR[s]}</option>)}
    </select>
  );
}
