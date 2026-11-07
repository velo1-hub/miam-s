import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid, type KnowledgeBaseRow } from "@/lib/supabase/database.types";
import { scoreEntry, type KnowledgeEntry, type KnowledgeRepository } from "./index";

/**
 * Production knowledge base — brief §27.1 (`search_knowledge_base` tool) and §27.5 (admin editing).
 * A dealership FAQ holds a few dozen rows, so search loads the active entries and ranks them with
 * the same lexical scorer as demo mode; no need for a full-text index yet.
 */

const mapEntry = (r: KnowledgeBaseRow): KnowledgeEntry => ({
  id: r.id,
  active: r.active,
  questionFr: r.question_fr,
  answerFr: r.answer_fr,
  questionEn: r.question_en,
  answerEn: r.answer_en,
});

function fail(scope: string, error: { message: string }): never {
  throw new Error(`[knowledge/supabase] ${scope}: ${error.message}`);
}

export const supabaseKnowledgeRepository: KnowledgeRepository = {
  async list() {
    const { data, error } = await createAdminClient().from("knowledge_base").select("*").order("updated_at", { ascending: false });
    if (error) fail("list", error);
    return (data ?? []).map(mapEntry);
  },

  async search(query, locale, limit = 3) {
    const { data, error } = await createAdminClient().from("knowledge_base").select("*").eq("active", true);
    if (error) {
      console.error(`[knowledge/supabase] search: ${error.message}`);
      return [];
    }
    return (data ?? [])
      .map(mapEntry)
      .map((e) => ({ e, s: scoreEntry(e, query, locale) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => x.e);
  },

  async upsert(entry) {
    const db = createAdminClient();
    const values = {
      question_fr: entry.questionFr,
      answer_fr: entry.answerFr,
      question_en: entry.questionEn,
      answer_en: entry.answerEn,
      active: entry.active,
    };
    // Ids minted by the admin UI may not be uuids: those become new rows with a database id.
    const { error } = isUuid(entry.id) ? await db.from("knowledge_base").upsert({ id: entry.id, ...values }, { onConflict: "id" }) : await db.from("knowledge_base").insert(values);
    if (error) fail("upsert", error);
  },

  async remove(id) {
    if (!isUuid(id)) return;
    const { error } = await createAdminClient().from("knowledge_base").delete().eq("id", id);
    if (error) fail("remove", error);
  },
};
