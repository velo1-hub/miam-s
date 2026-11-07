import "server-only";
import seed from "@/demo/seed.json";

export interface KnowledgeEntry {
  id: string;
  active: boolean;
  questionFr: string;
  answerFr: string;
  questionEn: string | null;
  answerEn: string | null;
}

export interface KnowledgeRepository {
  list(): Promise<KnowledgeEntry[]>;
  search(query: string, locale: "fr" | "en", limit?: number): Promise<KnowledgeEntry[]>;
  upsert(entry: KnowledgeEntry): Promise<void>;
  remove(id: string): Promise<void>;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Simple lexical scoring — good enough for a dealership FAQ of a few dozen entries. */
export function scoreEntry(e: KnowledgeEntry, query: string, locale: "fr" | "en"): number {
  const text = norm(locale === "fr" ? `${e.questionFr} ${e.answerFr}` : `${e.questionEn ?? e.questionFr} ${e.answerEn ?? e.answerFr}`);
  const terms = norm(query).split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  let score = 0;
  for (const t of terms) if (text.includes(t)) score += t.length > 5 ? 2 : 1;
  return score;
}

let demoEntries: KnowledgeEntry[] = (seed.knowledgeBase as KnowledgeEntry[]).map((e) => ({ ...e }));

export const demoKnowledgeRepository: KnowledgeRepository = {
  async list() {
    return demoEntries;
  },
  async search(query, locale, limit = 3) {
    return demoEntries
      .filter((e) => e.active)
      .map((e) => ({ e, s: scoreEntry(e, query, locale) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => x.e);
  },
  async upsert(entry) {
    demoEntries = [...demoEntries.filter((e) => e.id !== entry.id), entry];
  },
  async remove(id) {
    demoEntries = demoEntries.filter((e) => e.id !== id);
  },
};

export async function getKnowledgeRepository(): Promise<KnowledgeRepository> {
  const demo = process.env.DEMO_MODE !== "false" || !process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (demo) return demoKnowledgeRepository;
  const { supabaseKnowledgeRepository } = await import("./supabase-repository");
  return supabaseKnowledgeRepository;
}
