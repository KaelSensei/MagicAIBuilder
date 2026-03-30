/**
 * Smart Recommendations Engine — Cross-deck analysis and suggestions
 * Pure functions, zero framework dependencies.
 */

import type { Deck } from "@/lib/deck/types";

// ─── Types ────────────────────────────────────────────────────────────────
export interface MetaCard {
  readonly scryfallId: string;
  readonly name: string;
  readonly metaPercentage: number; // 0–100
}

export interface CrossDeckRecommendation extends MetaCard {
  readonly missingFromDecks: readonly string[]; // deck IDs
}

export interface BudgetSavingsRecommendation {
  readonly cardName: string;
  readonly scryfallId: string;
  readonly currentPrice: number;
  readonly deckCount: number;
  readonly totalSavingsPotential: number; // estimate
}

export interface ScatteredSynergy {
  readonly pattern: string; // e.g., "Equipment", "Tutor", "Removal"
  readonly deckCount: number;
  readonly cardCount: number;
  readonly deckIds: readonly string[];
}

// ─── Missing meta cards ───────────────────────────────────────────────────
/**
 * Find cards that appear in meta but are missing from user's decks.
 * Returns sorted by meta percentage (highest first).
 */
export function findMissingMetaCards(
  decks: readonly Deck[],
  metaCards: readonly MetaCard[]
): CrossDeckRecommendation[] {
  // Build set of all scryfallIds across all user decks
  const userCardIds = new Set<string>();
  for (const deck of decks) {
    for (const card of deck.cards) {
      userCardIds.add(card.scryfallId ?? card.id);
    }
  }

  // Find meta cards not in user decks
  const missing: CrossDeckRecommendation[] = [];

  for (const meta of metaCards) {
    if (!userCardIds.has(meta.scryfallId)) {
      // Find which decks would benefit (all decks by default)
      missing.push({
        ...meta,
        missingFromDecks: decks.map((d) => d.id),
      });
    }
  }

  // Sort by meta percentage descending
  return missing.sort((a, b) => b.metaPercentage - a.metaPercentage);
}

// ─── Cross-deck budget savings ────────────────────────────────────────────
/**
 * Find expensive cards appearing in multiple decks.
 * These are prime candidates for budget optimization across the collection.
 */
export function findCrossDeckBudgetSavings(
  decks: readonly Deck[],
  priceThreshold = 10
): BudgetSavingsRecommendation[] {
  // Count how many decks each expensive card appears in
  const cardDeckCount: Map<string, { name: string; price: number; count: number }> = new Map();

  for (const deck of decks) {
    const seenInDeck = new Set<string>();

    for (const card of deck.cards) {
      if ((card.price ?? 0) < priceThreshold) continue;

      const key = card.scryfallId ?? card.id;
      if (seenInDeck.has(key)) continue;
      seenInDeck.add(key);

      const existing = cardDeckCount.get(key);
      if (existing) {
        cardDeckCount.set(key, { ...existing, count: existing.count + 1 });
      } else {
        cardDeckCount.set(key, { name: card.name, price: card.price ?? 0, count: 1 });
      }
    }
  }

  // Build recommendations for cards in 2+ decks
  const recommendations: BudgetSavingsRecommendation[] = [];

  for (const [scryfallId, data] of cardDeckCount.entries()) {
    if (data.count < 2) continue;

    // Estimate savings: replace with 30% of current price
    const savingsPerDeck = data.price * 0.7;
    const totalSavings = savingsPerDeck * data.count;

    recommendations.push({
      cardName: data.name,
      scryfallId,
      currentPrice: data.price,
      deckCount: data.count,
      totalSavingsPotential: Math.round(totalSavings * 100) / 100,
    });
  }

  // Sort by total savings potential descending
  return recommendations.sort((a, b) => b.totalSavingsPotential - a.totalSavingsPotential);
}

// ─── Scattered synergy detection ──────────────────────────────────────────
const SYNERGY_PATTERNS: Record<string, string[]> = {
  Equipment: ["equipment"],
  Tutor: ["tutor", "search your library"],
  Removal: ["destroy", "exile target"],
  "Card Draw": ["draw a card", "draw cards"],
  Ramp: ["add {", "land onto the battlefield"],
  Counterspell: ["counter target spell", "counter that spell"],
};

/**
 * Detect cards with similar synergy patterns scattered across decks.
 * Useful for identifying cards that could consolidate strategies.
 */
export function detectScatteredSynergies(
  decks: readonly Deck[]
): ScatteredSynergy[] {
  const synergies: ScatteredSynergy[] = [];

  for (const [pattern, keywords] of Object.entries(SYNERGY_PATTERNS)) {
    const deckIds: string[] = [];
    let totalCards = 0;

    for (const deck of decks) {
      const matching = deck.cards.filter((card) => {
        const text = (card.typeLine + " " + card.oracleText).toLowerCase();
        return keywords.some((kw) => text.includes(kw));
      });

      if (matching.length > 0) {
        deckIds.push(deck.id);
        totalCards += matching.length;
      }
    }

    if (deckIds.length >= 2) {
      synergies.push({
        pattern,
        deckCount: deckIds.length,
        cardCount: totalCards,
        deckIds,
      });
    }
  }

  return synergies.sort((a, b) => b.deckCount - a.deckCount);
}

// ─── Group by commander ────────────────────────────────────────────────────
/**
 * Group decks by commander name for per-commander analysis.
 */
export function groupCardsByCommander(
  decks: readonly Deck[]
): Record<string, Deck[]> {
  const grouped: Record<string, Deck[]> = {};

  for (const deck of decks) {
    const name = deck.commander?.name ?? "Unknown";
    if (!grouped[name]) {
      grouped[name] = [];
    }
    grouped[name].push(deck);
  }

  return grouped;
}
