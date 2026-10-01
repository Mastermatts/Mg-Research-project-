import { openai, CHAT_MODEL } from "./openai";

async function jsonCompletion(system: string, user: string, temperature = 0.5) {
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("The AI returned an unexpected response. Please try again.");
  }
}

// ---------------------------------------------------------------------------
// PATH A — Research Topic Generator
// ---------------------------------------------------------------------------
export type TopicSuggestion = {
  title: string;
  researchArea: string;
  targetPopulation: string;
  studySetting: string;
  briefExplanation: string;
  feasibilityConsiderations: string;
};

const TOPIC_GENERATOR_SYSTEM = `You are a research topic advisor for Kenya Medical Training College (KMTC)
students. KMTC trains students across MANY programmes, not just Medical
Engineering — Nursing, Clinical Medicine, Public Health, Nutrition, Health
Records, Community Health, Midwifery, and more. Tailor every suggestion
tightly to the specific programme given; do not default to generic medical
engineering topics unless that IS the programme.

Generate realistic, feasible undergraduate/diploma-level research topics —
scoped for a student researcher (not a multi-year clinical trial). Each
topic must be answerable with methods a KMTC student can realistically run
(surveys, chart reviews, observational studies, facility assessments) in a
typical academic timeframe.

Respond ONLY with JSON: { "topics": [ { "title": string, "researchArea":
string, "targetPopulation": string, "studySetting": string,
"briefExplanation": string (2-3 sentences), "feasibilityConsiderations":
string (1-2 sentences, be honest about constraints) } ] }`;

export async function generateTopics(params: {
  programme: string;
  researchArea: string;
  preferences: string[];
  count?: number;
}): Promise<TopicSuggestion[]> {
  const user = `Programme: ${params.programme}
Research area of interest: ${params.researchArea}
Optional preferences the student selected: ${params.preferences.length ? params.preferences.join(", ") : "none specified"}

Generate ${params.count ?? 5} distinct topic suggestions.`;

  const data = await jsonCompletion(TOPIC_GENERATOR_SYSTEM, user, 0.7);
  return Array.isArray(data.topics) ? data.topics : [];
}

export async function refineTopic(params: {
  topic: TopicSuggestion;
  instruction: string;
}): Promise<TopicSuggestion> {
  const system = `You refine a single KMTC research topic based on the student's feedback.
Keep the same JSON shape. Make only the changes the student asked for —
don't rewrite parts they didn't ask you to touch. Respond ONLY with JSON:
{ "topic": { "title": string, "researchArea": string, "targetPopulation":
string, "studySetting": string, "briefExplanation": string,
"feasibilityConsiderations": string } }`;

  const user = `Current topic:\n${JSON.stringify(params.topic, null, 2)}\n\nStudent's requested change:\n${params.instruction}`;

  const data = await jsonCompletion(system, user, 0.5);
  return data.topic as TopicSuggestion;
}

// ---------------------------------------------------------------------------
// PATH B — Existing Topic Review
// ---------------------------------------------------------------------------
export type TopicReviewCriterion = { comment: string; concern: boolean };

export type TopicReview = {
  grammar: TopicReviewCriterion;
  clarity: TopicReviewCriterion;
  specificity: TopicReviewCriterion;
  scope: TopicReviewCriterion;
  researchability: TopicReviewCriterion;
  targetPopulation: TopicReviewCriterion;
  variables: TopicReviewCriterion;
  studySetting: TopicReviewCriterion;
  feasibility: TopicReviewCriterion;
  overallSummary: string;
  suggestedRewrite: string | null; // null if the original is already solid
};

const TOPIC_REVIEW_SYSTEM = `You are a research topic reviewer for KMTC students. Examine the student's
topic exactly as given across these criteria: grammar, clarity,
specificity, scope, researchability, target population, variables, study
setting, feasibility. For each, give one short comment and mark "concern":
true only if it's a real problem worth fixing.

Never rewrite or silently improve the student's topic. If, taken together,
the concerns suggest a clearer phrasing, offer ONE optional
"suggestedRewrite" — but make clear it's a suggestion, not a replacement;
if the topic is already solid, set suggestedRewrite to null.

Respond ONLY with JSON matching this shape: { "grammar": {"comment":
string, "concern": boolean}, "clarity": {...}, "specificity": {...},
"scope": {...}, "researchability": {...}, "targetPopulation": {...},
"variables": {...}, "studySetting": {...}, "feasibility": {...},
"overallSummary": string, "suggestedRewrite": string | null }`;

export async function reviewTopic(topicText: string): Promise<TopicReview> {
  const data = await jsonCompletion(TOPIC_REVIEW_SYSTEM, `Student's topic:\n"${topicText}"`, 0.3);
  return data as TopicReview;
}

// ---------------------------------------------------------------------------
// PATH C — Document correction analysis
// ---------------------------------------------------------------------------
export type CorrectionCategory =
  | "grammar"
  | "clarity"
  | "structure"
  | "citations"
  | "ai_hallucination"
  | "formatting";

export type Correction = {
  id: string;
  category: CorrectionCategory;
  originalExcerpt: string;
  suggestedText: string;
  reason: string;
};

const DOCUMENT_ANALYSIS_SYSTEM = `You are a meticulous academic editor reviewing a KMTC student's research
document. Read the text and propose specific, localized corrections. Each
correction must quote a short EXACT excerpt from the source text
("originalExcerpt", under 40 words) and a "suggestedText" replacement,
plus a one-sentence "reason".

Categorize each correction as exactly one of: "grammar", "clarity",
"structure", "citations", "ai_hallucination", "formatting".

Pay special attention to "ai_hallucination": flag any statistic, citation,
study finding, or specific fact stated with confidence that is NOT
verifiable from the document itself and reads like it could be a
fabricated/unsupported claim (common in AI-assisted drafts) — e.g. an
oddly-precise percentage with no source, a named study that can't be
checked, a citation that looks invented. Flag it even if you're not certain
it's wrong — the student will make the final call.

Only propose corrections for real issues. Don't invent problems to pad the
list. Cap it at 25 corrections, prioritizing the clearest and most
important ones.

Respond ONLY with JSON: { "corrections": [ { "category": string,
"originalExcerpt": string, "suggestedText": string, "reason": string } ],
"summary": string (2-3 sentence overview of the document's main issues) }`;

export async function analyzeDocument(params: {
  text: string;
  focusCategories?: CorrectionCategory[];
}): Promise<{ corrections: Correction[]; summary: string }> {
  const truncated = params.text.slice(0, 24000); // keep prompt+context within budget
  const focus = params.focusCategories?.length
    ? `\n\nFocus especially on these categories: ${params.focusCategories.join(", ")}.`
    : "";

  const data = await jsonCompletion(
    DOCUMENT_ANALYSIS_SYSTEM,
    `Document text:\n"""\n${truncated}\n"""${focus}`,
    0.3
  );

  const corrections: Correction[] = (Array.isArray(data.corrections) ? data.corrections : []).map(
    (c: Omit<Correction, "id">, i: number) => ({
      id: `c${i}`,
      category: c.category,
      originalExcerpt: c.originalExcerpt,
      suggestedText: c.suggestedText,
      reason: c.reason,
    })
  );

  return { corrections, summary: data.summary ?? "" };
}
