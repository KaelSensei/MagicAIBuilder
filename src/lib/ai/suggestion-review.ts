import type { CardRemoval, CardSuggestion } from "@/hooks/useAISuggestions";

export type SuggestionPriorityFilter = CardSuggestion["priority"] | "all";

export interface SuggestionDiff {
  readonly additions: readonly string[];
  readonly removals: readonly string[];
}

/**
 * Filters AI suggestions without changing the result order.
 * @param suggestions Suggestions returned by the copilot.
 * @param priority Requested priority or all priorities.
 * @returns Suggestions matching the requested priority.
 */
export function filterSuggestionsByPriority(
  suggestions: readonly CardSuggestion[],
  priority: SuggestionPriorityFilter,
): readonly CardSuggestion[] {
  if (priority === "all") return suggestions;
  return suggestions.filter((suggestion) => suggestion.priority === priority);
}

/**
 * Computes the net card changes that a reviewed AI proposal would make.
 * @param currentCardNames Card names currently in the deck.
 * @param selectedAdditions Names selected for addition.
 * @param selectedRemovals AI-proposed removals.
 * @returns Additions missing from the deck and removals present in it.
 */
export function buildSuggestionDiff(
  currentCardNames: readonly string[],
  selectedAdditions: readonly string[],
  selectedRemovals: readonly CardRemoval[],
): SuggestionDiff {
  const currentCards = new Set(currentCardNames);
  const additions = selectedAdditions.filter((name) => !currentCards.has(name));
  const removals = selectedRemovals
    .map((removal) => removal.name)
    .filter((name) => currentCards.has(name));
  return { additions, removals };
}
