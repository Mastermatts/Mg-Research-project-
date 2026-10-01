import { Document, Packer, Paragraph, TextRun } from "docx";
import type { Correction } from "@/lib/ai/research";

export type AcceptedCorrection = Correction & { status: "pending" | "accepted" | "rejected" };

/**
 * Best-effort find/replace of each accepted correction's excerpt in the
 * source text. Excerpts the model paraphrased slightly (so they don't match
 * verbatim) are skipped rather than corrupting the document — callers
 * should surface `skipped` so the student knows.
 */
export function applyCorrections(
  sourceText: string,
  corrections: AcceptedCorrection[]
): { revisedText: string; appliedCount: number; skipped: string[] } {
  let text = sourceText;
  let appliedCount = 0;
  const skipped: string[] = [];

  for (const c of corrections) {
    if (c.status !== "accepted") continue;
    if (text.includes(c.originalExcerpt)) {
      text = text.replace(c.originalExcerpt, c.suggestedText);
      appliedCount++;
    } else {
      skipped.push(c.originalExcerpt);
    }
  }

  return { revisedText: text, appliedCount, skipped };
}

export async function buildRevisedDocx(text: string, title: string): Promise<Buffer> {
  const paragraphs = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => new Paragraph({ children: [new TextRun(line)], spacing: { after: 200 } }));

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 32 })], spacing: { after: 400 } }),
          ...paragraphs,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
