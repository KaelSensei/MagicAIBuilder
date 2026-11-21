/**
 * The fill of a project's slots from the owner's own decks (I-113 slice 1,
 * `docs/product/specs/i113-a-project-across-my-own-decks-the-32-colour-identities-and-other-slot-grids.md`).
 *
 * Deck analysis, pure. A slot names one colour identity; a deck fits it when
 * the deck's identity, computed by I-60's rule (`toPlayerStatsDeck`: the
 * commanders' identity, CR 903.4, else the main deck's), is exactly the
 * slot's (requirement 3.1). Nothing here changes a deck (requirement 1.3).
 * Not responsible for: computing a deck's identity (`player-stats-rows.ts`),
 * storing projects, slot rules (slice 6) or the wording a player reads.
 *
 * @module deck/project-fill
 */

import type { IdentityColor, PlayerStatsDeck } from "./player-stats";

/** The colours of Magic in the order cards print them (WUBRG). */
const IDENTITY_COLORS: readonly IdentityColor[] = ["W", "U", "B", "R", "G"];

/** One of the owner's decks, as the fill reads it: I-60's identity and its creation date. */
export type ProjectDeck = Pick<
  PlayerStatsDeck,
  "deckId" | "colorIdentity" | "createdAt"
>;

/** One slot of a project: a colour identity the owner wants a deck in. */
export interface ProjectSlot {
  /** Stable key of the slot within its project, such as "WU" or "C" for colourless */
  readonly key: string;
  /** The identity a deck must have exactly; empty for colourless */
  readonly identity: readonly IdentityColor[];
  /** The owner set this slot aside; it leaves the denominator (requirement 2.2) */
  readonly skipped: boolean;
  /** The deck the owner put here, overriding the default fill (requirement 2.3) */
  readonly pinnedDeckId?: string;
  /** What the owner means to build here while no deck fills it (requirement 2.2) */
  readonly plan?: SlotPlan;
}

/** A deck the owner means to build in a slot: a commander, a note, or both. */
export interface SlotPlan {
  /** The commander's Scryfall Oracle ID */
  readonly commanderOracleId?: string;
  readonly note?: string;
}

/** Whether a deck fits a slot; when it does not, the deck's own identity says why. */
export type SlotFit =
  | { readonly kind: "fits" }
  | {
      readonly kind: "doesNotMatch";
      readonly deckIdentity: readonly IdentityColor[];
    };

/**
 * Whether a deck's colour identity is exactly the slot's (requirement 3.1).
 * Colour order does not matter; the identity returned is in WUBRG order.
 *
 * @param slot - the slot the deck is placed in
 * @param deck - the deck placed
 * @returns `fits`, or `doesNotMatch` with the deck's identity
 */
export function slotFit(slot: ProjectSlot, deck: ProjectDeck): SlotFit {
  return identityKey(deck.colorIdentity) === identityKey(slot.identity)
    ? { kind: "fits" }
    : { kind: "doesNotMatch", deckIdentity: inWubrgOrder(deck.colorIdentity) };
}

/** What one slot holds once the project is filled. */
export type SlotFill =
  | {
      readonly state: "built";
      readonly slotKey: string;
      readonly deckId: string;
      readonly fit: SlotFit;
      /** The other decks of the slot's identity, earliest created first (requirement 2.3) */
      readonly alsoFits: readonly string[];
    }
  | {
      readonly state: "planned";
      readonly slotKey: string;
      readonly plan: SlotPlan;
    }
  | { readonly state: "empty"; readonly slotKey: string }
  | { readonly state: "skipped"; readonly slotKey: string };

/** How far the project is, every figure with its denominator (requirement 1.1). */
export interface ProjectProgress {
  readonly built: number;
  readonly planned: number;
  readonly empty: number;
  readonly skipped: number;
  /** The slots that count: every slot but the skipped ones */
  readonly counted: number;
}

/** A filled project: its slots in their order, and its progress. */
export interface ProjectFill {
  readonly slots: readonly SlotFill[];
  readonly progress: ProjectProgress;
}

/**
 * Fills a project's slots from the owner's decks. Each slot takes, by
 * default, the earliest created deck of exactly its identity; the other
 * decks of that identity are listed under it (requirement 2.3). A pinned
 * deck sits in its pinned slot only, even when it no longer fits there.
 *
 * @param slots - the project's slots, in their order
 * @param decks - the owner's decks, in any order
 * @returns each slot's fill and the project's progress
 */
export function fillProject(
  slots: readonly ProjectSlot[],
  decks: readonly ProjectDeck[]
): ProjectFill {
  const pinnedIds = new Set(slots.map((slot) => slot.pinnedDeckId));
  const decksByIdentity = groupByIdentity(
    decks.filter((deck) => !pinnedIds.has(deck.deckId))
  );
  const decksById = new Map(decks.map((deck) => [deck.deckId, deck]));
  const filled = slots.map((slot) => {
    const matching = decksByIdentity.get(identityKey(slot.identity)) ?? [];
    const pinned =
      slot.pinnedDeckId === undefined
        ? undefined
        : decksById.get(slot.pinnedDeckId);
    return fillSlot(slot, pinned, matching);
  });
  return { slots: filled, progress: progressOf(filled) };
}

/**
 * A slot's fill: the pinned deck when it still exists, else the earliest of
 * the decks of exactly its identity; the other matching decks also fit.
 */
function fillSlot(
  slot: ProjectSlot,
  pinned: ProjectDeck | undefined,
  matching: readonly ProjectDeck[]
): SlotFill {
  if (slot.skipped) return { state: "skipped", slotKey: slot.key };
  const held = pinned ?? matching[0];
  if (held === undefined) {
    return slot.plan === undefined
      ? { state: "empty", slotKey: slot.key }
      : { state: "planned", slotKey: slot.key, plan: slot.plan };
  }
  return {
    state: "built",
    slotKey: slot.key,
    deckId: held.deckId,
    fit: slotFit(slot, held),
    alsoFits: matching
      .filter((deck) => deck !== held)
      .map((deck) => deck.deckId),
  };
}

/** The decks per identity key, each list earliest created first, ties by deck id. */
function groupByIdentity(
  decks: readonly ProjectDeck[]
): ReadonlyMap<string, readonly ProjectDeck[]> {
  const byIdentity = new Map<string, ProjectDeck[]>();
  const byCreation = [...decks].sort(
    (a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime() ||
      a.deckId.localeCompare(b.deckId)
  );
  for (const deck of byCreation) {
    const key = identityKey(deck.colorIdentity);
    const group = byIdentity.get(key) ?? [];
    group.push(deck);
    byIdentity.set(key, group);
  }
  return byIdentity;
}

/** Counts the slots in each state. */
function progressOf(slots: readonly SlotFill[]): ProjectProgress {
  let built = 0;
  let planned = 0;
  let empty = 0;
  let skipped = 0;
  for (const slot of slots) {
    switch (slot.state) {
      case "built":
        built += 1;
        break;
      case "planned":
        planned += 1;
        break;
      case "empty":
        empty += 1;
        break;
      case "skipped":
        skipped += 1;
        break;
      default: {
        const unhandled: never = slot;
        return unhandled;
      }
    }
  }
  return { built, planned, empty, skipped, counted: slots.length - skipped };
}

/** The colours present, in WUBRG order, each once. */
function inWubrgOrder(
  identity: readonly IdentityColor[]
): readonly IdentityColor[] {
  return IDENTITY_COLORS.filter((color) => identity.includes(color));
}

/** An identity written as one string in WUBRG order, whatever its order; empty for colourless. */
function identityKey(identity: readonly IdentityColor[]): string {
  return inWubrgOrder(identity).join("");
}
