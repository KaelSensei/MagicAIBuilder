/**
 * The player's collection as a CSV file, one row per printing.
 *
 * Collection context. `CollectionPageClient` downloads it as
 * `my-collection.csv`.
 *
 * @module collection/printing-csv
 */

import { csvText } from "@/lib/csv";
import type { CollectionExportCard } from "./shopping-list";

export interface CollectionPrintingExportCard extends CollectionExportCard {
  readonly scryfallId: string;
}

/**
 * Export collection rows with a stable printing identifier for later matching.
 *
 * Names and printing IDs go through `csvText`, so a name that starts like a
 * formula is exported as text. The condition column is written as it is: it
 * holds one of the five condition codes (`NM` to `DMG`) or nothing.
 */
export function formatCollectionPrintingCsv(
  cards: readonly CollectionPrintingExportCard[]
): string {
  const header = "Name,Quantity,Foil,Condition,Price (USD),Scryfall ID";
  const rows = cards.map(
    (card) =>
      `${csvText(card.name)},${card.quantity},${card.foil ? "Yes" : "No"},${card.condition ?? ""},${card.price ?? ""},${csvText(card.scryfallId)}`
  );
  return [header, ...rows].join("\n");
}
