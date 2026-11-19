/**
 * The checked facts shown beside an AI suggestion: role, curve, colour fit,
 * Commander legality and price, read from the card's Scryfall data.
 *
 * AI copilot context. Pure: the suggest route fetches the cards named by
 * `suggestionLookupNames` and hands them to `attachSuggestionEvidence`; no
 * network or database call happens here. The colour fit is the deck's
 * identity rule (`lib/deck/color-identity`): CR 903.5c, and a rulebreaker
 * commander's exceptions (CR 903.5e). Legality is Scryfall's and no exception
 * touches it (CR 113.6n).
 *
 * @module ai/suggestion-evidence
 */
import {
  commanderNameExceptions,
  isOutsideDeckIdentity,
} from "@/lib/deck/color-identity";
import { priceUsdOf } from "@/lib/scryfall/price";
import type { ScryfallCard } from "@/lib/scryfall/types";

/** What evidence needs from a suggestion: the model's card name, rationale and role. */
export interface SuggestionEvidenceInput {
  readonly name: string;
  readonly reason: string;
  readonly category: string;
}

/** The deck a suggestion is checked against. */
export interface SuggestionEvidenceContext {
  readonly deckColors: readonly string[];
  readonly averageCmc: number;
  /** The commander's and partner's names, for a rulebreaker's exceptions (CR 903.5e) */
  readonly commandZoneNames?: readonly string[];
}

/**
 * The facts streamed beside one suggestion. `null` means the fact is unknown
 * (no card, or Scryfall gave no value), never "false". `verified` is true only
 * when the card was found.
 */
export interface SuggestionEvidence {
  readonly role: string;
  readonly synergy: string;
  readonly manaValue: number | null;
  readonly curveImpact: string;
  readonly colorIdentity: readonly string[];
  readonly colorCompatible: boolean | null;
  readonly commanderLegal: boolean | null;
  readonly priceUsd: number | null;
  readonly verified: boolean;
}

function curveImpact(manaValue: number, averageCmc: number): string {
  if (manaValue < averageCmc - 0.25) {
    return `Below the deck average (${averageCmc.toFixed(2)})`;
  }
  if (manaValue > averageCmc + 0.25) {
    return `Above the deck average (${averageCmc.toFixed(2)})`;
  }
  return `Near the deck average (${averageCmc.toFixed(2)})`;
}

/**
 * The evidence for one suggested card.
 *
 * Without a card, it keeps the model's role and rationale and marks every
 * checked fact unknown and the evidence unverified. The curve is "near" the
 * deck average within a quarter of a mana either way.
 *
 * @param card - the card's Scryfall data; `undefined` when the lookup did not find it
 */
export function buildSuggestionEvidence(
  suggestion: SuggestionEvidenceInput,
  card: ScryfallCard | undefined,
  context: SuggestionEvidenceContext
): SuggestionEvidence {
  if (!card) {
    return {
      role: suggestion.category,
      synergy: suggestion.reason,
      manaValue: null,
      curveImpact: "Mana value unavailable",
      colorIdentity: [],
      colorCompatible: null,
      commanderLegal: null,
      priceUsd: null,
      verified: false,
    };
  }

  const identityRule = {
    colors: new Set(context.deckColors),
    exceptions: commanderNameExceptions(context.commandZoneNames ?? []),
  };
  const commanderLegality = card.legalities?.commander;

  return {
    role: suggestion.category,
    synergy: suggestion.reason,
    manaValue: card.cmc,
    curveImpact: curveImpact(card.cmc, context.averageCmc),
    colorIdentity: card.color_identity,
    colorCompatible: !isOutsideDeckIdentity(identityRule, {
      colorIdentity: card.color_identity,
      typeLine: card.type_line,
      cmc: card.cmc,
    }),
    commanderLegal:
      commanderLegality === undefined ? null : commanderLegality === "legal",
    priceUsd: priceUsdOf(card),
    verified: true,
  };
}

/** What the card lookup needs from a suggestion: its name and its alternatives' names. */
export interface SuggestionLookupSubject {
  readonly name: string;
  readonly alternatives?: readonly { readonly name: string }[];
}

/**
 * The card names to look up for a set of suggestions: each suggestion, then
 * its alternatives, once per exact name, in the order the model gave them.
 *
 * Names are deduplicated as written, not case-folded, so the request sent to
 * Scryfall is unchanged from the one the route built before this extraction.
 * An empty list means there is nothing to look up.
 */
export function suggestionLookupNames(
  suggestions: readonly SuggestionLookupSubject[]
): string[] {
  const names = suggestions.flatMap((suggestion) => [
    suggestion.name,
    ...(suggestion.alternatives ?? []).map(({ name }) => name),
  ]);
  return [...new Set(names)];
}

/** An alternative card before its evidence is attached. */
export interface EvidenceAlternativeInput {
  readonly name: string;
  readonly reason: string;
}

/** A value with the evidence `buildSuggestionEvidence` produced for it. */
export type WithEvidence<T> = T & { readonly evidence: SuggestionEvidence };

/** A suggestion, and each of its alternatives, with their evidence attached. */
export type EvidencedSuggestion<S, A> = Omit<S, "alternatives" | "evidence"> & {
  readonly evidence: SuggestionEvidence;
  readonly alternatives?: WithEvidence<A>[];
};

/**
 * Attaches evidence to every suggestion and to each of its alternatives.
 *
 * A card is matched by its name without regard to letter case, because the
 * model's spelling of a name and Scryfall's need not agree on capitals. When
 * two cards share a lower-cased name, the last one wins. A suggestion whose
 * card is missing from `cards` (a failed or partial lookup) gets unverified
 * evidence instead of being dropped. An alternative is judged in its parent
 * suggestion's role, since the model gives it no category of its own. Every
 * other field of the suggestion and its alternatives is kept as it was.
 *
 * @param cards - the Scryfall cards found for `suggestionLookupNames`; empty when the lookup failed
 */
export function attachSuggestionEvidence<
  S extends SuggestionEvidenceInput,
  A extends EvidenceAlternativeInput,
>(
  suggestions: readonly (S & { readonly alternatives?: readonly A[] })[],
  cards: readonly ScryfallCard[],
  context: SuggestionEvidenceContext
): EvidencedSuggestion<S, A>[] {
  const cardsByName = new Map(
    cards.map((card) => [card.name.toLowerCase(), card])
  );
  const cardNamed = (name: string) => cardsByName.get(name.toLowerCase());

  return suggestions.map((suggestion) => ({
    ...suggestion,
    evidence: buildSuggestionEvidence(
      suggestion,
      cardNamed(suggestion.name),
      context
    ),
    alternatives: suggestion.alternatives?.map((alternative) => ({
      ...alternative,
      evidence: buildSuggestionEvidence(
        { ...alternative, category: suggestion.category },
        cardNamed(alternative.name),
        context
      ),
    })),
  }));
}
