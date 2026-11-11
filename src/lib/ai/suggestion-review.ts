/*
 * Review of an AI proposal before it touches the deck: legality status,
 * priority filter, selection toggles, and the net diff to apply.
 */
import type { CardRemoval, CardSuggestion } from "@/hooks/useAISuggestions";
import { normalizeImportedName } from "@/lib/scryfall/name-index";
import type { SuggestionEvidence } from "./suggestion-evidence";

export type SuggestionPriorityFilter = CardSuggestion["priority"] | "all";

export interface SuggestionDiff {
  readonly additions: readonly string[];
  readonly removals: readonly string[];
}

export type LegalityFailure = "colorIdentity" | "commanderLegality";
export type SuggestionLegality =
  | { readonly status: "valid"; readonly reasons: readonly [] }
  | { readonly status: "unverified"; readonly reasons: readonly [] }
  | {
      readonly status: "blocked";
      readonly reasons: readonly LegalityFailure[];
    };

/** Separates deterministic legality failures from optional strategic advice. */
export function getSuggestionLegality(
  evidence: SuggestionEvidence | undefined
): SuggestionLegality {
  if (!evidence?.verified) return { status: "unverified", reasons: [] };
  const reasons: LegalityFailure[] = [];
  if (evidence.colorCompatible === false) reasons.push("colorIdentity");
  if (evidence.commanderLegal === false) reasons.push("commanderLegality");
  return reasons.length > 0
    ? { status: "blocked", reasons }
    : { status: "valid", reasons: [] };
}

export function toggleSuggestionSelection(
  current: ReadonlySet<string>,
  cardName: string
): Set<string> {
  const next = new Set(current);
  if (next.has(cardName)) next.delete(cardName);
  else next.add(cardName);
  return next;
}

/**
 * Filters AI suggestions without changing the result order.
 * @param suggestions Suggestions returned by the copilot.
 * @param priority Requested priority or all priorities.
 * @returns Suggestions matching the requested priority.
 */
export function filterSuggestionsByPriority(
  suggestions: readonly CardSuggestion[],
  priority: SuggestionPriorityFilter
): readonly CardSuggestion[] {
  if (priority === "all") return suggestions;
  return suggestions.filter((suggestion) => suggestion.priority === priority);
}

/**
 * Computes the net card changes that a reviewed AI proposal would make.
 *
 * Names are compared by their Scryfall lookup key (typographic apostrophes
 * made straight, case and spacing ignored), because the model may echo a deck
 * card as "Urza’s Saga" or "urza's saga". A removal is reported under the
 * deck's own spelling, since the builder removes a card by its exact name.
 *
 * @param currentCardNames Card names currently in the deck.
 * @param selectedAdditions Names selected for addition.
 * @param selectedRemovals AI-proposed removals.
 * @returns Additions missing from the deck, and removals present in it named
 *   as the deck names them.
 */
export function buildSuggestionDiff(
  currentCardNames: readonly string[],
  selectedAdditions: readonly string[],
  selectedRemovals: readonly CardRemoval[]
): SuggestionDiff {
  const deckNameByKey = new Map(
    currentCardNames.map((name) => [normalizeImportedName(name), name])
  );
  const additions = [...new Set(selectedAdditions)].filter(
    (name) => !deckNameByKey.has(normalizeImportedName(name))
  );
  const removals = [
    ...new Set(
      selectedRemovals.flatMap((removal) => {
        const deckName = deckNameByKey.get(normalizeImportedName(removal.name));
        return deckName === undefined ? [] : [deckName];
      })
    ),
  ];
  return { additions, removals };
}
