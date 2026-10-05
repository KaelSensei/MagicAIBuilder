import type { UrlImportResult } from "./url-import";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { buildScryfallNameIndex, normalizeImportedName } from "@/lib/scryfall/name-index";

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
 * @param foundCards - cards resolved by Scryfall before confirmation
 * @returns deterministic import preview data for the confirmation step
 */
export function buildImportPreview(
  result: UrlImportResult,
  foundCards: readonly ScryfallCard[]
): ImportPreview {
  const zoneCounts = { main: 0, sideboard: 0, maybeboard: 0 };
  const entryCounts = new Map<string, { name: string; count: number }>();
  const foundByName = buildScryfallNameIndex(foundCards);
  const ignoredNames = new Map<string, string>();
  for (const name of result.ignored) {
    const key = normalizeImportedName(name);
    if (!ignoredNames.has(key)) ignoredNames.set(key, name);
  }
  const commanderNames: string[] = [];
  const partnerNames: string[] = [];
  let totalQuantity = 0;

  for (const card of result.cards) {
    const key = normalizeImportedName(card.name);
    if (!foundByName.has(key) && !ignoredNames.has(key)) ignoredNames.set(key, card.name);
    zoneCounts[card.zone] += card.quantity;
    totalQuantity += card.quantity;
    if (card.isCommander) commanderNames.push(card.name);
    if (card.isPartner) partnerNames.push(card.name);
    const duplicateKey = normalizeImportedName(foundByName.get(key)?.name ?? card.name);
    const previous = entryCounts.get(duplicateKey);
    entryCounts.set(duplicateKey, {
      name: previous?.name ?? card.name,
      count: (previous?.count ?? 0) + 1,
    });
  }

  const duplicateNames = [...entryCounts.values()]
    .filter(({ count }) => count > 1)
    .map(({ name }) => name);

  return {
    name: result.name,
    source: result.source,
    commanderNames,
    partnerNames,
    zoneCounts,
    totalQuantity,
    duplicateNames,
    ignoredNames: [...ignoredNames.values()],
  };
}
