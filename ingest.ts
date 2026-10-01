import type { SupabaseClient } from "@supabase/supabase-js";
import { openai, EMBEDDING_MODEL } from "./openai";

const EMBED_BATCH_SIZE = 20;

/**
 * Splits cleaned text into overlapping chunks sized for embedding + tutor
 * context windows. Overlap keeps sentences that straddle a chunk boundary
 * from losing meaning.
 */
export function chunkText(text: string, maxChars = 1200, overlap = 150): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + maxChars, clean.length);
    chunks.push(clean.slice(start, end));
    if (end === clean.length) break;
    start += maxChars - overlap;
  }
  return chunks.filter((c) => c.trim().length > 40);
}

/**
 * Downloads a PDF from the `resources` storage bucket, extracts its text,
 * chunks it, embeds each chunk, and (re)writes them to resource_chunks.
 * Safe to call again for the same resource — old chunks are replaced.
 */
export async function ingestResource(
  supabase: SupabaseClient,
  resourceId: string,
  storagePath: string
): Promise<{ chunkCount: number }> {
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("resources")
    .download(storagePath);

  if (downloadError || !fileData) {
    throw new Error(downloadError?.message || "Could not download file for ingestion");
  }

  // pdf-parse ships as CommonJS; dynamic import keeps it out of the client bundle.
  const pdfParse = (await import("pdf-parse")).default;
  const buffer = Buffer.from(await fileData.arrayBuffer());
  const parsed = await pdfParse(buffer);
  const chunks = chunkText(parsed.text);

  await supabase.from("resource_chunks").delete().eq("resource_id", resourceId);

  if (chunks.length === 0) {
    return { chunkCount: 0 };
  }

  let inserted = 0;
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const embeddingRes = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: batch });

    const rows = batch.map((content, idx) => ({
      resource_id: resourceId,
      chunk_index: i + idx,
      content,
      embedding: embeddingRes.data[idx].embedding,
    }));

    const { error } = await supabase.from("resource_chunks").insert(rows);
    if (error) throw new Error(error.message);
    inserted += rows.length;
  }

  return { chunkCount: inserted };
}
