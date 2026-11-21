/**
 * Which of a player's decks pass a card filter: the decks that run every
 * included card and none of the excluded ones (I-01, the library filter line
 * of `docs/product/specs/i01-deck-editor-workflow.md`).
 *
 * Deck-building context, pure. A deck runs a card when a row it commits
 * names it: the main deck or the command zone, as the commitment index counts
 * copies (`lib/collection/commitment-index.ts`). A row in Considering or the
 * sideboard does not run the card. A name is matched whole and without regard
 * to case, as the full name or the front face of a multi-face card, so a
 * partial name never matches.
 * Not responsible for: reading rows, parsing the filter (I-75's query
 * contract does) or ordering the decks.
 *
 * @module deck/deck-card-filter
 */
import { commits, type CommittingRow } from "@/lib/collection/commitment-index";
import type { DeckSearchCardFilters } from "@/lib/community/deck-search-query";

/**
 * The card names a library search includes (`all`: the deck runs each one)
 * and excludes (`none`: the deck runs none of them), as I-75's query
 * contract names them.
 */
export type DeckCardFilter = Pick<DeckSearchCardFilters, "all" | "none">;

/** One stored card row of a deck, with what the filter reads. */
export interface DeckCardFilterRow extends CommittingRow {
  readonly deckId: string;
  readonly name: string;
  /** Copies on the row; a row of zero copies runs nothing, as in the index. */
  readonly quantity: number;
}

/**
 * How a stored name separates the faces of a multi-face card
 * ("Fable of the Mirror-Breaker // Reflection of Kiki-Jiki").
 */
const FACE_SEPARATOR = " // ";

/**
 * @param filter - a card filter
 * @returns every name the filter mentions, included or excluded
 */
export function cardFilterNames(filter: DeckCardFilter): readonly string[] {
  return [...filter.all, ...filter.none];
}

/**
 * Whether a stored row names a card: the whole name, or the front face of a
 * multi-face card, ignoring case.
 *
 * @param rowName - the row's stored name
 * @param cardName - the name the player typed, already trimmed
 * @returns true for "Sol Ring" against "sol ring", false against "Sol"
 */
export function namesCard(rowName: string, cardName: string): boolean {
  const row = rowName.toLowerCase();
  const card = cardName.toLowerCase();
  return row === card || row.startsWith(card + FACE_SEPARATOR);
}

/**
 * Keeps the decks that run every included card and no excluded card.
 *
 * @param deckIds - the decks to filter, in the order to keep
 * @param rows - card rows of those decks; rows of other decks are ignored
 * @param filter - the included and excluded names
 * @returns the passing deck ids, in the order of `deckIds`
 */
export function decksPassingCardFilter(
  deckIds: readonly string[],
  rows: readonly DeckCardFilterRow[],
  filter: DeckCardFilter
): readonly string[] {
  const names = cardFilterNames(filter);
  const run = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!commits(row) || row.quantity === 0) continue;
    const held = run.get(row.deckId) ?? new Set<string>();
    for (const name of names) {
      if (namesCard(row.name, name)) held.add(name);
    }
    run.set(row.deckId, held);
  }
  return deckIds.filter((deckId) => {
    const held = run.get(deckId);
    return (
      filter.all.every((name) => held?.has(name) === true) &&
      !filter.none.some((name) => held?.has(name) === true)
    );
  });
}
