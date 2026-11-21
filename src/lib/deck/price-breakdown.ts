/**
 * The deck's price broken down for the deck list: the subtotal of one group
 * of rows, and the deck total without its basic lands (I-32 requirement 2.5,
 * the "card category" part of slice 3).
 *
 * Pure: it reads the one USD price per row the deck already stores
 * (`DeckCard.price`, from Scryfall) and makes no request. A row without a
 * price is never counted as $0 silently; its copies are counted apart, as
 * I-32 requirement 2.4 asks and as the buy list words a known subtotal.
 *
 * @module deck/price-breakdown
 */
import { isBasicLand } from "@/lib/scryfall/type-line";
import type { DeckCard } from "@/lib/deck/types";

/** The rows a price breakdown reads: a price per copy, a quantity and a type line. */
type PricedRow = Pick<DeckCard, "price" | "quantity" | "typeLine">;

/**
 * What a group of rows is worth.
 *
 * - `priced`: every row has a price (an empty group is worth $0.00).
 * - `partial`: some rows have a price; `knownSubtotal` sums those, and
 *   `unpricedCopies` counts the copies without one.
 * - `unpriced`: no row has a price, so there is no amount to show.
 */
export type GroupPrice =
  | { readonly kind: "priced"; readonly subtotal: number }
  | {
      readonly kind: "partial";
      readonly knownSubtotal: number;
      readonly unpricedCopies: number;
    }
  | { readonly kind: "unpriced"; readonly unpricedCopies: number };

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Sums quantity × price over the priced rows and rounds once, at the end. */
function knownTotal(rows: readonly PricedRow[]): number {
  let total = 0;
  for (const row of rows) {
    if (row.price !== null) total += row.price * row.quantity;
  }
  return roundToCents(total);
}

/**
 * The price of one group of the deck list.
 *
 * @param rows - the group's rows; a row's `price` is per copy, in USD, or null when unknown
 * @returns the subtotal, rounded to cents once, and how many copies have no price
 */
export function groupPrice(rows: readonly PricedRow[]): GroupPrice {
  let pricedRows = 0;
  let unpricedCopies = 0;
  for (const row of rows) {
    if (row.price === null) unpricedCopies += row.quantity;
    else pricedRows += 1;
  }

  if (unpricedCopies === 0)
    return { kind: "priced", subtotal: knownTotal(rows) };
  if (pricedRows === 0) return { kind: "unpriced", unpricedCopies };
  return { kind: "partial", knownSubtotal: knownTotal(rows), unpricedCopies };
}

/**
 * The known total of the given rows without their basic lands: what a player
 * who already owns a box of basics would pay.
 *
 * CR 205.4c: a land is basic when it has the basic supertype, so
 * Snow-Covered Forest and Wastes are left out and Dryad Arbor is kept
 * (`isBasicLand`). Unpriced rows add nothing, as in the deck total.
 *
 * @param rows - the rows the deck total counts
 * @returns the total rounded to cents, or null when no row is a basic land,
 *   since the figure would only repeat the total
 */
export function totalWithoutBasicLands(
  rows: readonly PricedRow[]
): number | null {
  const nonBasicRows = rows.filter((row) => !isBasicLand(row.typeLine));
  if (nonBasicRows.length === rows.length) return null;
  return knownTotal(nonBasicRows);
}
