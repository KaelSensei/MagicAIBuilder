export interface CurrentCardImpactInput {
  readonly name: string;
  readonly quantity: number;
  readonly manaValue: number;
  readonly priceUsd: number | null;
}

export interface AdditionImpactInput {
  readonly name: string;
  readonly manaValue: number | null;
  readonly priceUsd: number | null;
  readonly colorCompatible: boolean | null;
  readonly commanderLegal: boolean | null;
  readonly verified: boolean;
}

interface ImpactSnapshot {
  readonly cards: number;
  readonly averageManaValue: number;
  readonly knownPriceUsd: number;
}

export interface SuggestionImpact {
  readonly before: ImpactSnapshot;
  readonly after: ImpactSnapshot;
  readonly unverifiedAdditions: number;
  readonly incompatibleAdditions: readonly string[];
  readonly illegalAdditions: readonly string[];
}

interface MutableTotals {
  cards: number;
  knownManaCards: number;
  manaValue: number;
  knownPriceUsd: number;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function snapshot(totals: MutableTotals): ImpactSnapshot {
  return {
    cards: totals.cards,
    averageManaValue:
      totals.knownManaCards === 0
        ? 0
        : round(totals.manaValue / totals.knownManaCards),
    knownPriceUsd: round(totals.knownPriceUsd),
  };
}

/** Projects deterministic deck metrics for a reviewed AI change set. */
export function buildSuggestionImpact(
  currentCards: readonly CurrentCardImpactInput[],
  additions: readonly AdditionImpactInput[],
  removalNames: readonly string[]
): SuggestionImpact {
  const totals: MutableTotals = {
    cards: 0,
    knownManaCards: 0,
    manaValue: 0,
    knownPriceUsd: 0,
  };
  const cardsByName = new Map<string, CurrentCardImpactInput>();
  for (const card of currentCards) {
    cardsByName.set(card.name, card);
    totals.cards += card.quantity;
    totals.knownManaCards += card.quantity;
    totals.manaValue += card.manaValue * card.quantity;
    totals.knownPriceUsd += (card.priceUsd ?? 0) * card.quantity;
  }
  const before = snapshot(totals);
  for (const name of new Set(removalNames)) {
    const card = cardsByName.get(name);
    if (!card) continue;
    totals.cards -= card.quantity;
    totals.knownManaCards -= card.quantity;
    totals.manaValue -= card.manaValue * card.quantity;
    totals.knownPriceUsd -= (card.priceUsd ?? 0) * card.quantity;
  }
  for (const addition of additions) {
    totals.cards += 1;
    if (addition.manaValue !== null) {
      totals.knownManaCards += 1;
      totals.manaValue += addition.manaValue;
    }
    totals.knownPriceUsd += addition.priceUsd ?? 0;
  }
  return {
    before,
    after: snapshot(totals),
    unverifiedAdditions: additions.filter((addition) => !addition.verified)
      .length,
    incompatibleAdditions: additions
      .filter((addition) => addition.colorCompatible === false)
      .map((addition) => addition.name),
    illegalAdditions: additions
      .filter((addition) => addition.commanderLegal === false)
      .map((addition) => addition.name),
  };
}
