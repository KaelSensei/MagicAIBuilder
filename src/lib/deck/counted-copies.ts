/**
 * The copies of a card the copy limit weighs for an add to one zone of a deck.
 *
 * Deck-building context, pure policy. CR 100.2a and CR 100.4a: a constructed
 * deck and its sideboard together hold at most the card's limit; CR 903.5b:
 * the singleton rule spans the whole Commander deck, its command zone
 * included. Every row of the name counts, whatever its printing.
 * Considering (`maybeboard`) is not part of the deck: it is neither counted
 * for an add to the deck nor counted against one.
 * Not responsible for: the limit itself (`deckCopyLimit` in `./multiples`).
 *
 * @module deck/counted-copies
 */
import type { DeckZone } from "./types";

/** A row the count reads: its card name, zone and copies. */
export interface CountedRow {
  readonly name: string;
  readonly zone: DeckZone;
  readonly quantity: number;
}

/**
 * The deck facts the count reads: its rows and its command zone. A loaded
 * `Deck` is one, and so is a deck read from stored rows: the editor and the
 * server count with the same rule.
 */
export interface CountedCopiesDeck {
  readonly commander: { readonly name: string } | null;
  readonly partner: { readonly name: string } | null;
  readonly cards: readonly CountedRow[];
}

/** The zones whose rows are part of the deck: Considering is not. */
const DECK_ZONES: ReadonlySet<DeckZone> = new Set(["main", "sideboard"]);

/**
 * Whether the copy limit counts the rows of `zone`: the main deck and the
 * sideboard do (CR 100.2a, CR 100.4a), Considering does not.
 *
 * @param zone - A zone of the deck's rows
 * @returns `true` for the main deck and the sideboard
 */
export function isCountedZone(zone: DeckZone): boolean {
  return DECK_ZONES.has(zone);
}

/**
 * The copies of `name` the copy limit weighs for an add to `zone`. An add to
 * the main deck or the sideboard counts both, and the commanders with them;
 * an add to Considering weighs that zone's rows alone.
 *
 * @param deck - The deck's rows, every zone, and its commander and partner
 * @param name - The card name the limit counts by
 * @param zone - The zone the copy goes to
 * @returns The copies already held that the limit counts
 */
export function copiesCountedFor(
  deck: CountedCopiesDeck,
  name: string,
  zone: DeckZone
): number {
  if (!isCountedZone(zone)) return copiesInZones(deck, name, new Set([zone]));
  return copiesInZones(deck, name, DECK_ZONES) + commandZoneCopies(deck, name);
}

/** The copies of `name` on the rows of `zones`. */
function copiesInZones(
  deck: CountedCopiesDeck,
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
function commandZoneCopies(deck: CountedCopiesDeck, name: string): number {
  return [deck.commander, deck.partner].filter((card) => card?.name === name)
    .length;
}
