/**
 * Deck Analytics — Aggregated statistics across all user decks
 * Pure functions for dashboard statistics and distribution analysis
 */

import type { Deck } from "@/lib/deck/types";

// ─── Constants ────────────────────────────────────────────────────────────
export const BUDGET_TIERS = {
  BUDGET_MAX: 100,   // Budget: < €100
  MID_MAX: 300,      // Mid-range: €100–€300
  OPTIMIZED_MAX: 600, // Optimized: €300–€600
  // cEDH: > €600
} as const;

// ─── Types ────────────────────────────────────────────────────────────────
export interface DashboardStats {
  readonly totalDecks: number;
  readonly totalValue: number;
  readonly averageDeckCost: number;
  readonly favoriteArchetype: string | null;
  readonly decksWithUnknownPrices: number;
}

// ─── Aggregate deck stats ──────────────────────────────────────────────────
/**
 * Calculate aggregated statistics across all user decks.
 */
export function aggregateDeckStats(decks: readonly Deck[]): DashboardStats {
  if (decks.length === 0) {
    return {
      totalDecks: 0,
      totalValue: 0,
      averageDeckCost: 0,
      favoriteArchetype: null,
      decksWithUnknownPrices: 0,
    };
  }

  // Calculate total value across all decks
  const deckValues = decks.map((deck) => calculateSingleDeckValue(deck));
  const totalValue = deckValues.reduce((sum, val) => sum + val, 0);
  const averageDeckCost = totalValue / decks.length;

  // Count decks with unknown prices
  const decksWithUnknownPrices = deckValues.filter((v) => v === 0).length;

  // Find favorite archetype (most common tag)
  const favoriteArchetype = findFavoriteArchetype(decks);

  return {
    totalDecks: decks.length,
    totalValue,
    averageDeckCost,
    favoriteArchetype,
    decksWithUnknownPrices,
  };
}

// ─── Format distribution ──────────────────────────────────────────────────
/**
 * Count decks by format (Commander, Standard, Brawl, etc.).
 */
export function getFormatDistribution(
  decks: readonly Deck[]
): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const deck of decks) {
    dist[deck.format] = (dist[deck.format] ?? 0) + 1;
  }
  return dist;
}

// ─── Archetype distribution ───────────────────────────────────────────────
/**
 * Count decks by archetype tag (Combo, Control, Stax, etc.).
 */
export function getArchetypeDistribution(
  decks: readonly Deck[]
): Record<string, number> {
  const dist: Record<string, number> = {};

  for (const deck of decks) {
    for (const tag of deck.tags) {
      dist[tag] = (dist[tag] ?? 0) + 1;
    }
  }

  return dist;
}

// ─── Budget distribution ──────────────────────────────────────────────────
/**
 * Categorize decks by budget tier:
 * - Budget: < €100
 * - Mid-range: €100–€300
 * - Optimized: €300–€600
 * - cEDH: > €600
 */
export function getBudgetDistribution(
  decks: readonly Deck[]
): Record<string, number> {
  const dist: Record<string, number> = {
    Budget: 0,
    "Mid-range": 0,
    Optimized: 0,
    cEDH: 0,
  };

  for (const deck of decks) {
    const value = calculateSingleDeckValue(deck);
    const tier = getBudgetTier(value);
    dist[tier] += 1;
  }

  return dist;
}

// ─── Recently modified ────────────────────────────────────────────────────
/**
 * Get decks sorted by last modification date (newest first).
 */
export function getRecentlyModified(
  decks: readonly Deck[],
  limit = 3
): Deck[] {
  return [...decks]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}

// ─── Helpers ──────────────────────────────────────────────────────────────
/**
 * Calculate total value of a single deck.
 */
function calculateSingleDeckValue(deck: Deck): number {
  let total = 0;
  for (const card of deck.cards) {
    total += (card.price ?? 0) * card.quantity;
  }
  return total;
}

/**
 * Find the most commonly used archetype tag across all decks.
 */
function findFavoriteArchetype(decks: readonly Deck[]): string | null {
  const dist = getArchetypeDistribution(decks);
  const entries = Object.entries(dist);
  if (entries.length === 0) return null;

  const [first, ...rest] = entries;
  return rest.reduce<[string, number]>(
    (best, curr) => (curr[1] > best[1] ? curr : best),
    first
  )[0];
}

/**
 * Determine budget tier from deck value.
 */
function getBudgetTier(value: number): string {
  if (value < BUDGET_TIERS.BUDGET_MAX) return "Budget";
  if (value < BUDGET_TIERS.MID_MAX) return "Mid-range";
  if (value < BUDGET_TIERS.OPTIMIZED_MAX) return "Optimized";
  return "cEDH";
}
