import type { UrlImportResult } from "./url-import";

export interface ImportPreview {
  readonly name: string;
  readonly source: UrlImportResult["source"];
  readonly commanderNames: readonly string[];
  readonly partnerNames: readonly string[];
  readonly zoneCounts: Readonly<Record<"main" | "sideboard" | "maybeboard", number>>;
  readonly totalQuantity: number;
  readonly duplicateNames: readonly string[];
  readonly ignoredNames: readonly string[];
}

/**
 * Build a confirmation summary without modifying the active deck.
 *
 * @param result - normalized cards returned by an external importer
 * @returns deterministic import preview data for the confirmation step
 */
export function buildImportPreview(result: UrlImportResult): ImportPreview {
  const zoneCounts = { main: 0, sideboard: 0, maybeboard: 0 };
  const entryCounts = new Map<string, number>();
  const commanderNames: string[] = [];
  const partnerNames: string[] = [];
  let totalQuantity = 0;

  for (const card of result.cards) {
    zoneCounts[card.zone] += card.quantity;
    totalQuantity += card.quantity;
    if (card.isCommander) commanderNames.push(card.name);
    if (card.isPartner) partnerNames.push(card.name);
    if (!card.isCommander && !card.isPartner) {
      entryCounts.set(card.name, (entryCounts.get(card.name) ?? 0) + 1);
    }
  }

  const duplicateNames = [...entryCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name]) => name);

  return {
    name: result.name,
    source: result.source,
    commanderNames,
    partnerNames,
    zoneCounts,
    totalQuantity,
    duplicateNames,
    ignoredNames: [...result.ignored],
  };
}
