export const STAFF_ROLES = ["owner", "manager", "sales"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export interface AuditEntry {
  id: string;
  actor: string;
  actorName: string;
  table: "vehicles" | "settings" | "leads" | "bookings" | "knowledge_base" | "staff";
  rowId: string;
  action: "create" | "update" | "delete" | "status" | "price" | "publish";
  diff: Record<string, { from: unknown; to: unknown }>;
  createdAt: string;
}
