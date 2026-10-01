import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  // Don't throw at import time in dev without keys configured yet — routes
  // that use this will fail loudly and clearly when actually called.
  console.warn("[ai] OPENAI_API_KEY is not set — AI Tutor requests will fail.");
}

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
export const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
