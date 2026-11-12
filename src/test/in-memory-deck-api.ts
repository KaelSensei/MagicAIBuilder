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
 *   skips the route's stale-row check. The command-zone change
 *   (`changeCommandZone`) applies all of it or, for a row it does not hold,
 *   none of it and answers 500 as the route does.
 * - A held deck is versioned as the routes version it (#1400): every row
 *   write checks the `expectedVersion` it carries against the deck's
 *   `version` (0 when the seed gave none), answers 409 with the routes' text
 *   when they differ, and otherwise steps the version and answers it.
 * - A deck it does not hold accepts every write and keeps nothing, as the
 *   per-file `vi.mock` factories this kit replaced did: most store tests open a
 *   deck by setting the store's state, not through the API. Its answers carry
 *   no version, so a test that sets the store's state sees none appear.
 *   Reading such a deck answers 404.
 *
 * `reset` drops every held deck and puts every operation back to its default.
 *
 * Every default answer settles through `prismaQuery`: the real client is
 * `fetch`-backed, so a refusal rejects the returned promise and the call
 * itself never throws. `fake-failures.test.ts` pins that contract.
 *
 * @module test/in-memory-deck-api
 */

import { vi, type Mock } from "vitest";
import type {
  addCard,
  AddCardPayload,
  ApiDeck,
  ApiDeckCard,
  ApiDeckListResponse,
  applyCardChanges,
  changeCommandZone,
  createDeck,
  DeckCardChanges,
  DeckWriteTarget,
  deleteDeck,
  duplicateDeck,
  fetchDeck,
  removeCard,
  updateCardCategory,
  updateCardNotes,
  updateCardPrinting,
  updateCardQuantity,
  updateCardZone,
  updateDeck,
} from "@/lib/db/deck-api";
import { rowFillsCommandSlot } from "@/lib/deck/bulk-edit-command-zone";
import { CARD_CATEGORIES, type CardCategory } from "@/lib/deck/types";
import { prismaQuery } from "@/test/prisma-query";

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

export type { CardPrinting } from "@/lib/db/deck-api";

/**
 * The `error` of the routes' 409 for a write made from an outdated copy
 * (`STALE_DECK_ERROR` in `src/lib/api/versioned-deck-write.ts`, which this
 * browser-side kit does not import: that module is a Next.js route helper).
 */
export const STALE_DECK_MESSAGE =
  "The deck changed since it was opened — reload it and try again";

/** The deck's new version beside a write's answer; absent when the fake does not hold the deck. */
interface VersionedAnswer {
  readonly version?: number;
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
type FetchDeck = Answering<typeof fetchDeck>;
type CreateDeck = Answering<typeof createDeck>;
type UpdateDeck = Answering<typeof updateDeck>;
type DeleteDeck = Answering<typeof deleteDeck>;
type DuplicateDeck = Answering<typeof duplicateDeck>;
type AddCard = Answering<typeof addCard>;
type RemoveCard = Answering<typeof removeCard>;
type UpdateCardCategory = Answering<typeof updateCardCategory>;
type UpdateCardNotes = Answering<typeof updateCardNotes>;
type UpdateCardZone = Answering<typeof updateCardZone>;
type UpdateCardQuantity = Answering<typeof updateCardQuantity>;
type UpdateCardPrinting = Answering<typeof updateCardPrinting>;
type ApplyCardChanges = Answering<typeof applyCardChanges>;
type ChangeCommandZone = Answering<typeof changeCommandZone>;

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
  readonly changeCommandZone: Mock<ChangeCommandZone>;
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
  return CARD_CATEGORIES.find((known) => known === category) ?? "other";
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

/** Removes the rows that fill `slots`, by role, as the routes delete them. */
function withoutCommandSlots(
  rows: readonly ApiDeckCard[],
  slots: DeckCardChanges["clearCommandSlots"]
): ApiDeckCard[] {
  return rows.filter(
    (row) => !(slots ?? []).some((slot) => rowFillsCommandSlot(row, slot))
  );
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
  const nextId = (prefix: string): string => {
    lastId += 1;
    return `${prefix}-${lastId}`;
  };

  const held = (deckId: string): ApiDeck | undefined => decks.get(deckId);
  const readable = (deckId: string): ApiDeck => {
    const deck = held(deckId);
    if (!deck) throw new DeckApiRefusal(404, "Deck not found");
    return deck;
  };
  /**
   * Claims the next version of a held deck, as the repository does before a
   * row write: refused when the writer's `expectedVersion` is not the deck's.
   *
   * @returns the deck's new version, or undefined for a deck the fake does not hold
   */
  const claimVersion = ({
    deckId,
    expectedVersion,
  }: DeckWriteTarget): number | undefined => {
    const deck = held(deckId);
    if (!deck) return undefined;
    const current = deck.version ?? 0;
    if (expectedVersion !== undefined && expectedVersion !== current) {
      throw new DeckApiRefusal(409, STALE_DECK_MESSAGE);
    }
    deck.version = current + 1;
    return deck.version;
  };
  /** The answer with the deck's new version beside it, when there is one. */
  const withVersion = <Value extends object>(
    value: Value,
    version: number | undefined
  ): Value & VersionedAnswer =>
    version === undefined ? value : { ...value, version };
  /**
   * Applies `change` to a held row once the version is claimed; a deck the
   * fake does not hold keeps nothing.
   */
  const patchRow = (
    target: DeckWriteTarget,
    cardId: string,
    change: Partial<ApiDeckCard>
  ): ApiDeckCard & VersionedAnswer => {
    const deck = held(target.deckId);
    if (!deck) {
      return {
        ...rowFromPayload(target.deckId, cardId, {
          scryfallId: cardId,
          name: "",
        }),
        ...change,
      };
    }
    const row = deck.cards.find((candidate) => candidate.id === cardId);
    if (!row) throw new DeckApiRefusal(404, "Card not found");
    const version = claimVersion(target);
    Object.assign(row, change);
    return withVersion(structuredClone(row), version);
  };

  /**
   * Applies a command-zone change to a held deck as the route does: all of it,
   * or none of it when a row to remove is not held.
   */
  const applyCommandZoneChange: ChangeCommandZone = (deckId, change) =>
    prismaQuery(() => {
      const rows = change.addCards.map((payload) =>
        rowFromPayload(deckId, nextId("row"), payload)
      );
      const deck = held(deckId);
      if (!deck) return { cards: structuredClone(rows) };
      const leaving = new Set(change.removeCardIds);
      const holdsEveryLeavingRow = change.removeCardIds.every((cardId) =>
        deck.cards.some((row) => row.id === cardId)
      );
      if (!holdsEveryLeavingRow) {
        throw new DeckApiRefusal(500, "Failed to save the command zone");
      }
      const version = claimVersion({ deckId, ...change });
      const kept = withoutCommandSlots(
        deck.cards.filter((row) => !leaving.has(row.id)),
        change.clearCommandSlots
      );
      decks.set(deckId, {
        ...deck,
        ...change.commandZone,
        version,
        cards: [...kept, ...rows],
      });
      return { cards: structuredClone(rows), version };
    });

  const operations: DeckApiOperations = {
    fetchDecks: vi.fn<FetchDecks>((page: number, limit: number) =>
      prismaQuery(() => {
        const listing = [...decks.values()].map(listed);
        return {
          decks: structuredClone(listing),
          total: listing.length,
          page,
          limit,
        };
      })
    ),
    fetchDeck: vi.fn<FetchDeck>((deckId: string) =>
      prismaQuery(() => structuredClone(readable(deckId)))
    ),
    createDeck: vi.fn<CreateDeck>((name, opts) =>
      prismaQuery(() => {
        const deck = Object.assign(emptyApiDeck(nextId("deck"), name), opts);
        decks.set(deck.id, deck);
        return structuredClone(deck);
      })
    ),
    updateDeck: vi.fn<UpdateDeck>((deckId, patch) =>
      prismaQuery(() => {
        const deck = held(deckId);
        if (!deck) return Object.assign(emptyApiDeck(deckId), patch);
        Object.assign(deck, patch);
        return structuredClone(deck);
      })
    ),
    deleteDeck: vi.fn<DeleteDeck>((deckId: string) =>
      prismaQuery(() => {
        decks.delete(deckId);
      })
    ),
    duplicateDeck: vi.fn<DuplicateDeck>((deckId: string) =>
      prismaQuery(() => {
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
      })
    ),
    addCard: vi.fn<AddCard>((target, payload) =>
      prismaQuery(() => {
        const version = claimVersion(target);
        const row = rowFromPayload(target.deckId, nextId("row"), payload);
        held(target.deckId)?.cards.push(row);
        return withVersion(structuredClone(row), version);
      })
    ),
    removeCard: vi.fn<RemoveCard>((target, cardId) =>
      prismaQuery(() => {
        const deck = held(target.deckId);
        if (!deck) return;
        const index = deck.cards.findIndex((row) => row.id === cardId);
        if (index === -1) throw new DeckApiRefusal(404, "Card not found");
        const version = claimVersion(target);
        deck.cards.splice(index, 1);
        return { version };
      })
    ),
    updateCardCategory: vi.fn<UpdateCardCategory>((target, cardId, category) =>
      prismaQuery(() => patchRow(target, cardId, { category }))
    ),
    updateCardNotes: vi.fn<UpdateCardNotes>((target, cardId, notes) =>
      prismaQuery(() => patchRow(target, cardId, { notes }))
    ),
    updateCardZone: vi.fn<UpdateCardZone>((target, cardId, zone) =>
      prismaQuery(() => patchRow(target, cardId, { zone }))
    ),
    updateCardQuantity: vi.fn<UpdateCardQuantity>((target, cardId, quantity) =>
      prismaQuery(() => patchRow(target, cardId, { quantity }))
    ),
    updateCardPrinting: vi.fn<UpdateCardPrinting>((target, cardId, printing) =>
      prismaQuery(() => patchRow(target, cardId, { ...printing }))
    ),
    applyCardChanges: vi.fn<ApplyCardChanges>((deckId, changes) =>
      prismaQuery(() => {
        const version = claimVersion({ deckId, ...changes });
        const deck = structuredClone(held(deckId) ?? emptyApiDeck(deckId));
        const removed = new Set(changes.removeCardIds);
        const rows = withoutCommandSlots(
          deck.cards.filter((row) => !removed.has(row.id)),
          changes.clearCommandSlots
        ).map((row) => {
          const change = changes.quantityChanges.find(
            (c) => c.cardId === row.id
          );
          return change ? { ...row, quantity: change.quantity } : row;
        });
        const added = changes.addCards.map((payload) =>
          rowFromPayload(deckId, nextId("row"), payload)
        );
        const saved: ApiDeck = withVersion(
          { ...deck, ...changes.commandZone, cards: [...rows, ...added] },
          version
        );
        if (held(deckId)) decks.set(deckId, saved);
        return structuredClone(saved);
      })
    ),
    changeCommandZone: vi.fn<ChangeCommandZone>(applyCommandZoneChange),
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
