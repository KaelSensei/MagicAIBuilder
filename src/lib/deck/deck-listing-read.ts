/**
 * The shape a deck takes in the library listing, shared by every read that
 * lists a player's own decks: `GET /api/decks` and the card search of
 * `GET /api/decks/search`.
 *
 * Deck-building context, Prisma adapter. The listing is lightweight on
 * purpose: the command zone only (commander, partner, companion), the row
 * count the store tells a listing stub by (`isDeckStub`) and the card count
 * the deck list shows. One shape means the library renders a searched deck
 * exactly as it renders a listed one.
 * Not responsible for: which decks are listed, their order or the session.
 *
 * @module deck/deck-listing-read
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { countDeckCardCopies } from "@/lib/deck/prisma-deck-card-copies";

/** The most decks one listing answer carries. */
export const DECK_LISTING_MAX_PAGE_SIZE = 50;

/**
 * The relations a listed deck carries: its command-zone rows, at most three
 * (commander, partner, companion), and its row count.
 */
export const DECK_LISTING_INCLUDE = {
  cards: {
    where: {
      OR: [
        { isCommander: true },
        { isPartner: true },
        { category: "companion" },
      ],
    },
    select: {
      id: true,
      scryfallId: true,
      name: true,
      manaCost: true,
      cmc: true,
      typeLine: true,
      oracleText: true,
      colorIdentity: true,
      isGameChanger: true,
      isBanned: true,
      price: true,
      imageUri: true,
      artCropUri: true,
      category: true,
      isCommander: true,
      isPartner: true,
      power: true,
      toughness: true,
      quantity: true,
      notes: true,
      zone: true,
    },
    distinct: ["scryfallId", "isCommander", "isPartner"],
    take: 3,
  },
  _count: { select: { cards: true } },
} satisfies Prisma.DeckInclude;

/**
 * Adds each deck's card count, as the editor counts it, to a page of the
 * listing: one grouped query for the page, never one per deck.
 * `_count.cards` stays the row count the store tells a listing stub by
 * (`isDeckStub`); `cardCopyCount` is the count the deck list shows.
 *
 * @param decks - the page of decks
 * @returns the same decks, each with its `cardCopyCount`
 */
export async function withCardCopyCounts<D extends { readonly id: string }>(
  decks: readonly D[]
): Promise<(D & { readonly cardCopyCount: number })[]> {
  const copies = await countDeckCardCopies(
    prisma,
    decks.map((deck) => deck.id)
  );
  return decks.map((deck) => ({
    ...deck,
    cardCopyCount: copies.get(deck.id) ?? 0,
  }));
}
