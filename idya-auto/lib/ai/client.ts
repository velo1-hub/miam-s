import "server-only";
import { createAnthropic } from "@ai-sdk/anthropic";

/**
 * Model client — brief §2: Anthropic through the Vercel AI SDK. Default `claude-sonnet-5-5` for the
 * assistant, `claude-haiku-5-5` for fast high-volume tasks (search parsing, lead scoring).
 */
export const MODELS = {
  assistant: "claude-sonnet-5-5",
  fast: "claude-haiku-5-5",
} as const;

/** USD per million tokens (input, output, cache read) — used by the daily budget cap. */
export const PRICING: Record<string, { input: number; output: number; cacheRead: number }> = {
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01 },
};

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let provider: ReturnType<typeof createAnthropic> | null = null;
export function anthropic() {
  if (!provider) provider = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return provider;
}
