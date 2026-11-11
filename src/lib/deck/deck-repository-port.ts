/**
 * The deck repository port: how the deck-building context writes a deck's
 * card rows under the deck's optimistic lock.
 *
 * Every write runs as one unit of work: the card change and the move of
 * `Deck.version` (and `updatedAt`) are stored together or not at all. A
 * writer may name the version it last read (`expectedVersion`); when another
 * write landed in between, nothing is stored and the result is `stale`
 * (docs/architecture/target-structure.md, "Optimistic lock").
 *
 * Implementations: `prismaDeckRepository` in `lib/deck/deck-repository.ts`
 * (PostgreSQL) and `inMemoryDeckRepository` in
 * `lib/deck/testing/in-memory-deck-repository.ts` (tests). Both pass the
 * contract suite in `lib/deck/testing/deck-repository-contract.ts`.
 * This file holds types only, no framework or database import, so it moves to
 * `modules/deck-building/application/ports.ts` unchanged.
 *
 * Not responsible for: who may write (the route checks the owner first) and
 * whether the deck is legal (ADR 0009: legality never blocks an edit).
 *
 * @module deck/deck-repository-port
 */

/**
 * The deck a write targets, and the version its writer last read.
 *
 * `expectedVersion` absent means "do not check": the write proceeds and still
 * moves the version. That keeps clients that predate the lock working.
 */
export interface DeckWriteTarget {
  readonly deckId: string;
  readonly expectedVersion?: number;
}

/**
 * The columns of a card row to add. Defaults (empty mana cost, one copy, main
 * deck…) are already applied by the request parser; the repository writes the
 * values as given.
 */
export interface NewDeckCard {
  readonly scryfallId: string;
  readonly name: string;
  readonly manaCost: string;
  readonly cmc: number;
  readonly typeLine: string;
  readonly oracleText: string;
  readonly power: string | null;
  readonly toughness: string | null;
  readonly colorIdentity: readonly string[];
  readonly isGameChanger: boolean;
  readonly isBanned: boolean;
  readonly price: number | null;
  readonly imageUri: string;
  readonly artCropUri: string;
  readonly category: string;
  readonly quantity: number;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
  readonly zone: string;
}

/** A card row as stored: its database id, its deck and its private note. */
export interface StoredDeckCard extends NewDeckCard {
  readonly id: string;
  readonly deckId: string;
  readonly notes: string | null;
}

/**
 * The columns one card edit may change. An absent key keeps the stored value;
 * `notes: null` clears the note.
 */
export type DeckCardEdit = Partial<
  Pick<
    StoredDeckCard,
    | "category"
    | "zone"
    | "quantity"
    | "scryfallId"
    | "imageUri"
    | "artCropUri"
    | "notes"
  >
>;

/** A write that was stored: what it produced, and the deck's version after it. */
export interface SavedDeckWrite<Value> {
  readonly kind: "saved";
  readonly value: Value;
  readonly version: number;
}

/**
 * The outcome of one versioned deck write.
 *
 * - `saved`: the card change and the version move are stored.
 * - `stale`: `expectedVersion` was not the stored version; nothing is stored.
 * - `not-found`: no deck has this id (deleted since the caller checked);
 *   nothing is stored.
 *
 * A failure of the store itself (lost connection, a card id the deck does not
 * hold) is not an outcome: the method rejects, and nothing is stored either.
 */
export type DeckWriteResult<Value> =
  | SavedDeckWrite<Value>
  | { readonly kind: "stale" }
  | { readonly kind: "not-found" };

/**
 * Writes a deck's card rows, one unit of work per call.
 *
 * Each method moves the deck's version by exactly one when it saves, and
 * refreshes the deck's `updatedAt`, which orders the deck lists and dates the
 * deck in the sitemap. Card ids are scoped to `target.deckId`: a card of
 * another deck is treated as missing.
 */
export interface DeckRepository {
  /** Adds one card row. `value` is the stored row. */
  readonly addCard: (
    target: DeckWriteTarget,
    card: NewDeckCard
  ) => Promise<DeckWriteResult<StoredDeckCard>>;
  /**
   * Changes the given columns of one card row. `value` is the stored row.
   * Rejects when the deck holds no card `cardId`.
   */
  readonly editCard: (
    target: DeckWriteTarget,
    cardId: string,
    edit: DeckCardEdit
  ) => Promise<DeckWriteResult<StoredDeckCard>>;
  /**
   * Removes one card row. `value` is the removed row.
   * Rejects when the deck holds no card `cardId`.
   */
  readonly removeCard: (
    target: DeckWriteTarget,
    cardId: string
  ) => Promise<DeckWriteResult<StoredDeckCard>>;
  /** Removes every card row of the deck. `value` is how many were removed. */
  readonly removeAllCards: (
    target: DeckWriteTarget
  ) => Promise<DeckWriteResult<number>>;
}
