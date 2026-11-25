/**
 * The copy limit of a server write, counted across every row of the deck: a
 * row is weighed against the copies the deck's other rows already hold, so a
 * second printing or a sideboard row cannot carry a card past its limit.
 *
 * Deck-building context, pure policy. CR 100.2a and CR 100.4a: a constructed
 * deck and its sideboard together hold at most four copies of a card;
 * CR 903.5b: a Commander deck holds one, its command zone included. The count
 * is the editor's (`copiesCountedFor` of `./counted-copies`), read from stored
 * rows instead of the store's state, so the server holds the same rule.
 * Basic lands and "any number" cards keep their exemptions (`deckCopyLimit`).
 *
 * Not weighed against other rows: a Considering row (Considering is not part
 * of the deck) and a command-zone row (the commander, partner or companion,
 * one card per slot). Both keep the per-row clamp of `cardWithinCopyLimit`.
 *
 * Not responsible for: the limit itself (`deckCopyLimit`), the count
 * (`copiesCountedFor`), reading the rows (`api/copy-rule-deck-owner.ts`).
 *
 * @module deck/copy-room-write
 */
import {
  commandSlotOf,
  rowFillsCommandSlot,
  type CommandSlot,
  type CommandSlotFlags,
} from "./bulk-edit-command-zone";
import { cardWithinCopyLimit, type CopiesChange } from "./copy-limit-write";
import {
  copiesCountedFor,
  isCountedZone,
  type CountedCopiesDeck,
  type CountedRow,
} from "./counted-copies";
import { isDeckZone } from "./drop-targets";
import {
  copiesWithinLimit,
  deckCopyLimit,
  type CopyLimitCard,
  type CopyLimitDeck,
} from "./multiples";
import type { DeckZone } from "./types";

/** A row the count reads or a write stores: its card text, place and copies. */
export interface CopiesRow extends CopyLimitCard, CommandSlotFlags {
  /** `DeckCard.zone` as stored or sent: "main", "sideboard" or "maybeboard" */
  readonly zone: string;
  readonly quantity: number;
}

/** A stored row, with the id a resize or an edit names it by. */
export interface StoredCopiesRow extends CopiesRow {
  readonly id: string;
}

/**
 * The stored zone as a deck zone. An unknown value reads as the main deck,
 * where the database's column default puts a row.
 */
function deckZoneOf(zone: string): DeckZone {
  return isDeckZone(zone) ? zone : "main";
}

/**
 * The deck the count reads, from rows: the rows that fill the commander and
 * partner slots are its command zone, the companion is left out (CR 702.139a:
 * it is not a commander) and every other row is one of its cards.
 *
 * @param rows - The deck's rows, every zone, command zone included
 * @returns The deck `copiesCountedFor` reads
 */
export function countedDeckOf(rows: readonly CopiesRow[]): CountedCopiesDeck {
  const cards: CountedRow[] = [];
  let commander: CopiesRow | null = null;
  let partner: CopiesRow | null = null;
  for (const row of rows) {
    const slot = commandSlotOf(row);
    if (slot === "commander") commander = row;
    else if (slot === "partner") partner = row;
    else if (slot === null) {
      cards.push({
        name: row.name,
        zone: deckZoneOf(row.zone),
        quantity: row.quantity,
      });
    }
  }
  return { commander, partner, cards };
}

/**
 * Whether the row is weighed against the deck's other rows: a row of the main
 * deck or the sideboard (CR 100.2a, CR 100.4a), not a command-zone row nor a
 * Considering row.
 */
function isWeighed(row: CopiesRow): boolean {
  return commandSlotOf(row) === null && isCountedZone(deckZoneOf(row.zone));
}

/** A row a write stores, with the copies it already held where it goes. */
interface RowPlacement {
  /** The row as the write would store it, in its target zone */
  readonly row: CopiesRow;
  /** The copies the row already holds in the counted zones; 0 for a new row */
  readonly held: number;
}

/**
 * The most copies a row may hold beside `others`: the card's limit less the
 * copies the other rows hold, never below what the row already held there,
 * so a write never takes a copy away it did not ask to. A row that is not
 * weighed may hold its limit.
 *
 * @param placement - The row and the copies it held
 * @param others - Every other row of the deck, as the write leaves them
 * @param rule - The deck's copy-limit facts
 * @returns The copies allowed; 0 or less when the deck has no room
 */
function copiesAllowed(
  { row, held }: RowPlacement,
  others: readonly CopiesRow[],
  rule: CopyLimitDeck
): number {
  const limit = deckCopyLimit(row, rule);
  if (!isWeighed(row)) return limit;
  const counted = copiesCountedFor(
    countedDeckOf(others),
    row.name,
    deckZoneOf(row.zone)
  );
  return Math.min(limit, Math.max(limit - counted, held));
}

/**
 * The rows a write adds, each within the room the deck has left. Rows are
 * weighed in order, each against the stored rows and the adds before it; an
 * add with no room is dropped, and the write stores nothing past the limit.
 * The command-zone rows count first, wherever the request lists them, since
 * the deck holds them whatever else it holds (CR 903.5b).
 *
 * @param cards - The rows to add, in order
 * @param rows - The rows the deck holds when they are added
 * @param rule - The deck's copy-limit facts
 * @returns The rows to store, in order, each with `quantity` from 1 to its room
 */
export function addsWithinCopyLimit<Card extends CopiesRow>(
  cards: readonly Card[],
  rows: readonly CopiesRow[],
  rule: CopyLimitDeck
): readonly Card[] {
  const slotAdds = cards
    .filter((card) => commandSlotOf(card) !== null)
    .map((card) => cardWithinCopyLimit(card, rule));
  const counted: CopiesRow[] = [...rows, ...slotAdds];
  const stored: Card[] = [];
  for (const card of cards) {
    if (commandSlotOf(card) !== null) {
      stored.push(cardWithinCopyLimit(card, rule));
      continue;
    }
    const allowed = copiesAllowed({ row: card, held: 0 }, counted, rule);
    if (allowed < 1) continue;
    const added = {
      ...card,
      quantity: copiesWithinLimit(card.quantity, allowed),
    };
    stored.push(added);
    counted.push(added);
  }
  return stored;
}

/**
 * The resizes of a write, each within the room the deck has left. Lowerings
 * are weighed first, so a row lowered in the same write frees its copies for
 * a row raised in it; a raise then stops at the room left, and never below
 * the copies the row held. A change naming a row the deck does not hold passes
 * unchanged: the write refuses it as stale.
 *
 * @param changes - The new copies, by row id
 * @param rows - The rows the deck holds when they are resized
 * @param rule - The deck's copy-limit facts
 * @returns The changes, in order, with the copies to store
 */
export function resizesWithinCopyLimit(
  changes: readonly CopiesChange[],
  rows: readonly StoredCopiesRow[],
  rule: CopyLimitDeck
): readonly CopiesChange[] {
  const held = new Map(rows.map((row) => [row.id, row.quantity]));
  const isRaise = (change: CopiesChange) =>
    change.quantity > (held.get(change.cardId) ?? Number.POSITIVE_INFINITY);
  const ordered = [
    ...changes.filter((change) => !isRaise(change)),
    ...changes.filter(isRaise),
  ];
  let deck = rows;
  const stored = new Map<CopiesChange, number>();
  for (const change of ordered) {
    const row = deck.find((candidate) => candidate.id === change.cardId);
    if (row === undefined) continue;
    const others = deck.filter((candidate) => candidate !== row);
    const allowed = copiesAllowed({ row, held: row.quantity }, others, rule);
    const quantity = copiesWithinLimit(change.quantity, allowed);
    stored.set(change, quantity);
    deck = [...others, { ...row, quantity }];
  }
  return changes.map((change) => {
    const quantity = stored.get(change);
    return quantity === undefined ? change : { ...change, quantity };
  });
}

/**
 * The rows a write leaves before it resizes or adds: the stored rows less the
 * rows it removes by id and the rows that fill the slots it clears.
 *
 * @param rows - The deck's stored rows
 * @param removal - The row ids and the command-zone slots the write empties
 * @returns The rows that stay, in order
 */
function rowsLeftBy<Row extends StoredCopiesRow>(
  rows: readonly Row[],
  removal: RowsRemoval
): readonly Row[] {
  const removed = new Set(removal.removeCardIds);
  return rows.filter(
    (row) =>
      !removed.has(row.id) &&
      !removal.clearSlots.some((slot) => rowFillsCommandSlot(row, slot))
  );
}

/** The rows a write removes by id and the command-zone slots it empties. */
export interface RowsRemoval {
  readonly removeCardIds: readonly string[];
  readonly clearSlots: readonly CommandSlot[];
}

/** A write's row changes: removals first, then resizes, then adds. */
export interface RowsWrite<Card extends CopiesRow> extends RowsRemoval {
  readonly quantityChanges: readonly CopiesChange[];
  readonly addCards: readonly Card[];
}

/** The rows with the copies the changes give them. */
function withResizes<Row extends StoredCopiesRow>(
  rows: readonly Row[],
  changes: readonly CopiesChange[]
): readonly Row[] {
  const resized = new Map(
    changes.map((change) => [change.cardId, change.quantity])
  );
  return rows.map((row) => {
    const quantity = resized.get(row.id);
    return quantity === undefined ? row : { ...row, quantity };
  });
}

/**
 * A write's resizes and adds, within the room the deck has left once its
 * removals are done: the rows it removes free their copies first, then the
 * resizes are weighed (`resizesWithinCopyLimit`), then the adds
 * (`addsWithinCopyLimit`) against the deck as resized.
 *
 * @param write - The rows the write removes, resizes and adds
 * @param rows - Every stored row of the deck
 * @param rule - The deck's copy-limit facts
 * @returns The resizes and the adds to store
 */
export function rowsWriteWithinCopyLimit<Card extends CopiesRow>(
  write: RowsWrite<Card>,
  rows: readonly StoredCopiesRow[],
  rule: CopyLimitDeck
): Pick<RowsWrite<Card>, "quantityChanges" | "addCards"> {
  const left = rowsLeftBy(rows, write);
  const quantityChanges = resizesWithinCopyLimit(
    write.quantityChanges,
    left,
    rule
  );
  return {
    quantityChanges,
    addCards: addsWithinCopyLimit(
      write.addCards,
      withResizes(left, quantityChanges),
      rule
    ),
  };
}

/** The edit of one row: a new zone, new copies, or both, beside other columns. */
export interface CopiesEdit {
  readonly zone?: string;
  readonly quantity?: number;
}

/** A stored deck as the copy limit reads it: its rule and every row it holds. */
export interface CopyRuleDeck {
  /** The deck's format and its commanders' rulebreaker exceptions (CR 903.5e) */
  readonly copyRule: CopyLimitDeck;
  /** Every stored row, every zone, command zone included */
  readonly rows: readonly StoredCopiesRow[];
}

/**
 * One row's edit within the room the deck has left. An edit that names
 * neither copies nor a zone passes unchanged. A row that moves from
 * Considering into the deck brings all its copies, so it is weighed as a new
 * row; a move between the main deck and the sideboard keeps the copies it
 * held.
 *
 * @param edit - The columns to write; absent `zone` and `quantity` keep the stored ones
 * @param row - The stored row the edit changes
 * @param deck - The deck's copy rule and every stored row, `row` included
 * @returns The edit with `quantity` from 1 to the room, or `null` when the
 *   deck has no room for a single copy where the edit puts the row
 */
export function editWithinCopyRoom<Edit extends CopiesEdit>(
  edit: Edit,
  row: StoredCopiesRow,
  { copyRule, rows }: CopyRuleDeck
): Edit | null {
  if (edit.quantity === undefined && edit.zone === undefined) return edit;
  const edited = {
    ...row,
    zone: edit.zone ?? row.zone,
    quantity: edit.quantity ?? row.quantity,
  };
  const others = rows.filter((candidate) => candidate.id !== row.id);
  const held = isWeighed(row) && isWeighed(edited) ? row.quantity : 0;
  const allowed = copiesAllowed({ row: edited, held }, others, copyRule);
  if (allowed < 1) return null;
  const quantity = copiesWithinLimit(edited.quantity, allowed);
  if (quantity === row.quantity && edit.quantity === undefined) return edit;
  return { ...edit, quantity };
}
