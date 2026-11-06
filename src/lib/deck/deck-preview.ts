/** A card the public preview can filter and picture. */
export interface DeckPreviewCard {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly imageUri: string;
}

/** How many card faces the preview strip shows before it scrolls. */
const DEFAULT_PREVIEW_LIMIT = 12;

/**
 * Keeps cards that belong to the selected category chip.
 *
 * @param cards - cards already loaded for the deck
 * @param category - `all`, or a category id
 * @returns the cards that stay visible
 */
export function filterCardsByCategory<T extends { readonly category: string }>(
  cards: readonly T[],
  category: string
): readonly T[] {
  if (category === "all") return cards;
  return cards.filter((card) => card.category === category);
}

/**
 * Chooses card faces for the imagery strip.
 *
 * @param cards - candidate cards in display order
 * @param limit - maximum faces to return
 * @returns cards that have an image, capped at `limit`
 */
export function previewCardImages<T extends { readonly imageUri: string }>(
  cards: readonly T[],
  limit = DEFAULT_PREVIEW_LIMIT
): readonly T[] {
  const pictured: T[] = [];
  for (const card of cards) {
    if (card.imageUri.length === 0) continue;
    pictured.push(card);
    if (pictured.length >= limit) break;
  }
  return pictured;
}
