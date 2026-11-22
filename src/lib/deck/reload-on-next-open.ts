/**
 * Turns a deck the store holds with its rows back into a listing stub, so the
 * next time it is opened the builder reads it again.
 *
 * Deck-building context, pure store policy. `setActiveDeck` reads a deck from
 * the server only when the store does not hold its rows (`isDeckStub`
 * compares the rows held with `cardRowCount`). A write the store did not make
 * itself, such as the row menu's "Add to another deck…" (I-37), leaves the
 * held rows behind the server's; dropping them makes the next open fetch the
 * deck, as it would after the listing.
 * Not responsible for: reading the deck, or the deck that is open.
 *
 * @module deck/reload-on-next-open
 */
import { countDeckCards } from "@/lib/deck/deck-size";
import { countLoadedCards } from "@/lib/deck/loaded-card-count";
import { isDeckStub } from "@/lib/deck/store-factories";
import type { Deck } from "@/lib/deck/types";

/**
 * The held decks, with `deckId` turned into a listing stub when the store
 * holds its rows. A deck not held, or already a stub, is left as it is.
 *
 * @param decks - the decks the store holds, by id
 * @param deckId - the deck whose held rows are out of date
 * @returns the decks to hold
 */
export function withDeckToReload(
  decks: Readonly<Record<string, Deck>>,
  deckId: string
): Record<string, Deck> {
  const deck = decks[deckId];
  if (!deck || isDeckStub(deck)) return { ...decks };
  return { ...decks, [deckId]: asListingStub(deck) };
}

/**
 * The deck as the listing holds it: the command zone, no other row, and a row
 * count above the rows held so `isDeckStub` reads it as a stub. The card
 * count the deck list shows stays the one the rows gave (`cardCopyCount`)
 * until the listing is read again, which `useAddToOtherDeck` does at once.
 * The version goes too: a stub vouches for none until its rows are read.
 */
function asListingStub({ version: _version, ...deck }: Deck): Deck {
  const commandZoneOnly: Deck = { ...deck, cards: [], maybeboard: [] };
  return {
    ...commandZoneOnly,
    cardCopyCount: countDeckCards(deck),
    cardRowCount: Math.max(
      deck.cardRowCount,
      countLoadedCards(commandZoneOnly) + 1
    ),
  };
}
