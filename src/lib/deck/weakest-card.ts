import type { DeckCard } from "./types";

export type WeakestCardCriterion =
  | "banned-card"
  | "unclassified-role"
  | "above-deck-curve";

export interface WeakestCardResult {
  readonly card: DeckCard;
  readonly criteria: readonly WeakestCardCriterion[];
}

interface ScoredCard {
  readonly card: DeckCard;
  readonly criteria: readonly WeakestCardCriterion[];
  readonly score: number;
}

/**
 * Identifies a locally observable mismatch without relying on an external model.
 *
 * @param cards - Cards currently in the deck's main zone.
 * @returns The highest-scoring candidate and the criteria that produced it.
 */
export function findWeakestCard(
  cards: readonly DeckCard[]
): WeakestCardResult | undefined {
  const mainCards = cards.filter((card) => card.zone === "main");
  if (mainCards.length === 0) return undefined;

  const totalCmc = mainCards.reduce(
    (sum, card) => sum + card.cmc * card.quantity,
    0
  );
  const totalQuantity = mainCards.reduce(
    (sum, card) => sum + card.quantity,
    0
  );
  const averageCmc = totalQuantity === 0 ? 0 : totalCmc / totalQuantity;

  let weakest: ScoredCard | undefined;
  for (const card of mainCards) {
    const criteria = criteriaFor(card, averageCmc);
    const candidate: ScoredCard = {
      card,
      criteria,
      score: criteriaScore(criteria),
    };
    if (isWeakerCandidate(candidate, weakest)) weakest = candidate;
  }

  if (weakest === undefined || weakest.criteria.length === 0) return undefined;
  return { card: weakest.card, criteria: weakest.criteria };
}

function criteriaFor(
  card: DeckCard,
  averageCmc: number
): readonly WeakestCardCriterion[] {
  const criteria: WeakestCardCriterion[] = [];
  if (card.isBanned) criteria.push("banned-card");
  if (card.category === "other") criteria.push("unclassified-role");
  if (card.cmc >= averageCmc + 2) criteria.push("above-deck-curve");
  return criteria;
}

function criteriaScore(criteria: readonly WeakestCardCriterion[]): number {
  return criteria.reduce((score, criterion) => {
    if (criterion === "banned-card") return score + 4;
    if (criterion === "unclassified-role") return score + 2;
    return score + 1;
  }, 0);
}

function isWeakerCandidate(
  candidate: ScoredCard,
  current: ScoredCard | undefined
): boolean {
  if (current === undefined) return true;
  if (candidate.score !== current.score) return candidate.score > current.score;
  if (candidate.card.cmc !== current.card.cmc)
    return candidate.card.cmc > current.card.cmc;
  return candidate.card.name < current.card.name;
}
