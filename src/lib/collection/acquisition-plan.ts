/**
 * Combined acquisition plan across several decks.
 *
 * Pure: it reports what is still missing and does not change ownership.
 */
import type { DeckCard } from "@/lib/deck/types";

/** One deck's share of a printing that still has to be acquired. */
export interface AcquisitionDeckRequirement {
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
}

/** A printing the collection does not yet cover across the selected decks. */
export interface AcquisitionPlanItem {
  readonly scryfallId: string;
  readonly name: string;
  readonly requiredQuantity: number;
  readonly ownedQuantity: number;
  readonly acquireQuantity: number;
  readonly price: number | null;
  readonly decks: readonly AcquisitionDeckRequirement[];
}

/** A deck reduced to the fields the plan reads. */
export interface AcquisitionPlanDeck {
  readonly id: string;
  readonly name: string;
  readonly cards: readonly AcquisitionPlanCard[];
  readonly commander: AcquisitionPlanCard | null;
  readonly partner: AcquisitionPlanCard | null;
}

/** Printing fields needed to count a deck toward the plan. */
export type AcquisitionPlanCard = Pick<
  DeckCard,
  "id" | "scryfallId" | "name" | "quantity" | "price" | "typeLine"
> & { readonly zone: string };

interface PendingRequirement {
  name: string;
  requiredQuantity: number;
  price: number | null;
  decks: AcquisitionDeckRequirement[];
}

interface DeckPrintingNeed {
  readonly card: AcquisitionPlanCard;
  readonly quantity: number;
}

/**
 * Sums one deck's non-basic mainboard, commander, and partner printings.
 *
 * @param deck - deck whose requirements are counted
 * @returns quantity needed per Scryfall id inside that deck
 */
function deckPrintingNeeds(deck: AcquisitionPlanDeck): ReadonlyMap<string, DeckPrintingNeed> {
  const perDeck = new Map<string, DeckPrintingNeed>();
  const cards = [
    deck.commander,
    deck.partner,
    ...deck.cards.filter((card) => card.zone === "main"),
  ];
  for (const card of cards) {
    if (card === null || card.typeLine.toLowerCase().includes("basic land")) continue;
    const scryfallId = card.scryfallId ?? card.id;
    const current = perDeck.get(scryfallId);
    perDeck.set(scryfallId, {
      card,
      quantity: (current?.quantity ?? 0) + card.quantity,
    });
  }
  return perDeck;
}

/**
 * Adds one deck's need onto the shared requirement for a printing.
 *
 * @param requirements - plan being built
 * @param deck - deck that needs the printing
 * @param scryfallId - printing id
 * @param requirement - quantity of that printing in the deck
 */
function addDeckRequirement(
  requirements: Map<string, PendingRequirement>,
  deck: AcquisitionPlanDeck,
  scryfallId: string,
  requirement: DeckPrintingNeed
): void {
  const entry = { id: deck.id, name: deck.name, quantity: requirement.quantity };
  const current = requirements.get(scryfallId);
  if (!current) {
    requirements.set(scryfallId, {
      name: requirement.card.name,
      requiredQuantity: requirement.quantity,
      price: requirement.card.price,
      decks: [entry],
    });
    return;
  }
  current.requiredQuantity += requirement.quantity;
  current.price ??= requirement.card.price;
  current.decks.push(entry);
}

/**
 * Turns a summed requirement into a buy line, or null when the collection covers it.
 *
 * @param scryfallId - printing id
 * @param requirement - summed need across decks
 * @param ownedQuantities - physical copies by printing id
 * @returns the plan line, or null when nothing remains to acquire
 */
function toPlanItem(
  scryfallId: string,
  requirement: PendingRequirement,
  ownedQuantities: Readonly<Record<string, number>>
): AcquisitionPlanItem | null {
  const ownedQuantity = Math.max(0, ownedQuantities[scryfallId] ?? 0);
  const acquireQuantity = Math.max(0, requirement.requiredQuantity - ownedQuantity);
  if (acquireQuantity === 0) return null;
  return {
    scryfallId,
    name: requirement.name,
    requiredQuantity: requirement.requiredQuantity,
    ownedQuantity,
    acquireQuantity,
    price: requirement.price,
    decks: requirement.decks,
  };
}

/**
 * Sorts priced lines by total cost descending, with unpriced lines last.
 *
 * @param left - first plan line
 * @param right - second plan line
 * @returns a sort comparator result
 */
function compareAcquisitionPlan(left: AcquisitionPlanItem, right: AcquisitionPlanItem): number {
  if (left.price === null && right.price === null) return left.name.localeCompare(right.name);
  if (left.price === null) return 1;
  if (right.price === null) return -1;
  const byCost = right.price * right.acquireQuantity - left.price * left.acquireQuantity;
  return byCost || left.name.localeCompare(right.name);
}

/**
 * Aggregate simultaneous deck requirements without changing collection ownership.
 *
 * @param decks - decks whose mainboards are combined
 * @param ownedQuantities - physical copies by printing id
 * @returns printings still missing, most expensive first
 */
export function buildAcquisitionPlan(
  decks: readonly AcquisitionPlanDeck[],
  ownedQuantities: Readonly<Record<string, number>>
): AcquisitionPlanItem[] {
  const requirements = new Map<string, PendingRequirement>();
  for (const deck of decks) {
    for (const [scryfallId, requirement] of deckPrintingNeeds(deck)) {
      addDeckRequirement(requirements, deck, scryfallId, requirement);
    }
  }

  const plan: AcquisitionPlanItem[] = [];
  for (const [scryfallId, requirement] of requirements) {
    const item = toPlanItem(scryfallId, requirement, ownedQuantities);
    if (item) plan.push(item);
  }
  plan.sort(compareAcquisitionPlan);
  return plan;
}
