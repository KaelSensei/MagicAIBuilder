import type { Archetype } from "@/lib/ai/archetypes";
import type { DeckBrief } from "@/lib/ai/deck-brief";
import type { DeckQuestion } from "@/lib/ai/deck-question";
import type { CopilotClaim } from "@/lib/ai/suggestion-claims";
import type { SuggestionEvidence } from "@/lib/ai/suggestion-evidence";

/** One card the assistant suggests adding. */
export interface CardSuggestion {
  name: string;
  reason: string;
  category: string;
  priority: "high" | "medium" | "low";
  evidence?: SuggestionEvidence;
  /** Checked facts and the model's sentences. Slice 2 renders them. */
  claims?: readonly CopilotClaim[];
  alternatives?: CardAlternative[];
}

/** A substitute offered for a suggested card. */
export interface CardAlternative {
  name: string;
  reason: string;
  dimension: "budget" | "power" | "playstyle";
  evidence?: SuggestionEvidence;
  /** Checked facts and the model's sentence for this alternative. */
  claims?: readonly CopilotClaim[];
}

/** One card the assistant suggests cutting. */
export interface CardRemoval {
  name: string;
  reason: string;
}

/** The accumulated assistant answer for one analysis. */
export interface AISuggestionResult {
  suggestions: CardSuggestion[];
  removals: CardRemoval[];
  analysis: string;
  provider: "anthropic" | "openai" | "mock";
}

/** Optional knobs sent with an analysis request. */
export interface AIAnalysisOptions {
  archetypeOverride?: Archetype | null;
  budgetPerCard?: number | null;
  brief?: DeckBrief;
  question?: DeckQuestion;
}
