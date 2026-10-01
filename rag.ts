import type { SupabaseClient } from "@supabase/supabase-js";
import { openai, EMBEDDING_MODEL } from "./openai";

export type RetrievedChunk = {
  chunk_id: string;
  resource_id: string;
  resource_title: string;
  subject_name: string;
  content: string;
  similarity: number;
};

/**
 * Embeds the student's question and searches the library for relevant
 * chunks. Returns an empty array (never throws) if embeddings fail or the
 * library has no ingested content yet — the tutor just falls back to
 * general knowledge in that case.
 */
export async function retrieveLibraryContext(
  supabase: SupabaseClient,
  query: string,
  matchCount = 5
): Promise<RetrievedChunk[]> {
  try {
    const embeddingRes = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });
    const embedding = embeddingRes.data[0]?.embedding;
    if (!embedding) return [];

    const { data, error } = await supabase.rpc("match_resource_chunks", {
      query_embedding: embedding,
      match_count: matchCount,
      match_threshold: 0.72,
    });

    if (error) {
      console.error("[ai/rag] match_resource_chunks error:", error.message);
      return [];
    }

    return (data ?? []) as RetrievedChunk[];
  } catch (err) {
    console.error("[ai/rag] retrieval failed:", err);
    return [];
  }
}
