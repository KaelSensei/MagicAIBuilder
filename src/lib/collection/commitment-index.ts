/**
 * The commitment index: which owned printings are already in a deck (I-16
 * slice 4).
 *
 * Collection context, pure. Copies in the main deck and the command zone
 * commit a printing. Considering (`maybeboard`) and the sideboard do not, and
 * a companion does not: it is outside the deck (CR 702.139a). One owned copy
 * used by three decks is free in none of them. The index does not change
 * ownership and is not a ranking.
 *
 * Not responsible for: free-cards ranking (slice 7) or the "1 of 3 free" line
 * in search (slice 6).
 *
 * @module collection/commitment-index
 */
import { compareCodeUnits } from "@/lib/text/code-unit-order";

/** One deck row the index may commit. Commanders are flagged, not zoned apart. */
export interface CommitmentDeckRow {
  readonly deckId: string;
  readonly deckName: string;
  readonly scryfallId: string;
  /** Copies on this row. A whole number, zero or more. */
  readonly quantity: number;
  /** `main`, `sideboard` or `maybeboard`, as the deck stores it. */
  readonly zone: string;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
  /** `companion` is outside the deck and does not commit. */
  readonly category: string;
}

/** One owned row. Foil and non-foil of one printing id add together. */
export interface CommitmentCollectionRow {
  readonly scryfallId: string;
  /** Copies owned. A whole number, zero or more. */
  readonly quantity: number;
}

/** Copies of one printing committed to one deck. */
export interface DeckCommitment {
  readonly deckId: string;
  readonly deckName: string;
  readonly quantity: number;
}

/** Owned, committed and free copies of one printing. */
export interface PrintingCommitment {
  readonly scryfallId: string;
  readonly owned: number;
  readonly committed: number;
  readonly free: number;
  readonly decks: readonly DeckCommitment[];
}

/** The index, or a refusal when a quantity is not a copy count. */
export type CommitmentIndex =
  | {
      readonly kind: "indexed";
      readonly printings: readonly PrintingCommitment[];
    }
  | { readonly kind: "rejected"; readonly reason: "not-a-copy-count" };

interface PrintingTally {
  owned: number;
  readonly decks: Map<string, DeckCommitment>;
}

/**
 * Build the commitment index from deck rows and collection rows.
 *
 * @param decks - the player's deck rows, one line per printing in a deck
 * @param collection - the player's owned rows, foil and non-foil separate
 * @returns the index, or `not-a-copy-count` when a quantity is negative or not a whole number
 */
export function commitmentIndex(
  decks: readonly CommitmentDeckRow[],
  collection: readonly CommitmentCollectionRow[]
): CommitmentIndex {
  const tallies = new Map<string, PrintingTally>();
  if (!addCollection(tallies, collection) || !addDecks(tallies, decks)) {
    return { kind: "rejected", reason: "not-a-copy-count" };
  }
  return { kind: "indexed", printings: publish(tallies) };
}

/** @returns false when a collection quantity is not a copy count. */
function addCollection(
  tallies: Map<string, PrintingTally>,
  collection: readonly CommitmentCollectionRow[]
): boolean {
  for (const row of collection) {
    if (!isCopyCount(row.quantity) || row.scryfallId.length === 0) return false;
    const tally = tallyFor(tallies, row.scryfallId);
    tally.owned += row.quantity;
  }
  return true;
}

/** @returns false when a deck quantity is not a copy count. */
function addDecks(
  tallies: Map<string, PrintingTally>,
  decks: readonly CommitmentDeckRow[]
): boolean {
  for (const row of decks) {
    if (!isCopyCount(row.quantity) || row.scryfallId.length === 0) return false;
    if (!commits(row) || row.quantity === 0) continue;
    const tally = tallyFor(tallies, row.scryfallId);
    const existing = tally.decks.get(row.deckId);
    tally.decks.set(row.deckId, {
      deckId: row.deckId,
      deckName: row.deckName,
      quantity: (existing?.quantity ?? 0) + row.quantity,
    });
  }
  return true;
}

/** A commander or partner, or a main-deck card that is not a companion. */
function commits(row: CommitmentDeckRow): boolean {
  if (row.isCommander || row.isPartner) return true;
  return row.zone === "main" && row.category !== "companion";
}

/** A whole number of copies from 0 through 9999. */
function isCopyCount(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 0 && quantity <= 9999;
}

/** @returns the tally for a printing, creating it on the first row. */
function tallyFor(
  tallies: Map<string, PrintingTally>,
  scryfallId: string
): PrintingTally {
  const existing = tallies.get(scryfallId);
  if (existing !== undefined) return existing;
  const created: PrintingTally = { owned: 0, decks: new Map() };
  tallies.set(scryfallId, created);
  return created;
}

/** @returns the printings that own or commit at least one copy, in id order. */
function publish(
  tallies: Map<string, PrintingTally>
): readonly PrintingCommitment[] {
  const printings: PrintingCommitment[] = [];
  for (const [scryfallId, tally] of tallies) {
    const decks = [...tally.decks.values()].sort(byDeck);
    const committed = decks.reduce((sum, deck) => sum + deck.quantity, 0);
    if (tally.owned === 0 && committed === 0) continue;
    printings.push({
      scryfallId,
      owned: tally.owned,
      committed,
      free: Math.max(0, tally.owned - committed),
      decks,
    });
  }
  printings.sort((left, right) =>
    compareCodeUnits(left.scryfallId, right.scryfallId)
  );
  return printings;
}

/** Deck name, then deck id, so the same rows always list in the same order. */
function byDeck(left: DeckCommitment, right: DeckCommitment): number {
  const byName = compareCodeUnits(left.deckName, right.deckName);
  return byName === 0 ? compareCodeUnits(left.deckId, right.deckId) : byName;
}
