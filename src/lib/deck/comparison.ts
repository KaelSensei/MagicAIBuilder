export interface ComparableDeckCard {
  readonly scryfallId?: string;
  readonly name: string;
  readonly quantity: number;
}

export interface ComparableDeckProfileCard {
  readonly name: string;
  readonly quantity: number;
  readonly cmc: number;
  readonly price: number | null;
  readonly colorIdentity: readonly string[];
}

export interface DeckProfileComparison {
  readonly leftAverageCmc: number;
  readonly rightAverageCmc: number;
  readonly leftPrice: number;
  readonly rightPrice: number;
  readonly onlyLeftColors: readonly string[];
  readonly onlyRightColors: readonly string[];
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

function aggregateCards(
  cards: readonly ComparableDeckCard[]
): Map<string, AggregatedCard> {
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

function byName<T extends { readonly name: string }>(
  left: T,
  right: T
): number {
  return left.name.localeCompare(right.name);
}

const COLOR_ORDER = ["W", "U", "B", "R", "G", "C"] as const;

interface DeckProfileTotals {
  readonly averageCmc: number;
  readonly price: number;
  readonly colors: ReadonlySet<string>;
}

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}

function profileTotals(
  cards: readonly ComparableDeckProfileCard[]
): DeckProfileTotals {
  let quantity = 0;
  let totalCmc = 0;
  let price = 0;
  const colors = new Set<string>();

  for (const card of cards) {
    const cardQuantity = Math.max(0, card.quantity);
    quantity += cardQuantity;
    totalCmc += Math.max(0, card.cmc) * cardQuantity;
    price += Math.max(0, card.price ?? 0) * cardQuantity;
    for (const color of card.colorIdentity) colors.add(color);
  }

  return {
    averageCmc: quantity === 0 ? 0 : roundMetric(totalCmc / quantity),
    price: roundMetric(price),
    colors,
  };
}

/**
 * Compare deterministic deck-level signals that explain why two lists play differently.
 *
 * @param left Cards in the first deck.
 * @param right Cards in the second deck.
 * @returns Weighted curve, price, and color-identity differences.
 */
export function compareDeckProfiles(
  left: readonly ComparableDeckProfileCard[],
  right: readonly ComparableDeckProfileCard[]
): DeckProfileComparison {
  const leftProfile = profileTotals(left);
  const rightProfile = profileTotals(right);

  return {
    leftAverageCmc: leftProfile.averageCmc,
    rightAverageCmc: rightProfile.averageCmc,
    leftPrice: leftProfile.price,
    rightPrice: rightProfile.price,
    onlyLeftColors: COLOR_ORDER.filter(
      (color) =>
        leftProfile.colors.has(color) && !rightProfile.colors.has(color)
    ),
    onlyRightColors: COLOR_ORDER.filter(
      (color) =>
        rightProfile.colors.has(color) && !leftProfile.colors.has(color)
    ),
  };
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
