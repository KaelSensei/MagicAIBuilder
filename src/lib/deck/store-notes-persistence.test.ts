/**
 * Card notes, from the store action to the stored row.
 *
 * The other store tests answer from a fake of the deck API
 * (`src/test/fake-deck-client.ts`), so they cannot see what the server keeps:
 * a note the route's schema silently dropped still looked saved.
 * Here the store calls the real client API, a fetch stub hands the request to
 * the real PATCH route, and only Prisma and the session check are replaced.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** The notes column of the one deck row the fake database holds. */
const db = vi.hoisted((): { notes: string | null } => ({ notes: null }));

vi.mock(import("@/lib/auth/helpers"), () => ({
  requireDeckOwner: vi.fn(async () => ({
    userId: "owner-1",
    deck: { id: "deck-1", userId: "owner-1" },
  })),
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  const storedRow = () => ({ id: "card-1", deckId: "deck-1", notes: db.notes });
  const deckCard = {
    findFirst: vi.fn(async () => storedRow()),
    update: vi.fn(async ({ data }: { data: { notes?: string | null } }) => {
      if (data.notes !== undefined) db.notes = data.notes;
      return storedRow();
    }),
  };
  // The deck repository claims the deck's next version and reads it back in
  // the card's transaction (lib/deck/deck-repository.ts).
  const deck = {
    updateMany: vi.fn(async () => ({ count: 1 })),
    findUnique: vi.fn(async () => ({ version: 1 })),
  };
  return stubPrisma(await importOriginal(), {
    deckCard,
    deck,
    // The route writes the card and the deck in one transaction (B2-09); this
    // fake has no rollback to model, so the transaction runs on the same tables.
    $transaction: (
      run: (tx: {
        deck: typeof deck;
        deckCard: typeof deckCard;
      }) => Promise<unknown>
    ) => run({ deck, deckCard }),
  });
});

import { PATCH } from "@/app/api/decks/[id]/cards/[cardId]/route";
import { createGuestDeck, GUEST_DECK_ID, loadGuestDeck } from "./guest-deck";
import type { Deck, DeckCard } from "./types";
import { recordToasts } from "@/test/toast-recorder";

const { useDeckStore } = await import("./store");
const toastAdd = recordToasts();

const CARD_ROUTE = /^\/api\/decks\/([^/]+)\/cards\/([^/]+)$/;

/** Answers the single-card PATCH with the real route handler; any other request fails the test. */
async function serveCardRoute(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = new URL(
    input instanceof Request ? input.url : String(input),
    "http://localhost"
  );
  const [, id, cardId] = CARD_ROUTE.exec(url.pathname) ?? [];
  if (init?.method !== "PATCH" || id === undefined || cardId === undefined) {
    throw new Error(
      `Unexpected request: ${init?.method ?? "GET"} ${url.pathname}`
    );
  }
  return PATCH(new Request(url, init), {
    params: Promise.resolve({ id, cardId }),
  });
}

const fetchStub = vi.fn(serveCardRoute);

function counterspell(notes: string | null): DeckCard {
  return {
    id: "card-1",
    scryfallId: "4f616706-ec97-4923-bb1e-11a69fbaa1f8",
    name: "Counterspell",
    manaCost: "{U}{U}",
    cmc: 2,
    typeLine: "Instant",
    oracleText: "Counter target spell.",
    colorIdentity: ["U"],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "instant",
    quantity: 1,
    notes,
    zone: "main",
  };
}

/**
 * A saved deck. The guest factory is the shortest complete `Deck`; a database
 * id instead of the guest id makes the store save it through the API.
 */
function savedDeck(cards: DeckCard[]): Deck {
  return { ...createGuestDeck(), id: "deck-1", name: "Saved Deck", cards };
}

function openDeck(deck: Deck): void {
  useDeckStore.setState({
    decks: { [deck.id]: deck },
    activeDeckId: deck.id,
    isSyncing: false,
  });
}

function storeNotes(deckId: string): DeckCard["notes"] {
  return useDeckStore
    .getState()
    .decks[deckId]?.cards.find((card) => card.id === "card-1")?.notes;
}

beforeEach(() => {
  db.notes = null;
  toastAdd.mockClear();
  fetchStub.mockClear();
  vi.stubGlobal("fetch", fetchStub);
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("updateCardNotes — saved deck", () => {
  beforeEach(() => {
    openDeck(savedDeck([counterspell(null)]));
  });

  it("stores the note the player wrote", async () => {
    await useDeckStore
      .getState()
      .updateCardNotes("card-1", "Hold up for the combo turn");

    expect(db.notes).toBe("Hold up for the combo turn");
    expect(storeNotes("deck-1")).toBe("Hold up for the combo turn");
    expect(toastAdd).not.toHaveBeenCalled();
  });

  it("clears the stored note", async () => {
    db.notes = "Old note";
    openDeck(savedDeck([counterspell("Old note")]));

    await useDeckStore.getState().updateCardNotes("card-1", null);

    expect(db.notes).toBeNull();
    expect(storeNotes("deck-1")).toBeNull();
  });
});

describe("updateCardNotes — guest deck", () => {
  it("keeps the note in the browser and sends no request", async () => {
    openDeck({ ...createGuestDeck(), cards: [counterspell(null)] });

    await useDeckStore.getState().updateCardNotes("card-1", "Proxy this one");

    expect(fetchStub).not.toHaveBeenCalled();
    expect(storeNotes(GUEST_DECK_ID)).toBe("Proxy this one");
    expect(
      loadGuestDeck()?.cards.find((card) => card.id === "card-1")?.notes
    ).toBe("Proxy this one");
  });
});
