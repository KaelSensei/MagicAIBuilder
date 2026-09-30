import type { ShoppingListItem } from "./shopping-list";

function csvText(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

/** Export acquisition quantities with the exact printing ID used by the deck. */
export function formatAcquisitionCsv(items: readonly ShoppingListItem[]): string {
  const header = "Name,Quantity,Price (USD),Total (USD),Scryfall ID";
  const rows = items.map((item) => {
    const lineTotal = item.price === null ? "" : item.price * item.quantity;
    return `${csvText(item.name)},${item.quantity},${item.price ?? ""},${lineTotal},${csvText(item.scryfallId)}`;
  });
  return [header, ...rows].join("\n");
}
