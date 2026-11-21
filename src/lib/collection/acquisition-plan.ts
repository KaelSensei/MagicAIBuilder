/**
 * Combined acquisition plan across several decks.
 *
 * Pure: it sorts stored deck rows into command-zone slots, reports what is
 * still missing, and does not change ownership. Each deck's "proxy now" and
 * "buy later" choices (saved from that deck's shopping list) move that deck's
 * missing copies out of the copies to buy and into a deferred share, so the
 * plan and the deck's shopping list agree on what is bought now.
 */
import type { DeckCard } from "@/lib/deck/types";
import { isBasicLand } from "@/lib/scryfall/type-line";
import type { AcquisitionMode } from "./acquisition-intent";

/** One deck's share of a printing that still has to be acquired. */
export interface AcquisitionDeckRequirement {
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
}

/** One deck's missing copies of a printing that its owner chose to proxy or buy later. */
export interface AcquisitionDeferral {
  readonly id: string;
  readonly name: string;
  readonly mode: AcquisitionMode;
  /** Copies of this deck the collection does not cover; never 0. */
  readonly quantity: number;
}

/**
 * A printing the collection does not yet cover across the selected decks.
 *
 * `acquireQuantity` counts the copies to buy now; `deferredQuantity` the copies
 * the player chose to proxy or buy later. A copy is in one of the two, never both,
 * and at least one of them is above 0.
 */
export interface AcquisitionPlanItem {
  readonly scryfallId: string;
  readonly name: string;
  readonly requiredQuantity: number;
  readonly ownedQuantity: number;
  readonly acquireQuantity: number;
  readonly deferredQuantity: number;
  readonly price: number | null;
  readonly decks: readonly AcquisitionDeckRequirement[];
  readonly deferred: readonly AcquisitionDeferral[];
}

/** A deck reduced to the fields the plan reads. */
export interface AcquisitionPlanDeck {
  readonly id: string;
  readonly name: string;
  readonly cards: readonly AcquisitionPlanCard[];
  readonly commander: AcquisitionPlanCard | null;
  readonly partner: AcquisitionPlanCard | null;
  /** The owner's saved choice per printing id in this deck; a printing without one is bought now. */
  readonly intents?: Readonly<Record<string, AcquisitionMode>>;
}

/** Printing fields needed to count a deck toward the plan. */
export type AcquisitionPlanCard = Pick<
  DeckCard,
  "id" | "scryfallId" | "name" | "quantity" | "price" | "typeLine"
> & { readonly zone: string };

/** A stored deck row: a plan card plus the flags that place it in the command zone. */
export type AcquisitionPlanRow = AcquisitionPlanCard & {
  readonly isCommander: boolean;
  readonly isPartner: boolean;
};

/** A stored deck before its rows are sorted into command-zone slots. */
export interface AcquisitionPlanStoredDeck {
  readonly id: string;
  readonly name: string;
  readonly cards: readonly AcquisitionPlanRow[];
}

/**
 * Sorts a stored deck's rows into its commander, its second commander and its other cards.
 *
 * Reads the flags the way the deck loader does, so the plan counts the command zone the
 * editor shows: the first row of each slot. A companion has neither flag and stays with
 * the other cards, so it is still counted (CR 702.139a: it must be a card you own).
 *
 * @param deck - deck as read from the database
 * @returns the deck in the shape `buildAcquisitionPlan` reads
 */
export function toAcquisitionPlanDeck(
  deck: AcquisitionPlanStoredDeck
): AcquisitionPlanDeck {
  let commander: AcquisitionPlanCard | null = null;
  let partner: AcquisitionPlanCard | null = null;
  const cards: AcquisitionPlanCard[] = [];
  for (const row of deck.cards) {
    // CR 702.124a: a partner ability (partner, partner with, choose a Background, ...) lets a
    // deck have two commanders (CR 903.3). The editor saves the second one with both
    // `isCommander` and `isPartner`, so `isPartner` must be read first or it replaces the first.
    if (row.isPartner) partner ??= row;
    else if (row.isCommander) commander ??= row;
    else cards.push(row);
  }
  return { id: deck.id, name: deck.name, cards, commander, partner };
}

/** One deck's share of a printing, with the choice that deck's owner saved for it. */
interface DeckShare {
  readonly deck: AcquisitionDeckRequirement;
  readonly mode: AcquisitionMode | null;
}

interface PendingRequirement {
  name: string;
  requiredQuantity: number;
  price: number | null;
  shares: DeckShare[];
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
    if (card === null || isBasicLand(card.typeLine)) continue;
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
  const share: DeckShare = {
    deck: { id: deck.id, name: deck.name, quantity: requirement.quantity },
    mode: deck.intents?.[scryfallId] ?? null,
  };
  const current = requirements.get(scryfallId);
  if (!current) {
    requirements.set(scryfallId, {
      name: requirement.card.name,
      requiredQuantity: requirement.quantity,
      price: requirement.card.price,
      shares: [share],
    });
    return;
  }
  current.requiredQuantity += requirement.quantity;
  current.price ??= requirement.card.price;
  current.shares.push(share);
}

/** How a printing's missing copies split between buying now and the deferred decks. */
interface ChoiceSplit {
  readonly acquireQuantity: number;
  readonly deferred: readonly AcquisitionDeferral[];
}

/**
 * Hands the owned copies to the decks' shares, then splits what is left by choice.
 *
 * The owned copies go to the decks with no choice first: a deck marked "proxy now"
 * or "buy later" already has a plan for its copy, so an owned copy given to it
 * would leave a deck that counts on buying with nothing. What the no-choice decks
 * leave spare covers the deferred decks in deck order. Each copy is counted once.
 *
 * @param shares - each deck's share of one printing, in deck order
 * @param ownedQuantity - physical copies of that printing
 * @returns the copies to buy now and each deferred deck's uncovered copies
 */
function splitByChoice(shares: readonly DeckShare[], ownedQuantity: number): ChoiceSplit {
  const buyNowNeed = shares.reduce(
    (sum, share) => sum + (share.mode === null ? share.deck.quantity : 0),
    0
  );
  let spare = Math.max(0, ownedQuantity - buyNowNeed);
  const deferred: AcquisitionDeferral[] = [];
  for (const { deck, mode } of shares) {
    if (mode === null) continue;
    const covered = Math.min(spare, deck.quantity);
    spare -= covered;
    if (covered < deck.quantity) {
      deferred.push({ id: deck.id, name: deck.name, mode, quantity: deck.quantity - covered });
    }
  }
  return { acquireQuantity: Math.max(0, buyNowNeed - ownedQuantity), deferred };
}

/**
 * Turns a summed requirement into a plan line, or null when the collection covers it.
 *
 * @param scryfallId - printing id
 * @param requirement - summed need across decks
 * @param ownedQuantities - physical copies by printing id
 * @returns the plan line, or null when nothing remains to buy or defer
 */
function toPlanItem(
  scryfallId: string,
  requirement: PendingRequirement,
  ownedQuantities: Readonly<Record<string, number>>
): AcquisitionPlanItem | null {
  const ownedQuantity = Math.max(0, ownedQuantities[scryfallId] ?? 0);
  const { acquireQuantity, deferred } = splitByChoice(requirement.shares, ownedQuantity);
  const deferredQuantity = deferred.reduce((sum, share) => sum + share.quantity, 0);
  if (acquireQuantity === 0 && deferredQuantity === 0) return null;
  return {
    scryfallId,
    name: requirement.name,
    requiredQuantity: requirement.requiredQuantity,
    ownedQuantity,
    acquireQuantity,
    deferredQuantity,
    price: requirement.price,
    decks: requirement.shares.map((share) => share.deck),
    deferred,
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
 * Each deck's `intents` decide whether its missing copies are bought now or
 * deferred; a deck without `intents` buys everything it misses.
 *
 * @param decks - decks whose mainboards are combined, with their owner's choices
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
