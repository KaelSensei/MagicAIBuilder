import type { ScryfallCard } from "@/lib/scryfall/types";

export interface SuggestionEvidenceInput {
  readonly name: string;
  readonly reason: string;
  readonly category: string;
}

export interface SuggestionEvidenceContext {
  readonly deckColors: readonly string[];
  readonly averageCmc: number;
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

function parsePrice(price: string | null | undefined): number | null {
  if (!price) return null;
  const parsed = Number.parseFloat(price);
  return Number.isFinite(parsed) ? parsed : null;
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

  const deckColors = new Set(context.deckColors);
  const commanderLegality = card.legalities?.commander;

  return {
    role: suggestion.category,
    synergy: suggestion.reason,
    manaValue: card.cmc,
    curveImpact: curveImpact(card.cmc, context.averageCmc),
    colorIdentity: card.color_identity,
    colorCompatible: card.color_identity.every((color) =>
      deckColors.has(color)
    ),
    commanderLegal:
      commanderLegality === undefined ? null : commanderLegality === "legal",
    priceUsd: parsePrice(card.prices?.usd),
    verified: true,
  };
}
