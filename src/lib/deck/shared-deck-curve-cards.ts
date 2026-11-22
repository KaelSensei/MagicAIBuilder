/**
 * The rows of a shared deck as the builder's mana curve reads them, so the share-link view draws
 * the builder's curve: the same bars, permanents and spells, medians, total and card lists (I-37).
 *
 * Deck analysis, pure. The builder's chart reads its `deckAnalysisCards`: the commander, the
 * partner and every non-command row, never the companion. The curve helpers
 * (`curve-breakdown.ts`) pick the main-deck rows out of those by zone. The share link sends one
 * row per stored card, command zone included, through `SHARED_DECK_SELECT`.
 * Not responsible for: the curve rules (`curve-breakdown.ts`), or any other figure of the view.
 *
 * @module deck/shared-deck-curve-cards
 */
import { commandSlotOf } from "./bulk-edit-command-zone";
import { isDeckZone } from "./drop-targets";
import type { ApiCard } from "./share-types";
import { CARD_CATEGORIES, type CardCategory, type DeckCard } from "./types";

/** A stored category, or `other`, the column default, for one this build does not know. */
function categoryOf(stored: string): CardCategory {
  return CARD_CATEGORIES.find((category) => category === stored) ?? "other";
}

/**
 * One share row as a deck card. The share select leaves out the Oracle text, the ban flag and the
 * price, which no curve figure reads, so they hold the column defaults.
 */
function toDeckCard(card: ApiCard): DeckCard {
  return {
    id: card.id,
    name: card.name,
    manaCost: card.manaCost,
    cmc: card.cmc,
    typeLine: card.typeLine,
    oracleText: "",
    colorIdentity: [...card.colorIdentity],
    isGameChanger: card.isGameChanger,
    isBanned: false,
    price: null,
    imageUri: card.imageUri,
    artCropUri: card.artCropUri,
    category: categoryOf(card.category),
    quantity: card.quantity,
    zone: isDeckZone(card.zone) ? card.zone : "main",
  };
}

/**
 * The builder's deck analysis cards from a shared deck's rows: every row but the companion's.
 * CR 702.139a: a companion starts outside the game, so the curve leaves it out, as the builder
 * does.
 *
 * @param cards - the rows `GET /api/share/[token]` returns
 * @returns the rows the curve helpers read, in the order given
 */
export function sharedDeckCurveCards(
  cards: readonly ApiCard[]
): readonly DeckCard[] {
  return cards
    .filter((card) => commandSlotOf(card) !== "companion")
    .map(toDeckCard);
}
