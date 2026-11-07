import { z } from "zod";
import { isValidCanadianPhone } from "@/lib/format/phone";

/*
 * Zod schemas shared by forms and Server Actions — brief §13. Error messages are translation keys
 * under `forms.errors.*`, resolved in the UI. Never collects SIN or date of birth (§17.5).
 */
const required = (max = 200) => z.string().trim().min(1, "required").max(max, "max");
const email = z.string().trim().toLowerCase().email("email").max(254);
const phone = z.string().trim().refine(isValidCanadianPhone, "phone");
const consent = z.literal(true, { message: "consent" });
const localeSchema = z.enum(["fr", "en"]).default("fr");
/** Honeypot: must stay empty (hidden field named "website") */
const honeypot = z.string().max(0, "spam").optional().default("");
const turnstile = z.string().optional().default("");

export const questionSchema = z
  .object({
    name: required(120),
    email: email.optional().or(z.literal("")),
    phone: phone.optional().or(z.literal("")),
    message: required(2000),
    vehicleId: z.string().max(64).optional().default(""),
    vehicle: z.string().max(200).optional().default(""),
    consent,
    locale: localeSchema,
    website: honeypot,
    turnstileToken: turnstile,
  })
  .refine((d) => Boolean(d.email || d.phone), { message: "emailOrPhone", path: ["email"] });

export const contactSchema = z.object({
  name: required(120),
  email,
  phone: phone.optional().or(z.literal("")),
  subject: z.enum(["general", "vehicle", "service", "other"]),
  message: required(3000),
  consent,
  locale: localeSchema,
  website: honeypot,
  turnstileToken: turnstile,
});

export const financingSchema = z.object({
  firstName: required(80),
  lastName: required(80),
  email,
  phone,
  employment: z.enum(["employed", "self_employed", "retired", "student", "other"]),
  income: z.enum(["lt2000", "2000_4000", "4000_6000", "gt6000"]),
  desiredVehicle: z.string().trim().max(200).optional().default(""),
  desiredPayment: z.enum(["lt300", "300_500", "500_700", "gt700"]),
  vehicleId: z.string().max(64).optional().default(""),
  consent,
  locale: localeSchema,
  website: honeypot,
  turnstileToken: turnstile,
});

export const vinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/, "vin");

export const tradeInSchema = z
  .object({
    vin: vinSchema.optional().or(z.literal("")),
    year: z.coerce.number().int().min(1980, "min").max(2030, "max").optional(),
    make: z.string().trim().max(60).optional().default(""),
    model: z.string().trim().max(60).optional().default(""),
    trim: z.string().trim().max(60).optional().default(""),
    km: z.coerce.number().int().min(0, "km").max(1_000_000, "km"),
    condition: z.coerce.number().int().min(1).max(5),
    accidents: z.enum(["yes", "no"]),
    balance: z.enum(["yes", "no"]),
    firstName: required(80),
    lastName: required(80),
    email,
    phone,
    photoCount: z.coerce.number().int().min(0).max(8).default(0),
    consent,
    locale: localeSchema,
    website: honeypot,
    turnstileToken: turnstile,
  })
  .refine((d) => Boolean(d.vin) || (d.year && d.make && d.model), { message: "required", path: ["make"] });

export const alertSchema = z.object({
  email,
  filters: z.string().max(4000).default("{}"),
  consent,
  locale: localeSchema,
  website: honeypot,
  turnstileToken: turnstile,
});

export const humanSchema = z.object({
  name: required(120),
  email: email.optional().or(z.literal("")),
  phone: phone.optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().default(""),
  chatSessionId: z.string().max(64).optional().default(""),
  consent,
  locale: localeSchema,
  website: honeypot,
  turnstileToken: turnstile,
});

export const bookingSchema = z.object({
  vehicleId: z.string().min(1, "required").max(64),
  startsAt: z.string().datetime({ offset: true }),
  firstName: required(80),
  lastName: required(80),
  email,
  phone,
  preferredLanguage: z.enum(["fr", "en"]),
  preferredContact: z.enum(["email", "phone", "sms"]),
  licence: z.literal(true, { message: "licence" }),
  consent,
  locale: localeSchema,
  website: honeypot,
  turnstileToken: turnstile,
});

export type QuestionInput = z.input<typeof questionSchema>;
export type ContactInput = z.input<typeof contactSchema>;
export type FinancingInput = z.input<typeof financingSchema>;
export type TradeInInput = z.input<typeof tradeInSchema>;
export type AlertInput = z.input<typeof alertSchema>;
export type HumanInput = z.input<typeof humanSchema>;
export type BookingInput = z.input<typeof bookingSchema>;
