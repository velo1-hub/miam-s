/**
 * Hand-written row types for the tables the app queries — mirrors supabase/migrations
 * (brief §16 with the C4 corrections). No code generation is available offline; keep this file in
 * step with the migrations when a column changes. Shape follows the `supabase gen types` layout so
 * `SupabaseClient<Database>` types `.from()`, `.insert()` and `.rpc()`.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VehicleStatusDb = "draft" | "available" | "pending" | "sold" | "archived";
export type VehicleConditionDb = "new" | "used" | "certified";
export type BodyTypeDb = "suv" | "sedan" | "truck" | "coupe" | "hatchback" | "wagon" | "minivan" | "convertible" | "van";
export type DrivetrainDb = "fwd" | "rwd" | "awd" | "4wd";
export type TransmissionDb = "automatic" | "manual" | "cvt" | "dct";
export type FuelTypeDb = "gasoline" | "hybrid" | "plug_in_hybrid" | "electric" | "diesel";
export type WarrantyClassDb = "A" | "B" | "C" | "D";
export type MediaKindDb = "spin" | "interior" | "gallery" | "panorama";
export type LeadTypeDb = "test_drive" | "question" | "financing" | "trade_in" | "contact" | "inventory_alert";
export type LeadStatusDb = "new" | "contacted" | "qualified" | "won" | "lost" | "spam";
export type StaffRoleDb = "owner" | "manager" | "sales";

/** Insert type: the listed keys are required, everything else optional (defaults / nullable). */
type InsertOf<Row, Required extends keyof Row> = Pick<Row, Required> & Partial<Omit<Row, Required>>;

export type VehicleRow = {
  id: string;
  slug: string;
  stock_number: string;
  vin: string | null;
  status: VehicleStatusDb;
  condition: VehicleConditionDb | null;
  year: number;
  make: string;
  model: string;
  trim_level: string | null;
  body_type: BodyTypeDb | null;
  drivetrain: DrivetrainDb | null;
  transmission: TransmissionDb | null;
  fuel_type: FuelTypeDb | null;
  engine: string | null;
  horsepower: number | null;
  electric_range_km: number | null;
  odometer_km: number | null;
  exterior_color: string | null;
  exterior_color_hex: string | null;
  interior_color: string | null;
  doors: number | null;
  seats: number | null;
  price_cad: number | null;
  previous_price_cad: number | null;
  description_fr: string;
  description_en: string | null;
  features: string[];
  carfax_url: string | null;
  accident_free: boolean | null;
  owners_count: number | null;
  warranty_class: WarrantyClassDb | null;
  manufacturer_warranty_fr: string | null;
  manufacturer_warranty_en: string | null;
  featured: boolean;
  demo: boolean;
  spin_frame_count: number | null;
  spin_cover_frame: number;
  spin_reverse: boolean;
  spin_version: number;
  spin_meta: Json | null;
  published_at: string | null;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VehicleMediaRow = {
  id: string;
  vehicle_id: string;
  kind: MediaKindDb;
  position: number;
  path: string;
  width: number | null;
  height: number | null;
  lqip: string | null;
  alt_fr: string | null;
  alt_en: string | null;
};

export type LeadRow = {
  id: string;
  type: LeadTypeDb;
  status: LeadStatusDb;
  vehicle_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  locale: string;
  preferred_contact: string | null;
  message: string | null;
  payload: Json;
  consent_text: string;
  consent_at: string;
  assigned_to: string | null;
  utm: Json | null;
  chat_session_id: string | null;
  created_at: string;
};

export type TestDriveBookingRow = {
  id: string;
  lead_id: string;
  vehicle_id: string | null;
  starts_at: string;
  status: string;
  created_at: string;
};

export type LeadNoteRow = {
  id: string;
  lead_id: string | null;
  author: string | null;
  body: string;
  created_at: string | null;
};

export type LeadAiRow = {
  lead_id: string;
  summary: string | null;
  intent: string | null;
  score: number | null;
  reasons: string[] | null;
  vehicles_of_interest: string[] | null;
  suggested_reply_fr: string | null;
  suggested_reply_en: string | null;
  model: string | null;
  created_at: string;
};

export type StaffRow = {
  user_id: string;
  role: StaffRoleDb;
  full_name: string | null;
};

export type ClosureRow = {
  day: string;
  reason: string | null;
};

export type SettingsRow = {
  id: number;
  /** The Settings object (lib/settings/types.ts) — typed loosely so the admin can write it as is. */
  data: unknown;
};

export type AuditLogRow = {
  id: number;
  actor: string | null;
  table_name: string | null;
  row_id: string | null;
  action: string | null;
  diff: Json | null;
  created_at: string | null;
};

export type ChatSessionRow = {
  id: string;
  locale: string;
  page_url: string | null;
  vehicle_id: string | null;
  lead_id: string | null;
  started_at: string;
  last_message_at: string | null;
  message_count: number;
};

export type ChatMessageRow = {
  id: number;
  session_id: string;
  role: string;
  content: Json;
  tokens_in: number | null;
  tokens_out: number | null;
  created_at: string;
};

export type KnowledgeBaseRow = {
  id: string;
  question_fr: string;
  answer_fr: string;
  question_en: string | null;
  answer_en: string | null;
  active: boolean;
  updated_at: string;
};

export type AiUsageDailyRow = {
  day: string;
  usd: number;
  calls: number;
};

export type SearchCacheRow = {
  query_key: string;
  result: Json;
  created_at: string;
};

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: InsertOf<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      vehicles: Table<VehicleRow, "slug" | "stock_number" | "year" | "make" | "model">;
      vehicle_media: Table<VehicleMediaRow, "vehicle_id" | "kind" | "position" | "path">;
      leads: Table<LeadRow, "type" | "consent_text" | "consent_at">;
      test_drive_bookings: Table<TestDriveBookingRow, "lead_id" | "starts_at">;
      lead_notes: Table<LeadNoteRow, "body">;
      lead_ai: Table<LeadAiRow, "lead_id">;
      staff: Table<StaffRow, "user_id" | "role">;
      closures: Table<ClosureRow, "day">;
      settings: Table<SettingsRow, "data">;
      audit_log: Table<AuditLogRow, never>;
      chat_sessions: Table<ChatSessionRow, "id">;
      chat_messages: Table<ChatMessageRow, "session_id" | "role" | "content">;
      knowledge_base: Table<KnowledgeBaseRow, "question_fr" | "answer_fr">;
      ai_usage_daily: Table<AiUsageDailyRow, "day">;
      search_cache: Table<SearchCacheRow, "query_key" | "result">;
    };
    Views: Record<string, never>;
    Functions: {
      staff_role: { Args: Record<string, never>; Returns: StaffRoleDb | null };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_manager: { Args: Record<string, never>; Returns: boolean };
      is_owner: { Args: Record<string, never>; Returns: boolean };
      record_ai_usage: {
        Args: { p_day: string; p_usd: number; p_calls: number };
        Returns: { day: string; usd: number; calls: number }[];
      };
    };
    Enums: {
      vehicle_status: VehicleStatusDb;
      vehicle_condition: VehicleConditionDb;
      body_type: BodyTypeDb;
      drivetrain: DrivetrainDb;
      transmission: TransmissionDb;
      fuel_type: FuelTypeDb;
      warranty_class: WarrantyClassDb;
      media_kind: MediaKindDb;
      lead_type: LeadTypeDb;
      lead_status: LeadStatusDb;
      staff_role: StaffRoleDb;
    };
    CompositeTypes: Record<string, never>;
  };
};

/** Loose UUID check — client-supplied ids (favorites, demo ids like "v01") must never reach a uuid column. */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (value: string): boolean => UUID_RE.test(value);
