/**
 * Adds one copy of a deck row's card to another of the player's decks, through
 * the deck client and the owner-only deck routes.
 *
 * Deck-building context, client use case. It reads the other deck, lets
 * `decideOtherDeckWrite` choose the write, and sends it with the version it
 * read (the deck's optimistic lock, #1400). A 409 means the other deck changed
 * in between: the add is tried once more from a fresh read, then the refusal
 * is reported. The open deck and the store are never written here.
 * Not responsible for: messages, or what the store holds of the other deck.
 *
 * @module deck/add-to-other-deck-write
 */
import { isStaleDeckRefusal } from "@/lib/db/deck-api-answer";
import * as deckApi from "@/lib/db/deck-api";
import { decideOtherDeckWrite } from "@/lib/deck/add-to-other-deck";
import { addCardPayload, apiDeckToStoreDeck } from "@/lib/deck/store-factories";
import type { DeckCard, DeckZone } from "@/lib/deck/types";

/** One copy of a card for a zone of another deck. */
export interface OtherDeckAddition {
  /** The card, as the open deck's row holds it: its printing is the one added. */
  readonly card: DeckCard;
  /** The deck that receives the copy; never the open deck. */
  readonly deckId: string;
  readonly zone: DeckZone;
}

/** What the other deck holds once the add is done. */
export type OtherDeckAddOutcome =
  /** The copy was stored; `quantity` is the row's stored count. */
  | { readonly kind: "added"; readonly quantity: number }
  /** The zone's row was at the card's copy limit; nothing was stored. */
  | { readonly kind: "atLimit" };

/**
 * Adds one copy of `card` to a zone of another deck.
 *
 * @param addition - the card, the other deck and the zone
 * @returns `added` with the stored count, or `atLimit` when nothing was stored
 * @throws DeckApiError when a read or a write fails, or a write is refused
 *   twice for a stale version
 */
export function addCardToOtherDeck(
  addition: OtherDeckAddition
): Promise<OtherDeckAddOutcome> {
  return addOnce(addition).catch((error: unknown) => {
    if (!isStaleDeckRefusal(error)) throw error;
    return addOnce(addition);
  });
}

/** One read-decide-write pass against the other deck as it is now. */
async function addOnce({
  card,
  deckId,
  zone,
}: OtherDeckAddition): Promise<OtherDeckAddOutcome> {
  const deck = apiDeckToStoreDeck(await deckApi.fetchDeck(deckId));
  const write = decideOtherDeckWrite(deck, card, zone);
  const target = { deckId, expectedVersion: deck.version };
  switch (write.kind) {
    case "atLimit":
      return { kind: "atLimit" };
    case "addRow": {
      const saved = await deckApi.addCard(
        target,
        addCardPayload({ ...card, quantity: 1, zone })
      );
      return { kind: "added", quantity: saved.quantity };
    }
    case "addCopy": {
      const saved = await deckApi.updateCardQuantity(
        target,
        write.rowId,
        write.quantity
      );
      // The route stores at most the copy limit (`copy-limit-write.ts`): a
      // count that did not grow means no copy was added.
      return saved.quantity < write.quantity
        ? { kind: "atLimit" }
        : { kind: "added", quantity: saved.quantity };
    }
    default: {
      const unknownWrite: never = write;
      return unknownWrite;
    }
  }
}
