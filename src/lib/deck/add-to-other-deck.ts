/**
 * What adding one copy of a card to another of the player's decks writes:
 * a new row, one more copy on the row that zone already holds, or nothing
 * because the deck already holds the card's copy limit.
 *
 * Deck-building context, pure policy. The editor's row menu offers "Add to
 * another deck…" (I-37); this module decides the write from the other deck as
 * just read, and `useAddToOtherDeck` sends it. Matching follows the store's own
 * add (`addCard` in `store.ts`): one row per card name and zone, so a held row
 * of another printing takes the copy and keeps its printing. The limit counts
 * the copies across the deck, its sideboard and its commanders
 * (`./counted-copies`).
 * Not responsible for: reading or writing the deck, or writing the command
 * zone.
 *
 * @module deck/add-to-other-deck
 */
import { commandZoneExceptions } from "@/lib/deck/color-identity";
import { copiesCountedFor } from "@/lib/deck/counted-copies";
import { deckCopyLimit } from "@/lib/deck/multiples";
import type { Deck, DeckCard, DeckZone } from "@/lib/deck/types";

/** The write that adds one copy of a card to a zone of another deck. */
export type OtherDeckWrite =
  /** The zone does not hold the card: write a new row of one copy. */
  | { readonly kind: "addRow" }
  /** The zone holds the card below its limit: write `quantity` on that row. */
  | { readonly kind: "addCopy"; readonly rowId: string; readonly quantity: number }
  /** The copies the limit counts are at the card's copy limit: write nothing. */
  | { readonly kind: "atLimit" };

/** The facts of the other deck the decision reads. */
export type OtherDeck = Pick<Deck, "format" | "commander" | "partner" | "cards">;

/**
 * Decides how one copy of `card` reaches `zone` of `deck`.
 *
 * @param deck - the other deck, as just read: its format, command zone and rows
 * @param card - the card to add, as the open deck's row holds it
 * @param zone - Main, Sideboard or Considering (`maybeboard`)
 * @returns the write to send, or `atLimit` when none may be sent
 */
export function decideOtherDeckWrite(
  deck: OtherDeck,
  card: DeckCard,
  zone: DeckZone
): OtherDeckWrite {
  // CR 100.2a: four copies in a constructed deck; CR 903.5b: one in a
  // Commander deck, basic lands aside; a rulebreaker commander lifts the 99
  // cap on cards no copy rule limits (CR 903.5e).
  const limit = deckCopyLimit(card, {
    format: deck.format,
    exceptions: commandZoneExceptions(deck),
  });
  if (copiesCountedFor(deck, card.name, zone) >= limit) {
    return { kind: "atLimit" };
  }
  const held = deck.cards.find(
    (row) => row.name === card.name && row.zone === zone
  );
  if (!held) return { kind: "addRow" };
  return { kind: "addCopy", rowId: held.id, quantity: held.quantity + 1 };
}
