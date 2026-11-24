/**
 * The owned pool: the cards a player owns, as candidates for completing one of their decks
 * (I-76 slice 4).
 *
 * Collection context, pure. A collection row records one printing and one finish; the pool
 * counts a card once, by its Oracle name key (`owned-oracle-names.ts`), because no model holds
 * an Oracle id yet (I-76 requirement 2.3, until I-67 slice 2).
 *
 * Not responsible for: legality, copy limits or roles (I-76 slices 1 to 3), and whether an owned
 * copy is free or committed to another deck (I-76 slice 11, through I-16's commitment index), so
 * every owned card reads "owned (may be in another deck)" here.
 *
 * @module collection/owned-pool
 */
import type { DeckZone } from "@/lib/deck/types";
import { compareCodeUnits } from "@/lib/text/code-unit-order";
import { oracleNameKey } from "./owned-oracle-names";

/** One collection row: a printing and finish of a card, with its copies. */
export interface OwnedPoolCollectionRow {
  readonly name: string;
  /** Copies owned of this printing and finish. */
  readonly quantity: number;
}

/** One row of the deck being completed. */
export interface OwnedPoolDeckRow {
  readonly name: string;
  readonly zone: DeckZone;
}

/**
 * Where a pool card stands, best first (I-76 requirement 5.2).
 *
 * - `considering`: owned and in this deck's Considering, the player's own shortlist.
 * - `ownedMayBeInAnotherDeck`: owned; whether a copy is free is not read yet.
 *
 * The owned-only pool holds no unowned card (I-76 testing strategy, "Pools"), so a Considering
 * card the player does not own waits for the "owned first" pool of slice 13.
 */
export type OwnedPoolAvailability = "considering" | "ownedMayBeInAnotherDeck";

/** One card of the pool. */
export interface OwnedPoolCard {
  /** The card's identity until I-67's Oracle ids: its Oracle name key. */
  readonly cardKey: string;
  /** The card's name as the collection records it. */
  readonly name: string;
  /** Copies owned, every printing and finish together. At least 1. */
  readonly owned: number;
  readonly availability: OwnedPoolAvailability;
}

/** What the pool is built from. */
export interface OwnedPoolInput {
  readonly collection: readonly OwnedPoolCollectionRow[];
  readonly deck: readonly OwnedPoolDeckRow[];
}

/** Copies of one card owned so far, and the name it is shown under. */
interface OwnedTally {
  readonly name: string;
  readonly owned: number;
}

/**
 * Build the owned-only pool for one deck.
 *
 * @param input - the owner's collection rows and the deck's rows
 * @returns one entry per owned card, in card-key order
 */
export function ownedPool(input: OwnedPoolInput): readonly OwnedPoolCard[] {
  const tallies = tallyOwnedCopies(input.collection);
  const considering = consideringKeys(input.deck);
  return [...tallies]
    .sort(([left], [right]) => compareCodeUnits(left, right))
    .map(([cardKey, tally]) => ({
      cardKey,
      name: tally.name,
      owned: tally.owned,
      availability: considering.has(cardKey)
        ? "considering"
        : "ownedMayBeInAnotherDeck",
    }));
}

/** @returns the card keys of the deck's Considering rows (`maybeboard`). */
function consideringKeys(
  deck: readonly OwnedPoolDeckRow[]
): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const row of deck) {
    if (row.zone === "maybeboard") keys.add(oracleNameKey(row.name));
  }
  return keys;
}

/** @returns the copies owned per card key; a row with no copy owns nothing. */
function tallyOwnedCopies(
  collection: readonly OwnedPoolCollectionRow[]
): ReadonlyMap<string, OwnedTally> {
  const tallies = new Map<string, OwnedTally>();
  for (const row of collection) {
    if (row.quantity <= 0) continue;
    const cardKey = oracleNameKey(row.name);
    const existing = tallies.get(cardKey);
    tallies.set(cardKey, {
      name:
        existing === undefined ? row.name : fullerName(existing.name, row.name),
      owned: (existing?.owned ?? 0) + row.quantity,
    });
  }
  return tallies;
}

/**
 * The name a card is shown under when its rows spell it differently, whatever order they arrive
 * in (I-76 requirement 1.2): the longer one, so a multi-face card keeps both faces, then the first
 * in code-unit order.
 */
function fullerName(left: string, right: string): string {
  if (left.length !== right.length)
    return left.length > right.length ? left : right;
  return compareCodeUnits(left, right) <= 0 ? left : right;
}
