/**
 * An in-memory deck API, for the deck store's tests: the deck client's
 * operations, answered from decks held in memory.
 *
 * Part of the shared test kit: owned ports get hand-written in-memory fakes
 * (ADR 0005, rule 3). Test files reach it through `installFakeDeckClient`
 * (`src/test/fake-deck-client.ts`), which serves it under the real deck client
 * until the store takes that client as a port (DB-16).
 *
 * Each operation is a `vi.fn` named after the deck client function it answers
 * (`src/lib/db/deck-api.ts`), and is called with what the route received:
 * `addCard(deckId, payload)` for `POST /api/decks/[id]/cards`.
 * `updateCardQuantity` and `updateCardPrinting` answer the two single-card
 * PATCH bodies the store still sends with its own `fetch` (master plan P1-09,
 * DB-16). Default answers come from the decks it holds:
 * - `seedDeck` stores a deck as the database would hold it, and `savedDeck`
 *   reads it back. A held deck behaves like the routes: rows persist, and a
 *   row it does not hold answers 404. The bulk change (`applyCardChanges`)
 *   skips the route's stale-row check.
 * - A deck it does not hold accepts every write and keeps nothing, as the
 *   per-file `vi.mock` factories this kit replaced did: most store tests open a
 *   deck by setting the store's state, not through the API. Reading such a
 *   deck answers 404.
 *
 * `reset` drops every held deck and puts every operation back to its default.
 *
 * @module test/in-memory-deck-api
 */

import { vi, type Mock } from "vitest";
import type {
  AddCardPayload,
  ApiDeck,
  ApiDeckCard,
  ApiDeckListResponse,
  DeckCardChanges,
} from "@/lib/db/deck-api";
import type * as DeckClient from "@/lib/db/deck-api";
import { COMMAND_SLOT_ROWS } from "@/lib/deck/bulk-edit-command-zone";
import type { CardCategory } from "@/lib/deck/types";
import { VALID_CATEGORIES } from "@/lib/validation/card";

/**
 * A refusal from the deck API: the fake answers `status`, and the body
 * `{ error: message }` when there is a message. The real client then throws
 * `[operation] HTTP <status>: <message>`, exactly as against the routes.
 */
export class DeckApiRefusal extends Error {
  /**
   * @param status - the HTTP status to answer, 4xx or 5xx
   * @param message - the route's `error` text; empty sends no body field
   */
  constructor(
    readonly status: number,
    message = ""
  ) {
    super(message);
    this.name = "DeckApiRefusal";
  }
}

/** The printing fields the store's printing swap writes on one row. */
export interface CardPrinting {
  readonly scryfallId: string;
  readonly imageUri?: string;
  readonly artCropUri?: string;
}

/**
 * An operation of the fake: called with what the route received, it answers
 * what the route would, or nothing. Nothing goes on the wire as `null`: the
 * `vi.mock` factories this kit replaced resolved `undefined` for the writes
 * whose answer the store ignores, and their tests still do.
 */
export type Answers<Args extends unknown[], Answer> = (
  ...args: Args
) => Promise<Answer | void>;

/** A deck client function, as the fake answers it. */
type Answering<Client extends (...args: never[]) => Promise<unknown>> = Answers<
  Parameters<Client>,
  Awaited<ReturnType<Client>>
>;

type FetchDecks = Answers<[page: number, limit: number], ApiDeckListResponse>;
type FetchDeck = Answering<typeof DeckClient.fetchDeck>;
type CreateDeck = Answering<typeof DeckClient.createDeck>;
type UpdateDeck = Answering<typeof DeckClient.updateDeck>;
type DeleteDeck = Answering<typeof DeckClient.deleteDeck>;
type DuplicateDeck = Answering<typeof DeckClient.duplicateDeck>;
type AddCard = Answering<typeof DeckClient.addCard>;
type RemoveCard = Answering<typeof DeckClient.removeCard>;
type UpdateCardCategory = Answering<typeof DeckClient.updateCardCategory>;
type UpdateCardNotes = Answering<typeof DeckClient.updateCardNotes>;
type UpdateCardZone = Answering<typeof DeckClient.updateCardZone>;
type UpdateCardQuantity = Answers<
  [deckId: string, cardId: string, quantity: number],
  ApiDeckCard
>;
type UpdateCardPrinting = Answers<
  [deckId: string, cardId: string, printing: CardPrinting],
  ApiDeckCard
>;
type ApplyCardChanges = Answering<typeof DeckClient.applyCardChanges>;
type RemoveAllCards = Answering<typeof DeckClient.removeAllCards>;

/** The deck client's operations, as spies whose default answers are in-memory. */
export interface DeckApiOperations {
  readonly fetchDecks: Mock<FetchDecks>;
  readonly fetchDeck: Mock<FetchDeck>;
  readonly createDeck: Mock<CreateDeck>;
  readonly updateDeck: Mock<UpdateDeck>;
  readonly deleteDeck: Mock<DeleteDeck>;
  readonly duplicateDeck: Mock<DuplicateDeck>;
  readonly addCard: Mock<AddCard>;
  readonly removeCard: Mock<RemoveCard>;
  readonly updateCardCategory: Mock<UpdateCardCategory>;
  readonly updateCardNotes: Mock<UpdateCardNotes>;
  readonly updateCardZone: Mock<UpdateCardZone>;
  readonly updateCardQuantity: Mock<UpdateCardQuantity>;
  readonly updateCardPrinting: Mock<UpdateCardPrinting>;
  readonly applyCardChanges: Mock<ApplyCardChanges>;
  readonly removeAllCards: Mock<RemoveAllCards>;
}

/** The in-memory deck API: its operations, and the decks it holds. */
export interface InMemoryDeckApi extends DeckApiOperations {
  /** Stores a deck, rows included, as the database would hold it. */
  readonly seedDeck: (deck: ApiDeck) => void;
  /** The held deck with this id, as the routes would return it. */
  readonly savedDeck: (deckId: string) => ApiDeck | undefined;
  /** Drops every held deck and puts every operation back to its default. */
  readonly reset: () => void;
}

/** When a deck was created, for every deck the fake builds. */
const CREATED_AT = "2026-11-01T00:00:00.000Z";

/**
 * A deck with no cards, as `GET /api/decks/[id]` returns a new deck.
 *
 * @param id - the deck id
 * @param name - the deck name
 * @returns the deck, with the defaults the database applies
 */
export function emptyApiDeck(id: string, name = "Deck"): ApiDeck {
  return {
    id,
    name,
    format: "commander",
    targetBracket: 2,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    commanderId: null,
    commanderName: null,
    partnerId: null,
    companionId: null,
    pairingType: "none",
    companion: null,
    maybeboard: [],
    cards: [],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
}

function toCategory(category: string | undefined): CardCategory {
  return VALID_CATEGORIES.find((known) => known === category) ?? "other";
}

/** The row the database inserts for an add-card payload, with its defaults. */
function rowFromPayload(
  deckId: string,
  id: string,
  payload: AddCardPayload
): ApiDeckCard {
  return {
    id,
    deckId,
    scryfallId: payload.scryfallId,
    name: payload.name,
    manaCost: payload.manaCost ?? "",
    cmc: payload.cmc ?? 0,
    typeLine: payload.typeLine ?? "",
    oracleText: payload.oracleText ?? "",
    power: payload.power ?? null,
    toughness: payload.toughness ?? null,
    colorIdentity: payload.colorIdentity ?? [],
    isGameChanger: payload.isGameChanger ?? false,
    isBanned: payload.isBanned ?? false,
    price: payload.price ?? null,
    imageUri: payload.imageUri ?? "",
    artCropUri: payload.artCropUri ?? "",
    category: toCategory(payload.category),
    quantity: payload.quantity ?? 1,
    notes: null,
    isCommander: payload.isCommander ?? false,
    isPartner: payload.isPartner ?? false,
    zone: payload.zone ?? "main",
  };
}

/** The listing shape of a deck: no rows, a row count. */
function listed(deck: ApiDeck): ApiDeck {
  return { ...deck, cards: [], _count: { cards: deck.cards.length } };
}

/**
 * Removes the rows that fill `slots`: a row fills a slot when it carries every
 * flag `COMMAND_SLOT_ROWS` names for it, as the bulk-edit route deletes them.
 */
function withoutCommandSlots(
  rows: readonly ApiDeckCard[],
  slots: DeckCardChanges["clearCommandSlots"]
): ApiDeckCard[] {
  const roles = (slots ?? []).map((slot) => COMMAND_SLOT_ROWS[slot]);
  const fillsSlot = (row: ApiDeckCard): boolean =>
    roles.some(
      (role) =>
        (role.isCommander === undefined ||
          role.isCommander === row.isCommander) &&
        (role.isPartner === undefined || role.isPartner === row.isPartner) &&
        (role.category === undefined || role.category === row.category)
    );
  return rows.filter((row) => !fillsSlot(row));
}

/**
 * Creates the fake. Most test files want `installInMemoryDeckApi`, which also
 * serves it and resets it between tests.
 *
 * @returns the fake, holding no deck
 */
export function createInMemoryDeckApi(): InMemoryDeckApi {
  const decks = new Map<string, ApiDeck>();
  let lastId = 0;
  const nextId = (prefix: string): string => `${prefix}-${(lastId += 1)}`;

  const held = (deckId: string): ApiDeck | undefined => decks.get(deckId);
  const readable = (deckId: string): ApiDeck => {
    const deck = held(deckId);
    if (!deck) throw new DeckApiRefusal(404, "Deck not found");
    return deck;
  };
  /** Applies `change` to a held row; a deck the fake does not hold keeps nothing. */
  const patchRow = (
    deckId: string,
    cardId: string,
    change: Partial<ApiDeckCard>
  ): ApiDeckCard => {
    const deck = held(deckId);
    if (!deck) {
      return {
        ...rowFromPayload(deckId, cardId, { scryfallId: cardId, name: "" }),
        ...change,
      };
    }
    const row = deck.cards.find((candidate) => candidate.id === cardId);
    if (!row) throw new DeckApiRefusal(404, "Card not found");
    Object.assign(row, change);
    return structuredClone(row);
  };

  const operations: DeckApiOperations = {
    fetchDecks: vi.fn<FetchDecks>(async (page: number, limit: number) => {
      const listing = [...decks.values()].map(listed);
      return {
        decks: structuredClone(listing),
        total: listing.length,
        page,
        limit,
      };
    }),
    fetchDeck: vi.fn<FetchDeck>(async (deckId: string) =>
      structuredClone(readable(deckId))
    ),
    createDeck: vi.fn<CreateDeck>(async (name, opts) => {
      const deck = Object.assign(emptyApiDeck(nextId("deck"), name), opts);
      decks.set(deck.id, deck);
      return structuredClone(deck);
    }),
    updateDeck: vi.fn<UpdateDeck>(async (deckId, patch) => {
      const deck = held(deckId);
      if (!deck) return Object.assign(emptyApiDeck(deckId), patch);
      Object.assign(deck, patch);
      return structuredClone(deck);
    }),
    deleteDeck: vi.fn<DeleteDeck>(async (deckId: string) => {
      decks.delete(deckId);
    }),
    duplicateDeck: vi.fn<DuplicateDeck>(async (deckId: string) => {
      const source = readable(deckId);
      const copyId = nextId("deck");
      const copy: ApiDeck = {
        ...structuredClone(source),
        id: copyId,
        name: `${source.name} (Copy)`,
        cards: source.cards.map((row) => ({
          ...structuredClone(row),
          id: nextId("row"),
          deckId: copyId,
        })),
      };
      decks.set(copyId, copy);
      return structuredClone(copy);
    }),
    addCard: vi.fn<AddCard>(async (deckId, payload) => {
      const row = rowFromPayload(deckId, nextId("row"), payload);
      held(deckId)?.cards.push(row);
      return structuredClone(row);
    }),
    removeCard: vi.fn<RemoveCard>(async (deckId: string, cardId: string) => {
      const deck = held(deckId);
      if (!deck) return;
      const index = deck.cards.findIndex((row) => row.id === cardId);
      if (index === -1) throw new DeckApiRefusal(404, "Card not found");
      deck.cards.splice(index, 1);
    }),
    updateCardCategory: vi.fn<UpdateCardCategory>(
      async (deckId, cardId, category) => patchRow(deckId, cardId, { category })
    ),
    updateCardNotes: vi.fn<UpdateCardNotes>(async (deckId, cardId, notes) =>
      patchRow(deckId, cardId, { notes })
    ),
    updateCardZone: vi.fn<UpdateCardZone>(async (deckId, cardId, zone) =>
      patchRow(deckId, cardId, { zone })
    ),
    updateCardQuantity: vi.fn<UpdateCardQuantity>(
      async (deckId: string, cardId: string, quantity: number) =>
        patchRow(deckId, cardId, { quantity })
    ),
    updateCardPrinting: vi.fn<UpdateCardPrinting>(
      async (deckId: string, cardId: string, printing: CardPrinting) =>
        patchRow(deckId, cardId, printing)
    ),
    applyCardChanges: vi.fn<ApplyCardChanges>(async (deckId, changes) => {
      const deck = structuredClone(held(deckId) ?? emptyApiDeck(deckId));
      const removed = new Set(changes.removeCardIds);
      const rows = withoutCommandSlots(
        deck.cards.filter((row) => !removed.has(row.id)),
        changes.clearCommandSlots
      ).map((row) => {
        const change = changes.quantityChanges.find((c) => c.cardId === row.id);
        return change ? { ...row, quantity: change.quantity } : row;
      });
      const added = changes.addCards.map((payload) =>
        rowFromPayload(deckId, nextId("row"), payload)
      );
      const saved: ApiDeck = {
        ...deck,
        ...changes.commandZone,
        cards: [...rows, ...added],
      };
      if (held(deckId)) decks.set(deckId, saved);
      return structuredClone(saved);
    }),
    removeAllCards: vi.fn<RemoveAllCards>(async (deckId: string) => {
      const deck = held(deckId);
      if (deck) deck.cards = [];
    }),
  };

  return {
    ...operations,
    seedDeck: (deck) => {
      decks.set(deck.id, structuredClone(deck));
    },
    savedDeck: (deckId) => {
      const deck = held(deckId);
      return deck && structuredClone(deck);
    },
    reset: () => {
      decks.clear();
      lastId = 0;
      // Since Vitest 3, `mockReset` restores the implementation given to
      // `vi.fn`: https://vitest.dev/api/mock#mockreset (read 2026-11-11).
      for (const operation of Object.values(operations)) operation.mockReset();
    },
  };
}
