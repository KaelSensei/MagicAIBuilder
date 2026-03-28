/**
 * Shopping list computation — pure functions, no framework dependencies.
 *
 * Computes missing cards, collection stats, and exportable text
 * from a deck + a set of owned scryfallIds.
 */
import type { DeckCard } from "@/lib/deck/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShoppingListItem {
  readonly scryfallId: string;
  readonly name: string;
  readonly quantity: number;
  readonly price: number | null;
}

export interface CollectionStats {
  readonly ownedCount: number;
  readonly totalCount: number;
  readonly completionRatio: number;
  readonly missingCost: number;
  readonly missingCount: number;
}

interface ShoppingListOptions {
  readonly includeBasics?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isBasicLand(card: DeckCard): boolean {
  return card.typeLine.toLowerCase().includes("basic land");
}

function collectAllCards(
  deckCards: readonly DeckCard[],
  commander: DeckCard | null,
  partner: DeckCard | null
): DeckCard[] {
  const cards: DeckCard[] = [];
  if (commander) cards.push(commander);
  if (partner) cards.push(partner);
  for (const card of deckCards) {
    if (card.zone === "main") cards.push(card);
  }
  return cards;
}

// ─── Shopping list ────────────────────────────────────────────────────────────

/** Build a sorted list of cards the user needs to buy. */
export function buildShoppingList(
  deckCards: readonly DeckCard[],
  commander: DeckCard | null,
  partner: DeckCard | null,
  ownedScryfallIds: ReadonlySet<string>,
  options?: ShoppingListOptions
): ShoppingListItem[] {
  const includeBasics = options?.includeBasics ?? false;
  const allCards = collectAllCards(deckCards, commander, partner);

  const missing: ShoppingListItem[] = [];

  for (const card of allCards) {
    if (ownedScryfallIds.has(card.scryfallId ?? card.id)) continue;
    if (!includeBasics && isBasicLand(card)) continue;

    missing.push({
      scryfallId: card.scryfallId ?? card.id,
      name: card.name,
      quantity: card.quantity,
      price: card.price,
    });
  }

  // Sort: priced cards descending, then null-price cards at the end
  missing.sort((a, b) => {
    if (a.price === null && b.price === null) return 0;
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return b.price - a.price;
  });

  return missing;
}

// ─── Collection stats ─────────────────────────────────────────────────────────

/** Compute owned/missing counts and missing cost for a deck. */
export function computeCollectionStats(
  deckCards: readonly DeckCard[],
  commander: DeckCard | null,
  partner: DeckCard | null,
  ownedScryfallIds: ReadonlySet<string>
): CollectionStats {
  const allCards = collectAllCards(deckCards, commander, partner);
  const totalCount = allCards.length;
  let ownedCount = 0;
  let missingCost = 0;

  for (const card of allCards) {
    const isOwned = ownedScryfallIds.has(card.scryfallId ?? card.id);
    if (isOwned) {
      ownedCount++;
    } else {
      missingCost += (card.price ?? 0) * card.quantity;
    }
  }

  const completionRatio = totalCount > 0 ? ownedCount / totalCount : 0;

  return {
    ownedCount,
    totalCount,
    completionRatio,
    missingCost: Math.round(missingCost * 100) / 100,
    missingCount: totalCount - ownedCount,
  };
}

// ─── Text export ──────────────────────────────────────────────────────────────

/** Format shopping list as copyable text: "1× Sol Ring\n4× Island" */
export function formatShoppingListText(items: readonly ShoppingListItem[]): string {
  if (items.length === 0) return "";
  return items.map((item) => `${item.quantity}× ${item.name}`).join("\n");
}

/** Format shopping list as CSV for download */
export function formatShoppingListCsv(items: readonly ShoppingListItem[]): string {
  const header = "Name,Quantity,Price (USD)";
  const rows = items.map(
    (item) => `"${item.name}",${item.quantity},${item.price ?? ""}`
  );
  return [header, ...rows].join("\n");
}
