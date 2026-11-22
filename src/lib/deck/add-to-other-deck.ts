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
 * the copies across the deck, its sideboard and its commanders.
 * Not responsible for: reading or writing the deck, or writing the command
 * zone.
 *
 * @module deck/add-to-other-deck
 */
import { commandZoneExceptions } from "@/lib/deck/color-identity";
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

/** The zones whose rows are part of the deck: Considering is not. */
const DECK_ZONES: ReadonlySet<DeckZone> = new Set(["main", "sideboard"]);

/**
 * The copies of `name` the copy limit weighs for an add to `zone`. CR 100.4a:
 * the deck and its sideboard together hold at most the limit, so an add to
 * either counts both, and the commanders with them (CR 903.5b: the singleton
 * rule spans the whole deck, the command zone included). Considering
 * (`maybeboard`) is not part of the deck: an add there weighs that zone's row
 * alone, as the store's own add does.
 */
function copiesCountedFor(
  deck: OtherDeck,
  name: string,
  zone: DeckZone
): number {
  if (!DECK_ZONES.has(zone)) return copiesInZones(deck, name, new Set([zone]));
  return copiesInZones(deck, name, DECK_ZONES) + commandZoneCopies(deck, name);
}

/** The copies of `name` on the rows of `zones`. */
function copiesInZones(
  deck: OtherDeck,
  name: string,
  zones: ReadonlySet<DeckZone>
): number {
  return deck.cards
    .filter((row) => row.name === name && zones.has(row.zone))
    .reduce((copies, row) => copies + row.quantity, 0);
}

/**
 * The commander and the partner named `name`. The companion stays out: it is
 * not one of the deck's commanders (CR 702.139a), and the store holds it
 * apart from the deck's rows.
 */
function commandZoneCopies(deck: OtherDeck, name: string): number {
  return [deck.commander, deck.partner].filter((card) => card?.name === name)
    .length;
}
