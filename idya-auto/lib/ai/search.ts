import "server-only";
import { vehicles } from "@/lib/vehicles";
import { parseSearchWithRules, type ParsedSearch } from "./search-parse";

async function knownMakesModels() {
  const res = await vehicles.list({}, "newest", 1, 500);
  return { makes: [...new Set(res.items.map((v) => v.make))], models: [...new Set(res.items.map((v) => v.model))] };
}

/**
 * Natural-language search — brief §27.2. The model refines the rule-based parse when an API key is
 * configured, with a 1.5 s timeout and keyword fallback; identical queries are cached 24 h.
 */
export async function parseSearch(query: string): Promise<ParsedSearch> {
  const known = await knownMakesModels();
  const base = parseSearchWithRules(query, known);
  if (!process.env.ANTHROPIC_API_KEY) return base;
  try {
    const { parseSearchWithModel } = await import("./search-model");
    const refined = await Promise.race([
      parseSearchWithModel(query, known),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);
    return refined ?? base;
  } catch {
    return base;
  }
}
