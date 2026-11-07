export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface DayHours {
  /** "09:00" local time (America/Toronto); null = closed */
  open: string | null;
  close: string | null;
}

export interface CreditFee {
  labelFr: string;
  labelEn: string;
  amountCad: number;
}

export interface BusinessInfo {
  legalName: string;
  displayName: string;
  city: string;
  addressLine1: string;
  postalCode: string;
  province: string;
  phone: string;
  email: string;
  leadsEmail: string;
  mapsUrl: string;
  googleBusinessUrl: string | null;
  socials: { instagram?: string; facebook?: string; tiktok?: string };
  lat: number | null;
  lng: number | null;
}

export interface BookingRules {
  slotMinutes: number;
  capacityPerSlot: number;
  minLeadHours: number;
  horizonDays: number;
}

export interface FinanceDefaults {
  /** Annual nominal rate in percent, e.g. 7.99 */
  defaultRatePct: number;
  terms: number[];
  defaultTerm: number;
  creditFees: CreditFee[];
  gstPct: number;
  qstPct: number;
  disclaimerFr: string;
  disclaimerEn: string;
}

export interface WarrantyTexts {
  A: { fr: string; en: string };
  B: { fr: string; en: string };
  C: { fr: string; en: string };
  D: { fr: string; en: string };
}

export interface PrivacyOfficer {
  name: string;
  title: string;
  email: string;
  phone: string | null;
}

export interface Settings {
  business: BusinessInfo;
  hours: Record<Weekday, DayHours>;
  closures: { day: string; reason: string }[];
  booking: BookingRules;
  finance: FinanceDefaults;
  warranty: WarrantyTexts;
  privacyOfficer: PrivacyOfficer;
  retention: { leadsMonths: number; chatDays: number };
  assistant: { name: string; enabled: boolean; afterHoursNote: { fr: string; en: string } };
  featuredVehicleId: string | null;
  hero: {
    posterUrl: string | null;
    posterMobileUrl: string | null;
    av1Url: string | null;
    h264Url: string | null;
    mobileUrl: string | null;
  };
  whyUs: { key: string; fr: { title: string; body: string }; en: { title: string; body: string }; enabled: boolean }[];
}
