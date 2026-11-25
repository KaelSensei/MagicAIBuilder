/**
 * The deck's average mana value: the one rule the builder's statistics and the shared deck view
 * both read, so a deck shows the same average wherever it is opened (I-37).
 *
 * Deck analysis, pure. It reads the deck's own rows, the command zone already set apart: the
 * builder's `deck.cards`, or a shared deck's rows whose `commandSlotOf` is null.
 * Not responsible for: the mana curve's rows (`curve-breakdown.ts`), which count the commanders.
 *
 * @module deck/average-mana-value
 */

/** The fields of a deck row the average reads; the store's and the share link's rows both fit. */
export interface ManaValueRow {
  readonly zone: string;
  readonly category: string;
  readonly cmc: number;
  readonly quantity: number;
}

/**
 * Whether a row's copies count in the average: a main-deck row not filed as a land.
 *
 * Considering and the sideboard are not the deck you play (CR 100.4: a sideboard is held outside
 * the deck; Considering is the builder's shortlist, not a game zone). Lands are left out by
 * category so the average describes the spells you cast.
 */
function countsInAverage(row: ManaValueRow): boolean {
  return row.zone === "main" && row.category !== "land";
}

/**
 * The average mana value per copy of the deck's nonland main-deck rows, rounded to hundredths.
 *
 * The rows must not hold the command zone: CR 903.6 puts the commander in the command zone at the
 * start of the game, and CR 702.139a keeps the companion outside the game, so neither is drawn.
 *
 * @param rows - the deck's own rows, without the commander, partner or companion
 * @returns the average, or 0 when no row counts
 */
export function averageManaValue(rows: readonly ManaValueRow[]): number {
  let manaValue = 0;
  let copies = 0;
  for (const row of rows) {
    if (!countsInAverage(row)) continue;
    manaValue += row.cmc * row.quantity;
    copies += row.quantity;
  }
  return copies > 0 ? Math.round((manaValue / copies) * 100) / 100 : 0;
}
