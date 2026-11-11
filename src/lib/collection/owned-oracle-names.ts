/**
 * Which Oracle cards a player owns, whatever printing they own them in.
 *
 * Collection context. A collection row records one printing (a Scryfall printing id and the
 * card's English name), not an Oracle id, so ownership of an Oracle card is decided by name:
 * every printing of a card carries its Oracle name, and Scryfall gives each Oracle card its own
 * English name. A multi-face card is known by its front face, because a name may arrive as
 * "Front // Back" or as "Front" alone.
 * Used by the "Collection only" search filter (`hooks/useCardSearchResults.ts`).
 * Not responsible for copy counts per printing: `shopping-list.ts` covers a deck by printing.
 *
 * @module collection/owned-oracle-names
 */
import {
  normalizeImportedName,
  scryfallCollectionLookupName,
} from "@/lib/scryfall/name-index";

/** Oracle name keys of the cards a player owns at least one copy of. */
export type OwnedOracleNames = ReadonlySet<string>;

/**
 * The key that identifies a card's Oracle identity by name.
 *
 * Case, curly apostrophes and repeated spaces do not matter; a multi-face name is reduced to its
 * front face, so "Esika, God of the Tree // The Prismatic Bridge" and "Esika, God of the Tree"
 * give the same key.
 */
export function oracleNameKey(name: string): string {
  return normalizeImportedName(scryfallCollectionLookupName(name));
}

/**
 * The Oracle cards behind a player's collection rows. Foil and non-foil rows count alike; a row
 * with quantity 0 owns nothing.
 */
export function ownedOracleNames(
  rows: Iterable<{ readonly name: string; readonly quantity: number }>
): OwnedOracleNames {
  const owned = new Set<string>();
  for (const row of rows) {
    if (row.quantity > 0) owned.add(oracleNameKey(row.name));
  }
  return owned;
}

/** Whether the player owns some printing of this card. */
export function isOwnedOracleCard(
  card: { readonly name: string },
  owned: OwnedOracleNames
): boolean {
  return owned.has(oracleNameKey(card.name));
}
