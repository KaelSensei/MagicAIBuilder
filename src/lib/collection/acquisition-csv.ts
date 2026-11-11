/**
 * The acquisition plan as a CSV file: what to buy, per printing, and which
 * decks each copy is for.
 *
 * Collection context. `AcquisitionPlanPanel` (every deck) and
 * `ShoppingListModal` (one deck's "buy now" list) download it.
 *
 * @module collection/acquisition-csv
 */

import { csvText } from "@/lib/csv";
import type { ShoppingListItem } from "./shopping-list";

interface DeckAllocation {
  readonly name: string;
  readonly quantity: number;
}

interface AcquisitionCsvItem extends ShoppingListItem {
  readonly deckAllocations?: readonly DeckAllocation[];
}

/**
 * Export acquisition quantities with the exact printing ID used by the deck.
 *
 * One row per printing. The line total is rounded to the cent and left blank,
 * like the unit price, when the price is unknown. Text cells go through
 * `csvText`, so a card or deck name that starts like a formula (`=1+1`) is
 * exported as text: deck names are chosen by the player.
 */
export function formatAcquisitionCsv(items: readonly AcquisitionCsvItem[]): string {
  const header = "Name,Quantity,Price (USD),Total (USD),Scryfall ID,Deck allocations";
  const rows = items.map((item) => {
    const lineTotal =
      item.price === null ? "" : Math.round(item.price * item.quantity * 100) / 100;
    const allocations = (item.deckAllocations ?? [])
      .map((deck) => `${deck.name} (${deck.quantity})`)
      .join("; ");
    return `${csvText(item.name)},${item.quantity},${item.price ?? ""},${lineTotal},${csvText(item.scryfallId)},${csvText(allocations)}`;
  });
  return [header, ...rows].join("\n");
}
