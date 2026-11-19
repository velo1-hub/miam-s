import { z } from "zod";
export const localeSchema = z.enum(["fr", "en"]);
export const serviceIdSchema = z.enum(["residential", "deep", "move", "postconstruction", "airbnb", "office", "restaurant", "property"]);
export const quoteInputSchema = z.object({
  service: serviceIdSchema,
  homeType: z.enum(["studio", "3half", "4half", "5half", "house"]).optional(),
  bedrooms: z.number().int().min(0).max(12).optional(),
  bathrooms: z.number().int().min(1).max(8).optional(),
  floors: z.number().int().min(1).max(4).optional(),
  sqft: z.number().int().min(100).max(200000).optional(),
  frequency: z.enum(["once", "weekly", "biweekly", "monthly"]).optional(),
  visitsPerWeek: z.number().int().min(1).max(7).optional(),
  addons: z.array(z.enum(["oven", "fridge", "windows", "pets", "laundry", "linens", "carpet", "balcony"])).optional(),
  windows: z.number().int().min(1).max(60).optional(),
  zone: z.string().optional(),
});
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(30),
});
export const bookingSchema = contactSchema.extend({
  locale: localeSchema,
  kind: z.enum(["cleaning", "walkthrough"]),
  service: serviceIdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot_start: z.string().regex(/^\d{2}:\d{2}$/),
  address: z.string().trim().min(5).max(300),
  notes: z.string().trim().max(2000).optional(),
  quote: quoteInputSchema.optional(),
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
  quote: quoteInputSchema.optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  consent: z.literal(true),
  website: z.string().optional(), // honeypot: any value means a bot; the route answers ok and drops it
});
