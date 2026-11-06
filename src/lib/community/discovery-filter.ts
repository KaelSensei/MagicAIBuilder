/** The fields a discovery row can be matched against. */
export interface DiscoveryFilterDeck {
  readonly name: string;
  readonly commander: { readonly name: string };
}

/**
 * Filters an already loaded discovery list by deck or commander name.
 *
 * @param decks - public decks for one commander page
 * @param query - the visitor's filter text
 * @returns decks whose name or commander contains the query
 */
export function filterDiscoveryDecks<T extends DiscoveryFilterDeck>(
  decks: readonly T[],
  query: string
): readonly T[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return decks;

  return decks.filter((deck) => {
    const name = deck.name.toLowerCase();
    const commander = deck.commander.name.toLowerCase();
    return name.includes(needle) || commander.includes(needle);
  });
}
