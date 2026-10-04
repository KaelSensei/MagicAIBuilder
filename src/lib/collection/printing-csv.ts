import type { CollectionExportCard } from "./shopping-list";

export interface CollectionPrintingExportCard extends CollectionExportCard {
  readonly scryfallId: string;
}

function csvText(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

/** Export collection rows with a stable printing identifier for later matching. */
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
