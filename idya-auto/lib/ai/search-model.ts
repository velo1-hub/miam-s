import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { BODY_TYPES, CONDITIONS, DRIVETRAINS, FEATURE_KEYS, FUEL_TYPES, TRANSMISSIONS } from "@/lib/vehicles/types";
import { recordUsage } from "./budget";
import { anthropic, MODELS } from "./client";
import type { ParsedSearch } from "./search-parse";

/** Structured-output schema mapped onto the exact inventory filter set (brief §27.2). */
export const searchFiltersSchema = z.object({
  make: z.array(z.string()).optional().describe("Only makes present in the inventory list given"),
  model: z.array(z.string()).optional(),
  condition: z.array(z.enum(CONDITIONS)).optional(),
  bodyType: z.array(z.enum(BODY_TYPES)).optional(),
  fuel: z.array(z.enum(FUEL_TYPES)).optional(),
  drivetrain: z.array(z.enum(DRIVETRAINS)).optional(),
  transmission: z.array(z.enum(TRANSMISSIONS)).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  kmMax: z.number().optional(),
  yearMin: z.number().optional(),
  yearMax: z.number().optional(),
  seatsMin: z.number().optional(),
  color: z.array(z.string()).optional(),
  features: z.array(z.enum(FEATURE_KEYS)).optional(),
  residual: z.string().describe("Terms that could not be mapped to a filter, or empty string"),
});

const cache = new Map<string, { at: number; value: ParsedSearch }>();
const TTL = 24 * 3_600_000;

/**
 * claude-haiku-5-5 with a Zod schema (output_config format, no forced tool choice). Unknown terms
 * go to `residual`, never invented. Identical queries are cached 24 h in memory (Supabase table in production).
 */
export async function parseSearchWithModel(query: string, known: { makes: string[]; models: string[] }): Promise<ParsedSearch | null> {
  const key = query.trim().toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  const { object, usage } = await generateObject({
    model: anthropic()(MODELS.fast),
    schema: searchFiltersSchema,
    providerOptions: { anthropic: { structuredOutputMode: "outputFormat", effort: "low" } },
    system: `You map a car shopper's sentence (Québec French or English, including expressions like « char », « pick-up », « 4 roues motrices », « sous 35 000 $ », « moins de 80 000 km ») onto inventory filters. Prices are in CAD; "35k" means 35000. Only use makes from this list: ${known.makes.join(", ")}. Only use models from this list: ${known.models.join(", ")}. Never invent a filter the sentence does not state; put unmapped words in residual.`,
    prompt: query.slice(0, 300),
  });
  recordUsage(MODELS.fast, { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens });
  const { residual, ...filters } = object;
  const clean = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0)));
  const value: ParsedSearch = { filters: clean, residual: residual ?? "", source: "model" };
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 5000) cache.clear();
  return value;
}
