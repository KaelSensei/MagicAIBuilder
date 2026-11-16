/**
 * The checked facts shown beside an AI suggestion: role, curve, colour fit,
 * Commander legality and price, read from the card's Scryfall data.
 *
 * AI copilot context. The colour fit is the deck's identity rule
 * (`lib/deck/color-identity`): CR 903.5c, and a rulebreaker commander's
 * exceptions (CR 903.5e). Legality is Scryfall's and no exception touches it
 * (CR 113.6n).
 *
 * @module ai/suggestion-evidence
 */
import {
  commanderNameExceptions,
  isOutsideDeckIdentity,
} from "@/lib/deck/color-identity";
import { priceUsdOf } from "@/lib/scryfall/price";
import type { ScryfallCard } from "@/lib/scryfall/types";

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
