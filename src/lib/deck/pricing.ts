/**
 * Deck Pricing — Price tracking, analysis, and budget optimization
 * Pure functions for price calculations and recommendations
 */

import type { DeckCard } from "@/lib/deck/types";

// ─── Types ────────────────────────────────────────────────────────────────
export interface DeckPricing {
  readonly totalPrice: number;
  readonly averagePrice: number;
  readonly cardCount: number;
  readonly cardsWithPrice: number;
  readonly cardsWithoutPrice: number;
  readonly mostExpensiveCard: DeckCard | null;
  readonly cheapestCard: DeckCard | null;
}

export interface PriceBreakdown {
  readonly total: number;
  readonly byType: Record<string, number>;
  readonly percentages: Record<string, number>;
}

export interface BudgetSuggestion {
  readonly cardToReplace: DeckCard;
  readonly suggestedReplacement: string; // Card name or "Basic land"
  readonly currentPrice: number;
  readonly suggestedPrice: number;
  readonly savingsAmount: number;
}

// ─── Calculate deck price ──────────────────────────────────────────────────
/**
 * Calculate total deck price and pricing statistics.
 */
export function calculateDeckPrice(cards: readonly DeckCard[]): DeckPricing {
  let totalPrice = 0;
  let cardsWithPrice = 0;
  let mostExpensive: DeckCard | null = null;
  let cheapest: DeckCard | null = null;

  for (const card of cards) {
    const price = card.price ?? 0;
    const cardTotalPrice = price * card.quantity;

    if (price > 0) {
      totalPrice += cardTotalPrice;
      cardsWithPrice += 1;

      // Track most expensive
      if (!mostExpensive || (card.price ?? 0) > (mostExpensive.price ?? 0)) {
        mostExpensive = card;
      }

      // Track cheapest (non-zero)
      if (!cheapest || (card.price ?? Infinity) < (cheapest.price ?? Infinity)) {
        cheapest = card;
      }
    }
  }

  const averagePrice =
    cardsWithPrice > 0 ? totalPrice / cardsWithPrice : 0;

  return {
    totalPrice,
    averagePrice,
    cardCount: cards.length,
    cardsWithPrice,
    cardsWithoutPrice: cards.length - cardsWithPrice,
    mostExpensiveCard: mostExpensive,
    cheapestCard: cheapest,
  };
}

// ─── Price breakdown by type ───────────────────────────────────────────────
/**
 * Break down deck price by card type (creatures, spells, lands, etc.).
 */
export function getPriceBreakdown(
  cards: readonly DeckCard[]
): PriceBreakdown {
  const byType: Record<string, number> = {};
  let total = 0;

  for (const card of cards) {
    const price = card.price ?? 0;
    if (price === 0) continue;

    const type = card.typeLine.split("—")[0].trim(); // First part before "—" (e.g., "Creature")
    byType[type] = (byType[type] ?? 0) + price * card.quantity;
    total += price * card.quantity;
  }

  // Calculate percentages
  const percentages: Record<string, number> = {};
  if (total > 0) {
    for (const type of Object.keys(byType)) {
      percentages[type] = (byType[type] / total) * 100;
    }
  }

  return {
    total,
    byType,
    percentages,
  };
}

// ─── Budget optimization suggestions ───────────────────────────────────────
/**
 * Suggest budget reductions by replacing expensive cards with cheaper alternatives.
 * Returns suggestions sorted by savings (most impactful first).
 */
export function suggestBudgetReductions(
  cards: readonly DeckCard[],
  targetBudget: number
): BudgetSuggestion[] {
  const pricing = calculateDeckPrice(cards);

  // If already under budget, no suggestions
  if (pricing.totalPrice <= targetBudget) {
    return [];
  }

  const savings = pricing.totalPrice - targetBudget;
  const suggestions: BudgetSuggestion[] = [];

  // Sort cards by price descending (most expensive first)
  const sorted = getCardsSortedByPrice(cards, "desc");

  for (const card of sorted) {
    if (!card.price || card.price === 0) continue;

    // Simple heuristic: suggest basic land (€0.10) for lands, cheaper alternative for other types
    const isBland = card.typeLine.includes("Land");
    const suggestedPrice = isBland ? 0.1 : card.price * 0.3; // Reduce to 30% of cost
    const savingsAmount = card.price - suggestedPrice;

    if (savingsAmount > 0) {
      suggestions.push({
        cardToReplace: card,
        suggestedReplacement: isBland ? "Basic Land" : `${card.name} (budget alternative)`,
        currentPrice: card.price,
        suggestedPrice,
        savingsAmount,
      });
    }

    // Stop when enough savings found
    if (
      suggestions.reduce((sum, s) => sum + s.savingsAmount, 0) >=
      savings * 1.1
    ) {
      break;
    }
  }

  // Sort by savings (descending)
  return suggestions.sort((a, b) => b.savingsAmount - a.savingsAmount);
}

// ─── Get cards sorted by price ─────────────────────────────────────────────
/**
 * Get all cards sorted by price, excluding cards without price data.
 */
export function getCardsSortedByPrice(
  cards: readonly DeckCard[],
  order: "asc" | "desc" = "desc"
): DeckCard[] {
  return cards
    .filter((c) => c.price !== null && c.price > 0)
    .sort((a, b) => {
      const priceA = a.price ?? 0;
      const priceB = b.price ?? 0;
      return order === "desc" ? priceB - priceA : priceA - priceB;
    });
}

// ─── Find cheaper alternatives ─────────────────────────────────────────────
/**
 * Find cheaper cards that could replace an expensive card.
 * Prioritizes cards of the same type.
 */
export function findCheaperAlternatives(
  expensiveCard: DeckCard,
  allCards: readonly DeckCard[]
): DeckCard[] {
  const maxPrice = expensiveCard.price ?? Infinity;

  // Filter: same type, cheaper, has price
  const candidates = allCards.filter(
    (c) =>
      c.id !== expensiveCard.id &&
      c.typeLine === expensiveCard.typeLine &&
      (c.price ?? Infinity) < maxPrice
  );

  // Sort by price (ascending — cheapest first)
  return candidates.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
}

// ─── Export shopping list ──────────────────────────────────────────────────
/**
 * Generate CSV data for a shopping list (card name, qty, price, total).
 *
 * Amounts are in **USD**: every ingest path reads Scryfall's `prices.usd`, so
 * the euro sign this used to print named a currency the numbers were never in.
 *
 * Unpriced cards are listed last at 0.00 rather than dropped.
 * `getCardsSortedByPrice` filters them out by design — right for a
 * sorted-by-price view, wrong for a list of what to buy, where a missing row
 * means a card you never purchase.
 *
 * @param cards - the cards to list
 * @returns CSV text, priced cards first, most expensive first
 */
export function generateShoppingListCSV(
  cards: readonly DeckCard[]
): string {
  const priced = getCardsSortedByPrice(cards, "desc");
  const pricedIds = new Set(priced.map((c) => c.id));
  const unpriced = cards.filter((c) => !pricedIds.has(c.id));

  const lines = [
    "Card Name,Quantity,Unit Price,Total",
    ...[...priced, ...unpriced].map((c) => {
      const unit = c.price ?? 0;
      const total = unit * c.quantity;
      return `"${c.name}",${c.quantity},$${unit.toFixed(2)},$${total.toFixed(2)}`;
    }),
  ];

  return lines.join("\n");
}
