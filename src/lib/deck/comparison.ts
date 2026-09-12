export interface ComparableDeckCard {
  readonly scryfallId?: string;
  readonly name: string;
  readonly quantity: number;
}

export interface DeckComparisonCard {
  readonly key: string;
  readonly name: string;
  readonly quantity: number;
}

export interface SharedDeckComparisonCard {
  readonly key: string;
  readonly name: string;
  readonly leftQuantity: number;
  readonly rightQuantity: number;
}

export interface DeckCardComparison {
  readonly shared: readonly SharedDeckComparisonCard[];
  readonly onlyLeft: readonly DeckComparisonCard[];
  readonly onlyRight: readonly DeckComparisonCard[];
  readonly quantityChanges: readonly SharedDeckComparisonCard[];
}

interface AggregatedCard {
  readonly normalizedName: string;
  readonly scryfallId?: string;
  readonly name: string;
  quantity: number;
}

function normalizeCardName(name: string): string {
  return name.trim().replaceAll(/\s+/g, " ").toLocaleLowerCase("en");
}

function aggregateCards(cards: readonly ComparableDeckCard[]): Map<string, AggregatedCard> {
  const result = new Map<string, AggregatedCard>();
  for (const card of cards) {
    const normalizedName = normalizeCardName(card.name);
    const existing = result.get(normalizedName);
    if (existing) {
      existing.quantity += card.quantity;
      continue;
    }
    result.set(normalizedName, {
      normalizedName,
      scryfallId: card.scryfallId,
      name: card.name.trim().replaceAll(/\s+/g, " "),
      quantity: card.quantity,
    });
  }
  return result;
}

function comparisonKey(left: AggregatedCard, right?: AggregatedCard): string {
  if (left.scryfallId && (!right || left.scryfallId === right.scryfallId)) {
    return left.scryfallId;
  }
  return left.normalizedName;
}

function byName<T extends { readonly name: string }>(left: T, right: T): number {
  return left.name.localeCompare(right.name);
}

/**
 * Compare two deck card lists by oracle identity rather than printing identity.
 *
 * @param left Cards in the first deck.
 * @param right Cards in the second deck.
 * @returns Stable groups for shared cards, exclusive cards, and quantity changes.
 */
export function compareDeckCards(
  left: readonly ComparableDeckCard[],
  right: readonly ComparableDeckCard[]
): DeckCardComparison {
  const leftCards = aggregateCards(left);
  const rightCards = aggregateCards(right);
  const shared: SharedDeckComparisonCard[] = [];
  const onlyLeft: DeckComparisonCard[] = [];
  const onlyRight: DeckComparisonCard[] = [];

  for (const [normalizedName, leftCard] of leftCards) {
    const rightCard = rightCards.get(normalizedName);
    if (!rightCard) {
      onlyLeft.push({
        key: comparisonKey(leftCard),
        name: leftCard.name,
        quantity: leftCard.quantity,
      });
      continue;
    }
    shared.push({
      key: comparisonKey(leftCard, rightCard),
      name: leftCard.name,
      leftQuantity: leftCard.quantity,
      rightQuantity: rightCard.quantity,
    });
  }

  for (const [normalizedName, rightCard] of rightCards) {
    if (!leftCards.has(normalizedName)) {
      onlyRight.push({
        key: comparisonKey(rightCard),
        name: rightCard.name,
        quantity: rightCard.quantity,
      });
    }
  }

  shared.sort(byName);
  onlyLeft.sort(byName);
  onlyRight.sort(byName);

  return {
    shared,
    onlyLeft,
    onlyRight,
    quantityChanges: shared.filter(
      (card) => card.leftQuantity !== card.rightQuantity
    ),
  };
}
