/**
 * Characterization suite for the three deck store actions that call `fetch`
 * themselves instead of going through the deck client (`src/lib/db/deck-api.ts`):
 * `updateCardQuantity`, `swapCardPrinting` and `duplicateDeck`
 * (`store.ts:959,1846,1985`).
 *
 * The other store tests replace the deck client, so nothing pinned the HTTP
 * these three send. DB-16 moves them into the deck client; this suite pins,
 * first, the exact method, URL, content type and body of each request, and the
 * store state after a 2xx answer, a 4xx answer, a 5xx answer and a network
 * error. It also pins that a guest deck, which lives in this browser only,
 * sends no request.
 *
 * MSW serves the deck API routes (`useMsw`); no internal module is mocked, so
 * `duplicateDeck`'s follow-up listing request goes through the real deck
 * client. A request no handler serves fails the test. Toasts are read from the
 * real toast store.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse, type HttpResponseResolver } from "msw";
import type { ApiDeck } from "@/lib/db/deck-api";
import { useToastStore } from "@/hooks/useToast";
import { useDeckStore } from "@/lib/deck/store";
import { createEmptyDeck } from "@/lib/deck/store-factories";
import {
  createGuestDeck,
  GUEST_DECK_ID,
  loadGuestDeck,
} from "@/lib/deck/guest-deck";
import type { Deck, DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { useMsw } from "@/test/msw";

const DECK_ID = "deck-1";
const COPY_ID = "deck-2";
const CARD_ROUTE = "/api/decks/:deckId/cards/:cardId";
const DUPLICATE_ROUTE = "/api/decks/:deckId/duplicate";
const LISTING_ROUTE = "/api/decks";

const QUANTITY_FAILURE_TOAST =
  "Could not save card quantity — previous quantity restored.";
const PRINTING_FAILURE_TOAST = "Could not save card printing — try again";

// ---------------------------------------------------------------------------
// The requests the store sends
// ---------------------------------------------------------------------------

/** One request as the deck API received it. */
interface SentRequest {
  readonly method: string;
  /** Path and query string. */
  readonly url: string;
  readonly contentType: string | null;
  /** The parsed JSON body, or null when the request carried none. */
  readonly body: unknown;
}

let sent: SentRequest[] = [];

async function record(request: Request): Promise<void> {
  const url = new URL(request.url);
  const text = await request.text();
  sent.push({
    method: request.method,
    url: `${url.pathname}${url.search}`,
    contentType: request.headers.get("content-type"),
    body: text === "" ? null : JSON.parse(text),
  });
}

/** A handler body that records the request, then gives `reply`'s answer. */
function recordThen(reply: () => Response): HttpResponseResolver {
  return async ({ request }) => {
    await record(request);
    return reply();
  };
}

/** The ways a request can fail, as each failing test names them. */
const FAILURES = [
  {
    outcome: "a 4xx answer",
    reply: (error: string) => HttpResponse.json({ error }, { status: 404 }),
  },
  {
    outcome: "a 5xx answer",
    reply: (error: string) => HttpResponse.json({ error }, { status: 500 }),
  },
  {
    outcome: "a network error",
    reply: (_error: string) => HttpResponse.error(),
  },
] as const;

// ---------------------------------------------------------------------------
// Decks and cards
// ---------------------------------------------------------------------------

function deckCard(
  overrides: Partial<DeckCard> & Pick<DeckCard, "id" | "name">
): DeckCard {
  return {
    manaCost: "",
    cmc: 0,
    typeLine: "Artifact",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "artifact",
    quantity: 1,
    zone: "main",
    ...overrides,
  };
}

/** A basic land: the copy limit does not cap it (CR 903.5b). */
const ISLAND = deckCard({
  id: "row-island",
  scryfallId: "scry-island",
  name: "Island",
  typeLine: "Basic Land — Island",
  category: "land",
  quantity: 2,
});

const SOL_RING = deckCard({
  id: "row-sol-ring",
  scryfallId: "scry-sol-ring-c21",
  name: "Sol Ring",
  imageUri: "https://img.test/sol-ring-c21-grid.webp",
  artCropUri: "https://img.test/sol-ring-c21-art.webp",
  category: "ramp",
  notes: "Turn one, always",
});

/** The printing the player swaps Sol Ring to. */
const SOL_RING_LTC: ScryfallCard = {
  id: "scry-sol-ring-ltc",
  name: "Sol Ring",
  mana_cost: "{1}",
  cmc: 1,
  type_line: "Artifact",
  oracle_text: "{T}: Add {C}{C}.",
  color_identity: [],
  image_uris: {
    grid: "https://img.test/sol-ring-ltc-grid.webp",
    art: "https://img.test/sol-ring-ltc-art.webp",
  },
  keywords: [],
};

function savedDeck(): Deck {
  return {
    ...createEmptyDeck(DECK_ID, "Goblins"),
    cards: [ISLAND, SOL_RING],
  };
}

function guestDeck(): Deck {
  return { ...createGuestDeck(), cards: [ISLAND, SOL_RING] };
}

/** A deck as the listing route returns it: no main cards, a card count. */
function listedDeck(id: string, name: string): ApiDeck {
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
    _count: { cards: 2 },
    createdAt: "2026-11-11T00:00:00.000Z",
    updatedAt: "2026-11-11T00:00:00.000Z",
  };
}

const COPY = listedDeck(COPY_ID, "Goblins (Copy)");

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

/** The deck API routes, answering success. */
const DECK_ROUTES = [
  // The route answers the updated row; the store does not read it.
  http.patch(
    CARD_ROUTE,
    recordThen(() => HttpResponse.json({ success: true }))
  ),
  http.post(
    DUPLICATE_ROUTE,
    recordThen(() => HttpResponse.json(COPY, { status: 201 }))
  ),
  http.get(
    LISTING_ROUTE,
    recordThen(() =>
      HttpResponse.json({
        decks: [listedDeck(DECK_ID, "Goblins"), COPY],
        total: 2,
        page: 0,
        limit: 20,
      })
    )
  ),
];

function openDeck(deck: Deck): void {
  useDeckStore.setState({
    decks: { [deck.id]: deck },
    activeDeckId: deck.id,
    isSyncing: false,
    undoStack: [],
  });
}

function card(deckId: string, cardId: string): DeckCard | undefined {
  return useDeckStore
    .getState()
    .decks[deckId]?.cards.find((row) => row.id === cardId);
}

function toasts(): { readonly type: string; readonly message: string }[] {
  return useToastStore
    .getState()
    .toasts.map(({ type, message }) => ({ type, message }));
}

describe("the raw-fetch deck store actions", () => {
  const server = useMsw(...DECK_ROUTES);

  /** Makes every request to `route` fail with `failure`. */
  function failRoute(
    method: "patch" | "post",
    route: string,
    failure: (typeof FAILURES)[number],
    error: string
  ): void {
    server.use(
      http[method](
        route,
        recordThen(() => failure.reply(error))
      )
    );
  }

  beforeEach(() => {
    sent = [];
    localStorage.clear();
    useToastStore.setState({ toasts: [] });
    openDeck(savedDeck());
  });

  // ---------------------------------------------------------------------------
  // updateCardQuantity
  // ---------------------------------------------------------------------------

  describe("updateCardQuantity at the HTTP boundary", () => {
    it("sends PATCH /api/decks/[id]/cards/[cardId] with the new quantity as JSON", async () => {
      await useDeckStore.getState().updateCardQuantity(ISLAND.id, 1);

      expect(sent).toEqual([
        {
          method: "PATCH",
          url: `/api/decks/${DECK_ID}/cards/${ISLAND.id}`,
          contentType: "application/json",
          body: { quantity: 3 },
        },
      ]);
    });

    it("keeps the new quantity after a 2xx answer, with no toast", async () => {
      await useDeckStore.getState().updateCardQuantity(ISLAND.id, 1);

      expect(card(DECK_ID, ISLAND.id)?.quantity).toBe(3);
      expect(useDeckStore.getState().isSyncing).toBe(false);
      expect(toasts()).toEqual([]);
    });

    it.each(FAILURES)(
      "restores the saved quantity and says so after $outcome",
      async (failure) => {
        failRoute("patch", CARD_ROUTE, failure, "Card not found");

        await useDeckStore.getState().updateCardQuantity(ISLAND.id, 1);

        expect(sent).toHaveLength(1);
        expect(card(DECK_ID, ISLAND.id)?.quantity).toBe(2);
        expect(useDeckStore.getState().isSyncing).toBe(false);
        expect(toasts()).toEqual([
          { type: "error", message: QUANTITY_FAILURE_TOAST },
        ]);
      }
    );

    it("sends nothing when the copy limit leaves the quantity unchanged", async () => {
      // Sol Ring is not a basic land: one copy at most (CR 903.5b).
      await useDeckStore.getState().updateCardQuantity(SOL_RING.id, 1);

      expect(sent).toEqual([]);
      expect(card(DECK_ID, SOL_RING.id)?.quantity).toBe(1);
    });

    it("sends nothing for the guest deck and keeps the new quantity in this browser", async () => {
      openDeck(guestDeck());

      await useDeckStore.getState().updateCardQuantity(ISLAND.id, 1);

      expect(sent).toEqual([]);
      expect(card(GUEST_DECK_ID, ISLAND.id)?.quantity).toBe(3);
      expect(
        loadGuestDeck()?.cards.find((row) => row.id === ISLAND.id)?.quantity
      ).toBe(3);
      expect(useDeckStore.getState().isSyncing).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // swapCardPrinting
  // ---------------------------------------------------------------------------

  describe("swapCardPrinting at the HTTP boundary", () => {
    it("sends PATCH /api/decks/[id]/cards/[cardId] with the printing id and its two image URLs as JSON", async () => {
      await useDeckStore.getState().swapCardPrinting(SOL_RING.id, SOL_RING_LTC);

      expect(sent).toEqual([
        {
          method: "PATCH",
          url: `/api/decks/${DECK_ID}/cards/${SOL_RING.id}`,
          contentType: "application/json",
          body: {
            scryfallId: "scry-sol-ring-ltc",
            imageUri: "https://img.test/sol-ring-ltc-grid.webp",
            artCropUri: "https://img.test/sol-ring-ltc-art.webp",
          },
        },
      ]);
    });

    it("keeps the new printing, and the row's other fields, after a 2xx answer", async () => {
      await useDeckStore.getState().swapCardPrinting(SOL_RING.id, SOL_RING_LTC);

      // toMatchObject: the store also derives `isMaybeboard` on every row it rewrites.
      expect(card(DECK_ID, SOL_RING.id)).toMatchObject({
        ...SOL_RING,
        scryfallId: "scry-sol-ring-ltc",
        imageUri: "https://img.test/sol-ring-ltc-grid.webp",
        artCropUri: "https://img.test/sol-ring-ltc-art.webp",
      });
      expect(useDeckStore.getState().isSyncing).toBe(false);
      expect(toasts()).toEqual([]);
    });

    it.each(FAILURES)(
      "restores the previous printing and says so after $outcome",
      async (failure) => {
        failRoute("patch", CARD_ROUTE, failure, "Card not found");

        await useDeckStore
          .getState()
          .swapCardPrinting(SOL_RING.id, SOL_RING_LTC);

        expect(sent).toHaveLength(1);
        expect(card(DECK_ID, SOL_RING.id)).toMatchObject(SOL_RING);
        expect(useDeckStore.getState().isSyncing).toBe(false);
        expect(toasts()).toEqual([
          { type: "error", message: PRINTING_FAILURE_TOAST },
        ]);
      }
    );

    it("sends nothing for the guest deck and keeps the new printing in this browser", async () => {
      openDeck(guestDeck());

      await useDeckStore.getState().swapCardPrinting(SOL_RING.id, SOL_RING_LTC);

      expect(sent).toEqual([]);
      expect(card(GUEST_DECK_ID, SOL_RING.id)?.scryfallId).toBe(
        "scry-sol-ring-ltc"
      );
      expect(
        loadGuestDeck()?.cards.find((row) => row.id === SOL_RING.id)?.scryfallId
      ).toBe("scry-sol-ring-ltc");
      expect(useDeckStore.getState().isSyncing).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // duplicateDeck
  // ---------------------------------------------------------------------------

  describe("duplicateDeck at the HTTP boundary", () => {
    it("sends POST /api/decks/[id]/duplicate with no body, then reloads the deck listing", async () => {
      await useDeckStore.getState().duplicateDeck(DECK_ID);

      // The content type is left out on purpose: the route reads no body, and
      // DB-16's deck client (`deckApi.duplicateDeck`) adds a JSON one.
      expect(
        sent.map(({ method, url, body }) => ({ method, url, body }))
      ).toEqual([
        { method: "POST", url: `/api/decks/${DECK_ID}/duplicate`, body: null },
        { method: "GET", url: "/api/decks?page=0&limit=20", body: null },
      ]);
    });

    it("opens the copy, lists it, announces it and returns its id after a 2xx answer", async () => {
      const copyId = await useDeckStore.getState().duplicateDeck(DECK_ID);

      expect(copyId).toBe(COPY_ID);
      expect(useDeckStore.getState().activeDeckId).toBe(COPY_ID);
      expect(Object.keys(useDeckStore.getState().decks).sort()).toEqual([
        DECK_ID,
        COPY_ID,
      ]);
      expect(useDeckStore.getState().isSyncing).toBe(false);
      expect(toasts()).toEqual([
        { type: "success", message: 'Deck duplicated: "Goblins (Copy)"' },
      ]);
    });

    it.each(FAILURES.filter(({ outcome }) => outcome !== "a network error"))(
      "currently rejects with a generic error and no toast after $outcome (pinned; follow-up for B2-36)",
      async (failure) => {
        failRoute("post", DUPLICATE_ROUTE, failure, "Deck not found");

        await expect(
          useDeckStore.getState().duplicateDeck(DECK_ID)
        ).rejects.toThrow("Failed to duplicate deck");

        expect(sent.map(({ method }) => method)).toEqual(["POST"]);
        expect(useDeckStore.getState().activeDeckId).toBe(DECK_ID);
        expect(useDeckStore.getState().isSyncing).toBe(false);
        expect(toasts()).toEqual([]);
      }
    );

    it("currently rejects with the fetch error and no toast after a network error (pinned; follow-up for B2-36)", async () => {
      failRoute("post", DUPLICATE_ROUTE, FAILURES[2], "unused");

      await expect(
        useDeckStore.getState().duplicateDeck(DECK_ID)
      ).rejects.toThrow(TypeError);

      expect(sent.map(({ method }) => method)).toEqual(["POST"]);
      expect(useDeckStore.getState().activeDeckId).toBe(DECK_ID);
      expect(useDeckStore.getState().isSyncing).toBe(false);
      expect(toasts()).toEqual([]);
    });

    it("currently sends the request for the guest deck too; the builder hides the action instead (page.tsx:875)", async () => {
      openDeck(guestDeck());
      failRoute("post", DUPLICATE_ROUTE, FAILURES[0], "Deck not found");

      await expect(
        useDeckStore.getState().duplicateDeck(GUEST_DECK_ID)
      ).rejects.toThrow("Failed to duplicate deck");

      expect(sent.map(({ method, url }) => ({ method, url }))).toEqual([
        { method: "POST", url: `/api/decks/${GUEST_DECK_ID}/duplicate` },
      ]);
    });
  });
});
