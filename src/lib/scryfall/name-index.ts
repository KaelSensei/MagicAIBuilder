import type { ScryfallCard } from "@/lib/scryfall/types";

function normalizeNameKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, " ");
}

function firstFaceName(name: string): string | null {
  const idx = name.indexOf(" // ");
  if (idx < 0) return null;
  const front = name.slice(0, idx).trim();
  return front ? front : null;
}

/**
 * Build a lookup map for resolving imported names to Scryfall cards.
 *
 * Scryfall uses full names for multi-part cards (e.g. "A // B"). Many deck
 * sources export only the front face ("A"). This index maps both variants.
 *
 * @param cards Scryfall cards returned from collection/search APIs
 * @returns Map of normalized name keys to card objects
 */
export function buildScryfallNameIndex(
  cards: readonly ScryfallCard[]
): ReadonlyMap<string, ScryfallCard> {
  const index = new Map<string, ScryfallCard>();

  for (const card of cards) {
    index.set(normalizeNameKey(card.name), card);

    const frontFromFull = firstFaceName(card.name);
    if (frontFromFull) index.set(normalizeNameKey(frontFromFull), card);

    const face0 = card.card_faces?.[0]?.name;
    if (face0 && face0.trim()) index.set(normalizeNameKey(face0), card);
  }

  return index;
}

/**
 * Normalize an imported card name to the lookup key used by `buildScryfallNameIndex`.
 *
 * @param importedName Raw card name from import sources
 * @returns Normalized key used for matching
 */
export function normalizeImportedName(importedName: string): string {
  return normalizeNameKey(importedName);
}

