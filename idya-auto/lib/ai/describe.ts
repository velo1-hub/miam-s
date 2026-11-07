import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import type { Vehicle } from "@/lib/vehicles/types";
import { recordUsage } from "./budget";
import { aiEnabled, anthropic, MODELS } from "./client";

const schema = z.object({ fr: z.string(), en: z.string() });

/** « Rédiger avec l'IA » — brief §15/§27.5: drafts FR + EN descriptions from the specs only. */
export async function draftDescriptions(v: Partial<Vehicle>): Promise<{ fr: string; en: string } | null> {
  if (!aiEnabled()) return null;
  const { object, usage } = await generateObject({
    model: anthropic()(MODELS.assistant),
    schema,
    providerOptions: { anthropic: { structuredOutputMode: "outputFormat", effort: "low" } },
    system:
      "You write vehicle listing descriptions for a Québec dealership. Québec French first (professional, warm, no hype), then a faithful English version. 60–110 words each. Use only the facts given; never invent equipment, history, warranty or prices. No emojis, no superlatives like « incroyable ». Mention that the price is all-in, taxes extra, only if a price is given.",
    prompt: JSON.stringify({
      year: v.year, make: v.make, model: v.model, trim: v.trim, condition: v.condition, bodyType: v.bodyType, drivetrain: v.drivetrain, transmission: v.transmission, fuelType: v.fuelType, engine: v.engine, horsepower: v.horsepower, odometerKm: v.odometerKm, exteriorColor: v.exteriorColor, interiorColor: v.interiorColor, seats: v.seats, features: v.features, accidentFree: v.accidentFree, ownersCount: v.ownersCount,
    }),
  });
  recordUsage(MODELS.assistant, { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens });
  return object;
}
