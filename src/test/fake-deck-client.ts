/**
 * The fake deck client: an in-memory deck API (`src/test/in-memory-deck-api.ts`)
 * served under the real deck client, for the deck store's tests.
 *
 * Part of the shared test kit. The deck store calls its deck client,
 * `src/lib/db/deck-api.ts`, directly; there is no port a test could hand a
 * fake to yet (DB-16 and the store split in the master plan add one). So the
 * fake sits one step further out, at the HTTP boundary:
 * `installFakeDeckClient` starts MSW (`src/test/msw.ts`) with handlers that
 * decode each request the real client sends into the client operation it
 * stands for, and let the in-memory deck API answer it. The store, the real
 * client and the client's error handling all run; only the deck API routes are
 * replaced. Once the store takes its client as a port, the in-memory deck API
 * can be passed in directly and this module can go.
 *
 * A test steers one answer through the operation:
 * - `mockResolvedValueOnce(value)` answers 200 with that value as JSON;
 * - `mockReturnValueOnce(promise)` holds the response until the promise
 *   settles;
 * - `mockRejectedValueOnce(new DeckApiRefusal(409))` answers that status, with
 *   `{ error }` when the refusal has a message;
 * - any other rejection fails the request at the network level, so `fetch`
 *   rejects as it does offline.
 *
 * Before each test every operation is back to its default and no deck is
 * held. Only the routes the deck store calls are served; any other request
 * fails the test (`setupMsw`).
 *
 * @module test/fake-deck-client
 */

import { beforeEach } from "vitest";
import { http, HttpResponse, type HttpHandler } from "msw";
import { z } from "zod";
import { ALL_FORMATS } from "@/lib/deck/formats";
import { CARD_CATEGORIES } from "@/lib/deck/types";
import { VALID_ZONES } from "@/lib/validation/card";
import { pairingTypeSchema } from "@/lib/validation/deck";
import type { DeckWriteTarget } from "@/lib/db/deck-api";
import {
  createInMemoryDeckApi,
  DeckApiRefusal,
  type DeckApiOperations,
  type InMemoryDeckApi,
} from "@/test/in-memory-deck-api";
import { setupMsw } from "@/test/msw";

export { DeckApiRefusal, emptyApiDeck } from "@/test/in-memory-deck-api";
export type {
  CardPrinting,
  DeckApiOperations,
  InMemoryDeckApi,
} from "@/test/in-memory-deck-api";

// The bodies the real client sends, parsed loosely: the fake decodes them, it
// does not validate them as the routes do (`src/lib/validation/*`), because
// store fixtures use ids and URLs those schemas reject. Unknown keys are kept,
// so an operation sees every field that was sent.
const addCardPayloadSchema = z.looseObject({
  scryfallId: z.string(),
  name: z.string(),
  manaCost: z.string().optional(),
  cmc: z.number().optional(),
  typeLine: z.string().optional(),
  oracleText: z.string().optional(),
  power: z.string().nullable().optional(),
  toughness: z.string().nullable().optional(),
  colorIdentity: z.array(z.string()).optional(),
  isGameChanger: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  price: z.number().nullable().optional(),
  imageUri: z.string().optional(),
  artCropUri: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().optional(),
  isCommander: z.boolean().optional(),
  isPartner: z.boolean().optional(),
  zone: z.enum(VALID_ZONES).optional(),
});

/** The deck version a row write carries beside its own fields, as the routes read it. */
const expectedVersionField = { expectedVersion: z.number().optional() };
const addCardBodySchema = addCardPayloadSchema.extend(expectedVersionField);

/**
 * The target of a row operation, as the deck client names it: the deck and
 * the version the request carried. A call without one matches
 * `toHaveBeenCalledWith({ deckId }, …)`, since an undefined field is no field.
 */
function target(
  deckId: string,
  expectedVersion: number | undefined
): DeckWriteTarget {
  return { deckId, expectedVersion };
}

/**
 * The `?expectedVersion=` of a card DELETE, as the route parses it
 * (`cardDeleteQuerySchema`): plain digits only.
 */
function queryVersion(request: Request): number | undefined {
  const raw = new URL(request.url).searchParams.get("expectedVersion");
  return raw !== null && /^\d{1,10}$/.test(raw) ? Number(raw) : undefined;
}

const deckFieldsSchema = z.looseObject({
  format: z.enum(ALL_FORMATS).optional(),
  targetBracket: z.number().optional(),
  manualBracket: z.number().nullable().optional(),
  budget: z.number().nullable().optional(),
  commanderId: z.string().nullable().optional(),
  commanderName: z.string().nullable().optional(),
  partnerId: z.string().nullable().optional(),
  companionId: z.string().nullable().optional(),
  pairingType: pairingTypeSchema.optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isAIGenerated: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  seekingFeedback: z.boolean().optional(),
  feedbackQuestion: z.string().nullable().optional(),
});

const createDeckBodySchema = deckFieldsSchema.extend({ name: z.string() });
/**
 * A command field on the deck PATCH answers 400, as the server does: the
 * command zone changes only through `PATCH …/command-zone`.
 */
const refusedCommandField = z.optional(
  z.never({
    error:
      "the command zone changes through PATCH /api/decks/[id]/command-zone",
  })
);
const deckPatchSchema = deckFieldsSchema.extend({
  name: z.string().optional(),
  commanderId: refusedCommandField,
  commanderName: refusedCommandField,
  partnerId: refusedCommandField,
  companionId: refusedCommandField,
  pairingType: refusedCommandField,
});

const cardChangesSchema = z.object({
  removeCardIds: z.array(z.string()),
  quantityChanges: z.array(
    z.object({ cardId: z.string(), quantity: z.number() })
  ),
  addCards: z.array(addCardPayloadSchema),
  clearCommandSlots: z
    .array(z.enum(["commander", "partner", "companion"]))
    .optional(),
  commandZone: z
    .object({
      commanderId: z.string().nullable(),
      commanderName: z.string().nullable(),
      partnerId: z.string().nullable(),
      companionId: z.string().nullable(),
      pairingType: pairingTypeSchema,
    })
    .optional(),
  expectedVersion: z.number().optional(),
});

const commandZoneChangeSchema = z.object({
  removeCardIds: z.array(z.string()),
  clearCommandSlots: z.array(z.enum(["commander", "partner", "companion"])),
  addCards: z.array(addCardPayloadSchema),
  commandZone: z.object({
    commanderId: z.string().nullable().optional(),
    commanderName: z.string().nullable().optional(),
    partnerId: z.string().nullable().optional(),
    companionId: z.string().nullable().optional(),
    pairingType: pairingTypeSchema.optional(),
  }),
  expectedVersion: z.number().optional(),
});

const cardPatchSchema = z.object({
  category: z.enum(CARD_CATEGORIES).optional(),
  notes: z.string().nullable().optional(),
  zone: z.enum(VALID_ZONES).optional(),
  quantity: z.number().optional(),
  scryfallId: z.string().optional(),
  imageUri: z.string().optional(),
  artCropUri: z.string().optional(),
  price: z.number().nullable().optional(),
  ...expectedVersionField,
});

/** Answers with what the operation returned, or with its refusal or failure. */
async function answer(run: () => unknown): Promise<Response> {
  try {
    const value = await run();
    return new Response(JSON.stringify(value ?? null), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (reason) {
    if (!(reason instanceof DeckApiRefusal)) return HttpResponse.error();
    const body = reason.message ? { error: reason.message } : {};
    return HttpResponse.json(body, { status: reason.status });
  }
}

/** Parses the request body with `schema`, then answers with `run`. */
async function answerBody<T>(
  request: Request,
  schema: z.ZodType<T>,
  run: (body: T) => unknown
): Promise<Response> {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    const error = `fake deck client: unexpected body: ${parsed.error.message}`;
    return HttpResponse.json({ error }, { status: 400 });
  }
  return answer(() => run(parsed.data));
}

/** The single-row PATCH: one operation per field the client writes. */
function patchCard(
  client: DeckApiOperations,
  [deckId, cardId]: readonly [string, string],
  { expectedVersion, ...patch }: z.infer<typeof cardPatchSchema>
): unknown {
  const deck = target(deckId, expectedVersion);
  if (patch.category !== undefined)
    return client.updateCardCategory(deck, cardId, patch.category);
  if (patch.notes !== undefined)
    return client.updateCardNotes(deck, cardId, patch.notes);
  if (patch.zone !== undefined)
    return client.updateCardZone(deck, cardId, patch.zone);
  if (patch.quantity !== undefined)
    return client.updateCardQuantity(deck, cardId, patch.quantity);
  if (patch.scryfallId !== undefined)
    return client.updateCardPrinting(deck, cardId, {
      scryfallId: patch.scryfallId,
      imageUri: patch.imageUri,
      artCropUri: patch.artCropUri,
      // As the route does: an absent price keeps the stored one.
      ...(patch.price === undefined ? {} : { price: patch.price }),
    });
  throw new DeckApiRefusal(400, "fake deck client: empty card patch");
}

const DECKS = "/api/decks";
const DECK = `${DECKS}/:deckId`;
const CARDS = `${DECK}/cards`;
const CARD = `${CARDS}/:cardId`;

type DeckParams = { deckId: string };
type CardParams = { deckId: string; cardId: string };

/**
 * MSW handlers for the deck API routes the store calls, each decoding its
 * request into one operation of `client`.
 *
 * @param client - the operations that answer
 * @returns one handler per route
 */
export function deckApiHandlers(client: DeckApiOperations): HttpHandler[] {
  return [
    http.get(DECKS, ({ request }) => {
      const query = new URL(request.url).searchParams;
      const page = Number(query.get("page") ?? 0);
      const limit = Number(query.get("limit") ?? 20);
      return answer(() => client.fetchDecks(page, limit));
    }),
    http.post(DECKS, ({ request }) =>
      answerBody(request, createDeckBodySchema, ({ name, ...opts }) =>
        client.createDeck(name, opts)
      )
    ),
    http.get<DeckParams>(DECK, ({ params }) =>
      answer(() => client.fetchDeck(params.deckId))
    ),
    http.patch<DeckParams>(DECK, ({ request, params }) =>
      answerBody(request, deckPatchSchema, (patch) =>
        client.updateDeck(params.deckId, patch)
      )
    ),
    http.delete<DeckParams>(DECK, ({ params }) =>
      answer(() => client.deleteDeck(params.deckId))
    ),
    http.post<DeckParams>(`${DECK}/duplicate`, ({ params }) =>
      answer(() => client.duplicateDeck(params.deckId))
    ),
    http.post<DeckParams>(CARDS, ({ request, params }) =>
      answerBody(
        request,
        addCardBodySchema,
        ({ expectedVersion, ...payload }) =>
          client.addCard(target(params.deckId, expectedVersion), payload)
      )
    ),
    http.patch<DeckParams>(`${DECK}/command-zone`, ({ request, params }) =>
      answerBody(request, commandZoneChangeSchema, (change) =>
        client.changeCommandZone(params.deckId, change)
      )
    ),
    http.patch<DeckParams>(CARDS, ({ request, params }) =>
      answerBody(request, cardChangesSchema, (changes) =>
        client.applyCardChanges(params.deckId, changes)
      )
    ),
    http.patch<CardParams>(CARD, ({ request, params }) =>
      answerBody(request, cardPatchSchema, (patch) =>
        patchCard(client, [params.deckId, params.cardId], patch)
      )
    ),
    http.delete<CardParams>(CARD, ({ request, params }) =>
      answer(() =>
        client.removeCard(
          target(params.deckId, queryVersion(request)),
          params.cardId
        )
      )
    ),
  ];
}

/**
 * Serves a fake deck API to every test of the calling file, and resets it
 * before each test. Call it once, at the top level of the test file, before
 * the file's own `beforeEach` hooks, so that they run after the reset.
 *
 * @returns the fake, to seed decks, steer answers and read what was saved
 */
export function installFakeDeckClient(): InMemoryDeckApi {
  const client = createInMemoryDeckApi();
  setupMsw(...deckApiHandlers(client));
  beforeEach(() => {
    client.reset();
  });
  return client;
}
