import { z } from "zod";
export const localeSchema = z.enum(["fr", "en"]);
export const serviceIdSchema = z.enum(["office", "restaurant", "property", "airbnb", "postconstruction", "move"]);
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(30),
});
/** A booking is always the free 20-minute walkthrough; the quote follows in writing. */
export const bookingSchema = contactSchema.extend({
  locale: localeSchema,
  service: serviceIdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot_start: z.string().regex(/^\d{2}:\d{2}$/),
  address: z.string().trim().min(5).max(300),
  company: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(2000).optional(),
  consent: z.literal(true),
});
export const leadSchema = z.object({
  locale: localeSchema,
  type: z.enum(["quote", "contact", "career", "assistant"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().max(3000).optional(),
  service: z.string().max(60).optional(),
  segment: z.string().max(60).optional(),
  source: z.string().max(120).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  consent: z.literal(true),
  website: z.string().optional(), // honeypot: any value means a bot; the route answers ok and drops it
});
