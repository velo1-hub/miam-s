/** Analytics events — brief §21. Plausible custom events, cookieless. No-op without Plausible. */
export type AnalyticsEvent =
  | "search_submitted"
  | "ai_search_submitted"
  | "assistant_opened"
  | "assistant_message_sent"
  | "assistant_tool_used"
  | "assistant_handoff"
  | "filter_applied"
  | "vehicle_viewed"
  | "spin_interacted"
  | "spin_completed"
  | "gallery_opened"
  | "favorite_added"
  | "compare_added"
  | "calculator_used"
  | "booking_started"
  | "booking_completed"
  | "lead_submitted"
  | "phone_clicked"
  | "directions_clicked"
  | "language_switched";

type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void;
  }
}

export function track(event: AnalyticsEvent, props?: Props): void {
  if (typeof window === "undefined") return;
  window.plausible?.(event, props ? { props } : undefined);
}
