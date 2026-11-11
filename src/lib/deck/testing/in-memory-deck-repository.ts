/**
 * An in-memory `DeckRepository` for tests (ADR 0005: owned ports get a
 * hand-written fake that passes the port's contract suite).
 *
 * It honours the unit of work the way the Prisma adapter's transaction does:
 * the version check, the card change and the version step are one
 * synchronous step, so a change that throws stores nothing, and two
 * concurrent writers cannot both pass the check (JavaScript runs one
 * synchronous step at a time). Contract: `deck-repository-contract.ts`.
 *
 * @module deck/testing/in-memory-deck-repository
 */
import type {
  DeckRepository,
  DeckWriteResult,
  DeckWriteTarget,
  NewDeckCard,
  StoredDeckCard,
} from "@/lib/deck/deck-repository-port";

import type { SeededDeck, StoredDeckState } from "./deck-repository-contract";
import { SEEDED_AT } from "./deck-repository-contract";

/** The fake, plus the seeding and inspection its tests use. */
export interface InMemoryDeckRepository extends DeckRepository {
  /** Stores a new deck at version 0, last edited {@link SEEDED_AT}. */
  readonly seedDeck: (cards: readonly NewDeckCard[]) => SeededDeck;
  /** @returns the stored deck, or `undefined` when no deck has this id */
  readonly storedDeck: (deckId: string) => StoredDeckState | undefined;
}

/** A card change on the deck's rows: the next rows and what the write answers. */
type CardChange<Value> = (cards: readonly StoredDeckCard[]) => {
  readonly cards: readonly StoredDeckCard[];
  readonly value: Value;
};

/**
 * @returns the row with this id
 * @throws when the deck holds no such row, as Prisma's P2025 does
 */
function cardOf(
  cards: readonly StoredDeckCard[],
  cardId: string
): StoredDeckCard {
  const card = cards.find((row) => row.id === cardId);
  if (card === undefined) throw new Error(`No card ${cardId} in this deck`);
  return card;
}

/** @returns an empty fake repository */
export function inMemoryDeckRepository(): InMemoryDeckRepository {
  const decks = new Map<string, StoredDeckState>();
  let rowCount = 0;

  const storeCard = (deckId: string, card: NewDeckCard): StoredDeckCard => {
    rowCount += 1;
    return { ...card, id: `row-${rowCount}`, deckId, notes: null };
  };

  const versionedWrite = <Value>(
    target: DeckWriteTarget,
    change: CardChange<Value>
  ): DeckWriteResult<Value> => {
    const deck = decks.get(target.deckId);
    if (deck === undefined) return { kind: "not-found" };
    const checked = target.expectedVersion !== undefined;
    if (checked && target.expectedVersion !== deck.version) {
      return { kind: "stale" };
    }
    // Runs before anything is stored: a throw leaves the deck as it was.
    const next = change(deck.cards);
    const version = deck.version + 1;
    decks.set(target.deckId, {
      version,
      updatedAt: new Date(),
      cards: next.cards,
    });
    return { kind: "saved", value: next.value, version };
  };

  return {
    seedDeck: (cards) => {
      const deckId = `deck-${decks.size + 1}`;
      const rows = cards.map((card) => storeCard(deckId, card));
      decks.set(deckId, { version: 0, updatedAt: SEEDED_AT, cards: rows });
      return { deckId, version: 0, cardIds: rows.map((row) => row.id) };
    },
    storedDeck: (deckId) => decks.get(deckId),
    addCard: async (target, card) =>
      versionedWrite(target, (cards) => {
        const row = storeCard(target.deckId, card);
        return { cards: [...cards, row], value: row };
      }),
    editCard: async (target, cardId, edit) =>
      versionedWrite(target, (cards) => {
        const current = cardOf(cards, cardId);
        const row: StoredDeckCard = { ...current, ...edit };
        return {
          cards: cards.map((card) => (card === current ? row : card)),
          value: row,
        };
      }),
    removeCard: async (target, cardId) =>
      versionedWrite(target, (cards) => {
        const removed = cardOf(cards, cardId);
        return {
          cards: cards.filter((card) => card !== removed),
          value: removed,
        };
      }),
    removeAllCards: async (target) =>
      versionedWrite(target, (cards) => ({ cards: [], value: cards.length })),
  };
}
