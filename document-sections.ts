export interface SectionDef {
  key: string;
  title: string;
  hint: string;
}

export interface ChapterGroup {
  group: string; // 'chapter_1' .. 'chapter_5'
  chapterNumber: number;
  title: string;
  isRestricted: boolean; // Chapter Four: AI must never invent findings/data here
  sections: SectionDef[];
}

export interface FlatSection extends SectionDef {
  group: string;
  chapterNumber: number | null;
  isRestricted: boolean;
}

export const CHAPTER_GROUPS: ChapterGroup[] = [
  {
    group: "chapter_1",
    chapterNumber: 1,
    title: "Chapter One: Introduction",
    isRestricted: false,
    sections: [
      { key: "ch1_background", title: "1.1 Background of the Study", hint: "Context, relevant statistics, and why this problem matters now." },
      { key: "ch1_problem_statement", title: "1.2 Statement of the Problem", hint: "The specific gap or issue this study addresses, and why it is unresolved." },
      { key: "ch1_general_objective", title: "1.3 General Objective", hint: "The single overall aim of the study, in one sentence." },
      { key: "ch1_specific_objectives", title: "1.4 Specific Objectives", hint: "3–5 measurable objectives that together achieve the general objective." },
      { key: "ch1_research_questions", title: "1.5 Research Questions", hint: "One question per specific objective." },
      { key: "ch1_justification", title: "1.6 Justification / Significance of the Study", hint: "Who benefits from this research and how." },
      { key: "ch1_scope", title: "1.7 Scope of the Study", hint: "What the study covers — population, setting, time frame." },
      { key: "ch1_limitations", title: "1.8 Limitations of the Study", hint: "Known constraints and how they were mitigated." },
      { key: "ch1_definition_of_terms", title: "1.9 Definition of Terms", hint: "Operational definitions of key terms as used in this study." },
    ],
  },
  {
    group: "chapter_2",
    chapterNumber: 2,
    title: "Chapter Two: Literature Review",
    isRestricted: false,
    sections: [
      { key: "ch2_introduction", title: "2.1 Introduction", hint: "A brief orientation to what this chapter covers." },
      { key: "ch2_theoretical_framework", title: "2.2 Theoretical Framework", hint: "The theory/model underpinning the study and why it fits." },
      { key: "ch2_empirical_review", title: "2.3 Empirical Review", hint: "What existing studies have found, organized by your specific objectives." },
      { key: "ch2_conceptual_framework", title: "2.4 Conceptual Framework", hint: "How your variables relate to each other (describe the diagram)." },
      { key: "ch2_summary_gap", title: "2.5 Summary and Research Gap", hint: "What is still unknown or contested — the gap your study fills." },
    ],
  },
  {
    group: "chapter_3",
    chapterNumber: 3,
    title: "Chapter Three: Research Methodology",
    isRestricted: false,
    sections: [
      { key: "ch3_research_design", title: "3.1 Research Design", hint: "The overall design (e.g. descriptive cross-sectional) and why it fits." },
      { key: "ch3_study_area", title: "3.2 Study Area / Site", hint: "Where the study will be/was conducted, and why." },
      { key: "ch3_study_population", title: "3.3 Study Population", hint: "Who the participants are and the inclusion/exclusion criteria." },
      { key: "ch3_sampling", title: "3.4 Sample Size and Sampling Technique", hint: "How the sample size was determined and how participants were selected." },
      { key: "ch3_data_collection_instruments", title: "3.5 Data Collection Instruments", hint: "Tools used (questionnaire, checklist, interview guide) and why." },
      { key: "ch3_data_collection_procedure", title: "3.6 Data Collection Procedure", hint: "Step-by-step process for collecting data." },
      { key: "ch3_data_analysis", title: "3.7 Data Analysis", hint: "How the data will be/was analyzed (methods, software)." },
      { key: "ch3_ethical_considerations", title: "3.8 Ethical Considerations", hint: "Consent, confidentiality, approvals obtained." },
    ],
  },
  {
    group: "chapter_4",
    chapterNumber: 4,
    title: "Chapter Four: Results and Findings",
    isRestricted: true,
    sections: [
      { key: "ch4_introduction", title: "4.1 Introduction", hint: "Brief orientation to this chapter." },
      { key: "ch4_response_rate", title: "4.2 Response Rate", hint: "Your actual response rate — a real figure only you can supply." },
      { key: "ch4_demographics", title: "4.3 Demographic Characteristics", hint: "Your actual participant demographics." },
      { key: "ch4_findings_by_objective", title: "4.4 Presentation of Findings (by Objective)", hint: "Your actual results, organized per specific objective." },
      { key: "ch4_discussion", title: "4.5 Discussion of Findings", hint: "How your real findings relate to the literature in Chapter Two." },
    ],
  },
  {
    group: "chapter_5",
    chapterNumber: 5,
    title: "Chapter Five: Summary, Conclusion and Recommendations",
    isRestricted: false,
    sections: [
      { key: "ch5_summary", title: "5.1 Summary of Findings", hint: "A concise recap of what was found, tied to each objective." },
      { key: "ch5_conclusion", title: "5.2 Conclusion", hint: "What the findings mean, overall." },
      { key: "ch5_recommendations", title: "5.3 Recommendations", hint: "Practical, actionable recommendations arising from the findings." },
      { key: "ch5_further_research", title: "5.4 Areas for Further Research", hint: "What a future study should investigate next." },
    ],
  },
];

export const APPENDICES: SectionDef[] = [
  { key: "appendix_consent", title: "Appendix I: Informed Consent Form", hint: "The consent form given to participants." },
  { key: "appendix_instrument", title: "Appendix II: Data Collection Instrument", hint: "The questionnaire, interview guide, or checklist used." },
  { key: "appendix_workplan", title: "Appendix III: Work Plan / Timeline", hint: "A schedule of study activities and milestones." },
  { key: "appendix_budget", title: "Appendix IV: Budget", hint: "An itemized budget for the study, if required by your programme." },
  { key: "appendix_approvals", title: "Appendix V: Approval Letters", hint: "Institutional/ethics review approvals (e.g. NACOSTI, hospital ethics committee)." },
];

/**
 * Flattens preliminary pages + all chapter sections + appendices into one
 * ordered list, tagging each with its group, chapter number, and whether
 * AI assistance on it is restricted (Chapter Four only — never invent data).
 * `includedKeys`, when provided (from an active template version), limits
 * the result to that template's configured sections; omit to get every
 * default section.
 */
export function buildDocumentSections(
  preliminary: SectionDef[],
  includedKeys?: string[] | null
): FlatSection[] {
  const flat: FlatSection[] = [];

  for (const p of preliminary) {
    flat.push({ ...p, group: "preliminary", chapterNumber: null, isRestricted: false });
  }

  for (const chapter of CHAPTER_GROUPS) {
    for (const section of chapter.sections) {
      flat.push({
        ...section,
        group: chapter.group,
        chapterNumber: chapter.chapterNumber,
        isRestricted: chapter.isRestricted,
      });
    }
  }

  for (const a of APPENDICES) {
    flat.push({ ...a, group: "appendices", chapterNumber: null, isRestricted: false });
  }

  if (!includedKeys || includedKeys.length === 0) return flat;
  const allowed = new Set(includedKeys);
  return flat.filter((s) => allowed.has(s.key));
}

export function sectionGroupLabel(group: string): string {
  if (group === "preliminary") return "Preliminary Pages";
  if (group === "appendices") return "Appendices";
  const chapter = CHAPTER_GROUPS.find((c) => c.group === group);
  return chapter?.title ?? group;
}
