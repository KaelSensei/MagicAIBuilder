/**
 * Compares two decks: the cards they share or not, and deck-level signals
 * (curve, price, colours, strategic roles).
 *
 * The price is the price of the deck you play, by the builder's own rules
 * (`partitionApiCards` for the command zone, `playedDeckCards` for the rest),
 * so the comparison and the builder's total agree on the same deck (I-37).
 *
 * @module deck/comparison
 */
import { playedDeckCards } from "./played-deck-cards";
import { partitionApiCards } from "./store-factories";
import type { CardCategory, DeckZone } from "./types";

export interface ComparableDeckCard {
  readonly scryfallId?: string;
  readonly name: string;
  readonly quantity: number;
}

/**
 * One deck row as a deck API sends it. The zone and the command-zone flags
 * place it in the deck you play; an absent one reads as its column default
 * (`prisma/schema.prisma`: zone "main", not a commander, not a partner). The
 * public allowlist (`PUBLIC_DECK_CARD_SELECT`) sends no zone.
 */
export interface ComparableDeckProfileCard extends ComparableDeckCard {
  readonly cmc: number;
  readonly price: number | null;
  readonly colorIdentity: readonly string[];
  readonly category: CardCategory;
  readonly zone?: DeckZone;
  readonly isCommander?: boolean;
  readonly isPartner?: boolean;
}

export type StrategicCardRole = Extract<
  CardCategory,
  "ramp" | "draw" | "removal" | "boardWipe" | "protection" | "winCondition"
>;

export interface DeckRoleDifference {
  readonly role: StrategicCardRole;
  readonly leftQuantity: number;
  readonly rightQuantity: number;
}

export interface DeckProfileComparison {
  readonly leftAverageCmc: number;
  readonly rightAverageCmc: number;
  readonly leftPrice: number;
  readonly rightPrice: number;
  readonly onlyLeftColors: readonly string[];
  readonly onlyRightColors: readonly string[];
  readonly roleDifferences: readonly DeckRoleDifference[];
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
const STRATEGIC_ROLE_ORDER: readonly StrategicCardRole[] = [
  "ramp",
  "draw",
  "removal",
  "boardWipe",
  "protection",
  "winCondition",
];

function isStrategicRole(
  category: CardCategory
): category is StrategicCardRole {
  return (
    category === "ramp" ||
    category === "draw" ||
    category === "removal" ||
    category === "boardWipe" ||
    category === "protection" ||
    category === "winCondition"
  );
}

interface DeckProfileTotals {
  readonly averageCmc: number;
  readonly price: number;
  readonly colors: ReadonlySet<string>;
  readonly roles: ReadonlyMap<StrategicCardRole, number>;
}

function roundMetric(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A row with its zone and command-zone flags read, absent ones as their column defaults. */
function withStoredDefaults(card: ComparableDeckProfileCard) {
  return {
    ...card,
    zone: card.zone ?? "main",
    isCommander: card.isCommander ?? false,
    isPartner: card.isPartner ?? false,
  };
}

/**
 * The price of the deck you play: the commander, the partner and the main
 * deck, as the builder totals it (`useDeckPrice`).
 *
 * CR 903.5a: a Commander deck counts its commander among its cards. CR 100.4:
 * a sideboard is held outside the deck; Considering is the builder's
 * shortlist, not a game zone. CR 702.139a: a companion starts outside the
 * game, so it is not part of the deck either.
 */
function playedDeckPrice(cards: readonly ComparableDeckProfileCard[]): number {
  const { commanderCard, partnerCard, deckCards } = partitionApiCards(
    cards.map(withStoredDefaults)
  );
  const played = playedDeckCards({
    commander: commanderCard,
    partner: partnerCard,
    cards: deckCards,
  });
  let price = 0;
  for (const card of played) {
    price += Math.max(0, card.price ?? 0) * Math.max(0, card.quantity);
  }
  return roundMetric(price);
}

function profileTotals(
  cards: readonly ComparableDeckProfileCard[]
): DeckProfileTotals {
  let quantity = 0;
  let totalCmc = 0;
  const colors = new Set<string>();
  const roles = new Map<StrategicCardRole, number>();

  for (const card of cards) {
    const cardQuantity = Math.max(0, card.quantity);
    quantity += cardQuantity;
    totalCmc += Math.max(0, card.cmc) * cardQuantity;
    for (const color of card.colorIdentity) colors.add(color);
    if (isStrategicRole(card.category)) {
      roles.set(card.category, (roles.get(card.category) ?? 0) + cardQuantity);
    }
  }

  return {
    averageCmc: quantity === 0 ? 0 : roundMetric(totalCmc / quantity),
    price: playedDeckPrice(cards),
    colors,
    roles,
  };
}

/**
 * Compare deterministic deck-level signals that explain why two lists play differently.
 *
 * Each price counts the deck you play only: the commander, the partner and
 * the main deck. The curve, colours and roles still read every row given.
 *
 * @param left Every row of the first deck, in any zone.
 * @param right Every row of the second deck, in any zone.
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
    roleDifferences: STRATEGIC_ROLE_ORDER.flatMap((role) => {
      const leftQuantity = leftProfile.roles.get(role) ?? 0;
      const rightQuantity = rightProfile.roles.get(role) ?? 0;
      return leftQuantity === rightQuantity
        ? []
        : [{ role, leftQuantity, rightQuantity }];
    }),
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
