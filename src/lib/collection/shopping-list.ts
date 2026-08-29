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

export type DeckCardStatus = "owned" | "proxy" | "missing";

export interface DeckCardStatusItem {
  readonly scryfallId: string;
  readonly name: string;
  readonly quantity: number;
  readonly availableQuantity: number;
  readonly neededQuantity: number;
  readonly status: DeckCardStatus;
  readonly price: number | null;
}

export interface CollectionStats {
  readonly ownedCount: number;
  readonly totalCount: number;
  readonly completionRatio: number;
  readonly missingCost: number;
  readonly missingCount: number;
}

export interface DeckCollectionSummary {
  readonly totalQuantity: number;
  readonly ownedQuantity: number;
  readonly proxyQuantity: number;
  readonly missingQuantity: number;
  readonly completionRatio: number;
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

// ─── Collection status ────────────────────────────────────────────────────────

/**
 * Resolve each deck card against physical and proxy quantities.
 * Physical cards take precedence; proxies cover the remaining quantity.
 */
export function getDeckCardStatuses(
  deckCards: readonly DeckCard[],
  commander: DeckCard | null,
  partner: DeckCard | null,
  quantities: Readonly<Record<string, number>>,
  proxyQuantities: Readonly<Record<string, number>> = {}
): DeckCardStatusItem[] {
  const result: DeckCardStatusItem[] = [];
  for (const card of collectAllCards(deckCards, commander, partner)) {
    const scryfallId = card.scryfallId ?? card.id;
    const physical = Math.max(0, quantities[scryfallId] ?? 0);
    const proxy = Math.max(0, proxyQuantities[scryfallId] ?? 0);
    const availableQuantity = Math.min(card.quantity, physical + proxy);
    const neededQuantity = card.quantity - availableQuantity;
    const isBasic = isBasicLand(card);
    const status: DeckCardStatus = isBasic || physical >= card.quantity
      ? "owned"
      : proxy > 0
        ? "proxy"
        : "missing";

    result.push({
      scryfallId,
      name: card.name,
      quantity: card.quantity,
      availableQuantity: isBasic ? card.quantity : availableQuantity,
      neededQuantity: isBasic ? 0 : neededQuantity,
      status: isBasic ? "owned" : status,
      price: card.price,
    });
  }
  return result;
}

/** Summarize required deck quantities without mutating collection data. */
export function summarizeDeckCollection(
  deckCards: readonly DeckCard[],
  commander: DeckCard | null,
  partner: DeckCard | null,
  quantities: Readonly<Record<string, number>>,
  proxyQuantities: Readonly<Record<string, number>> = {}
): DeckCollectionSummary {
  const statuses = getDeckCardStatuses(deckCards, commander, partner, quantities, proxyQuantities);
  let totalQuantity = 0;
  let ownedQuantity = 0;
  let proxyQuantity = 0;
  let missingQuantity = 0;

  for (const item of statuses) {
    totalQuantity += item.quantity;
    const physical = Math.min(item.quantity, Math.max(0, quantities[item.scryfallId] ?? 0));
    const proxy = Math.min(item.quantity - physical, Math.max(0, proxyQuantities[item.scryfallId] ?? 0));
    ownedQuantity += physical;
    proxyQuantity += proxy;
    missingQuantity += item.quantity - physical - proxy;
  }

  return {
    totalQuantity,
    ownedQuantity,
    proxyQuantity,
    missingQuantity,
    completionRatio: totalQuantity > 0 ? (ownedQuantity + proxyQuantity) / totalQuantity : 0,
  };
}


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

/** Compute owned/missing counts and missing cost for a deck. Basic lands are always counted as owned. */
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
    const isOwned =
      isBasicLand(card) || ownedScryfallIds.has(card.scryfallId ?? card.id);
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

// ─── Collection export ───────────────────────────────────────────────────────

export interface CollectionExportCard {
  readonly name: string;
  readonly quantity: number;
  readonly foil: boolean;
  readonly condition: string | null;
  readonly price: number | null;
}

/** Format full collection as plain text: "1× Sol Ring\n2× Island" */
export function formatCollectionText(cards: readonly CollectionExportCard[]): string {
  if (cards.length === 0) return "";
  return cards.map((c) => {
    const foilTag = c.foil ? " [Foil]" : "";
    return `${c.quantity}× ${c.name}${foilTag}`;
  }).join("\n");
}

/** Format full collection as CSV for download */
export function formatCollectionCsv(cards: readonly CollectionExportCard[]): string {
  const header = "Name,Quantity,Foil,Condition,Price (USD)";
  const rows = cards.map(
    (c) =>
      `"${c.name}",${c.quantity},${c.foil ? "Yes" : "No"},${c.condition ?? ""},${c.price ?? ""}`
  );
  return [header, ...rows].join("\n");
}
