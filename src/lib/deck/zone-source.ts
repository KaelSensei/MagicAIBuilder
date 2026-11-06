import type { Deck, DeckCard, DeckZone } from "./types";

/**
 * Copies a card with the persisted zone and a flag derived from that zone.
 *
 * @param card - Card row to copy
 * @param zone - Zone that owns the card
 * @returns A card whose maybeboard flag matches `zone`
 */
function cardInZone(card: DeckCard, zone: DeckZone): DeckCard {
  return { ...card, zone, isMaybeboard: zone === "maybeboard" };
}

/**
 * Reads every card from the persisted zone.
 *
 * A row in `cards` wins when the legacy maybeboard mirror lists the same id
 * with a different zone. A card that exists only on that mirror is folded in
 * once, as maybeboard, so the mirror cannot remain a second source of truth.
 *
 * @param deck - Deck cards plus the legacy maybeboard mirror
 * @returns Unique cards ordered with persisted rows first
 */
export function cardsFromZoneSource(
  deck: Pick<Deck, "cards" | "maybeboard">
): DeckCard[] {
  const seen = new Set<string>();
  const cards: DeckCard[] = [];

  for (const card of deck.cards) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    cards.push(cardInZone(card, card.zone));
  }

  for (const card of deck.maybeboard) {
    if (seen.has(card.id)) continue;
    seen.add(card.id);
    cards.push(cardInZone(card, "maybeboard"));
  }

  return cards;
}

/**
 * Stores cards by zone and rebuilds the maybeboard mirror from that zone.
 *
 * @param deck - Deck whose non-card fields are preserved
 * @param cards - Next card rows, including any legacy mirror entries already folded in
 * @returns The deck with one card list and a derived maybeboard mirror
 */
export function deckFromZoneCards(deck: Deck, cards: readonly DeckCard[]): Deck {
  const unique = cardsFromZoneSource({ cards: [...cards], maybeboard: [] });
  return {
    ...deck,
    cards: unique,
    maybeboard: unique.filter((card) => card.zone === "maybeboard"),
  };
}
