/**
 * The fake deck API, driven through the real deck client.
 *
 * These tests pin the contract the store tests rely on: which operation each
 * request reaches, what a held deck keeps, and how a refusal, a failure and a
 * held answer reach the client. They do not prove that the fake matches the
 * real routes; a contract suite run against both would (ADR 0005, rule 3).
 */
import { describe, expect, it } from "vitest";
import * as deckClient from "@/lib/db/deck-api";
import type { ApiDeck } from "@/lib/db/deck-api";
import {
  DeckApiRefusal,
  emptyApiDeck,
  installFakeDeckClient,
} from "@/test/fake-deck-client";

const fake = installFakeDeckClient();

const SOL_RING = { scryfallId: "scry-sol-ring", name: "Sol Ring" };

function seededDeck(): ApiDeck {
  const deck = emptyApiDeck("deck-1", "Goblins");
  fake.seedDeck(deck);
  return deck;
}

describe("a deck the fake holds", () => {
  it("is what the client reads back", async () => {
    const deck = seededDeck();

    expect(await deckClient.fetchDeck("deck-1")).toEqual(deck);
    expect(fake.fetchDeck).toHaveBeenCalledWith("deck-1");
  });

  it("keeps the rows the client adds and changes", async () => {
    seededDeck();

    const row = await deckClient.addCard("deck-1", SOL_RING);
    await deckClient.updateCardNotes("deck-1", row.id, "Turn one");
    await deckClient.updateCardZone("deck-1", row.id, "sideboard");

    expect(fake.savedDeck("deck-1")?.cards).toEqual([
      expect.objectContaining({
        id: row.id,
        name: "Sol Ring",
        notes: "Turn one",
        zone: "sideboard",
      }),
    ]);
  });

  it("refuses to remove a row it does not hold, as the route does", async () => {
    seededDeck();

    await expect(deckClient.removeCard("deck-1", "row-gone")).rejects.toThrow(
      "[removeCard] HTTP 404: Card not found"
    );
  });

  it("applies a bulk change: removals, cleared slots, quantities, additions and the command zone", async () => {
    fake.seedDeck({
      ...emptyApiDeck("deck-1"),
      cards: [
        { ...(await deckClient.addCard("deck-1", SOL_RING)), id: "keep" },
        {
          ...(await deckClient.addCard("deck-1", {
            scryfallId: "scry-krenko",
            name: "Krenko, Mob Boss",
            isCommander: true,
          })),
          id: "commander",
        },
        { ...(await deckClient.addCard("deck-1", SOL_RING)), id: "drop" },
      ],
    });

    const saved = await deckClient.applyCardChanges("deck-1", {
      removeCardIds: ["drop"],
      quantityChanges: [{ cardId: "keep", quantity: 2 }],
      addCards: [{ scryfallId: "scry-arcane-signet", name: "Arcane Signet" }],
      clearCommandSlots: ["commander"],
      commandZone: {
        commanderId: null,
        commanderName: null,
        partnerId: null,
        companionId: null,
        pairingType: "none",
      },
    });

    expect(
      saved.cards.map(({ name, quantity }) => ({ name, quantity }))
    ).toEqual([
      { name: "Sol Ring", quantity: 2 },
      { name: "Arcane Signet", quantity: 1 },
    ]);
    expect(fake.savedDeck("deck-1")).toEqual(saved);
  });

  it("is listed without its rows, with a row count", async () => {
    fake.seedDeck({
      ...emptyApiDeck("deck-1"),
      cards: [await deckClient.addCard("deck-1", SOL_RING)],
    });

    const listing = await deckClient.fetchDecks();

    expect(listing).toEqual({
      decks: [
        expect.objectContaining({
          id: "deck-1",
          cards: [],
          _count: { cards: 1 },
        }),
      ],
      total: 1,
      page: 0,
      limit: 20,
    });
  });
});

describe("a deck the fake does not hold", () => {
  it("accepts every write and keeps nothing", async () => {
    await deckClient.updateDeck("deck-9", { name: "Renamed" });
    await deckClient.addCard("deck-9", SOL_RING);
    await deckClient.removeCard("deck-9", "row-1");

    expect(fake.savedDeck("deck-9")).toBeUndefined();
  });

  it("cannot be read", async () => {
    await expect(deckClient.fetchDeck("deck-9")).rejects.toThrow(
      "[fetchDeck] HTTP 404: Deck not found"
    );
  });
});

describe("the single-row PATCH", () => {
  const send = (body: unknown) =>
    fetch("/api/decks/deck-1/cards/row-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("reaches one operation per field the client writes", async () => {
    await deckClient.updateCardCategory("deck-1", "row-1", "ramp");
    await deckClient.updateCardNotes("deck-1", "row-1", null);
    await deckClient.updateCardZone("deck-1", "row-1", "maybeboard");
    await send({ quantity: 3 });
    await send({
      scryfallId: "scry-sol-ring-ltc",
      imageUri: "grid",
      artCropUri: "art",
    });

    expect(fake.updateCardCategory).toHaveBeenCalledWith(
      "deck-1",
      "row-1",
      "ramp"
    );
    expect(fake.updateCardNotes).toHaveBeenCalledWith("deck-1", "row-1", null);
    expect(fake.updateCardZone).toHaveBeenCalledWith(
      "deck-1",
      "row-1",
      "maybeboard"
    );
    expect(fake.updateCardQuantity).toHaveBeenCalledWith("deck-1", "row-1", 3);
    expect(fake.updateCardPrinting).toHaveBeenCalledWith("deck-1", "row-1", {
      scryfallId: "scry-sol-ring-ltc",
      imageUri: "grid",
      artCropUri: "art",
    });
  });

  it("answers 400 to a body it cannot decode", async () => {
    expect((await send({})).status).toBe(400);
  });
});

describe("a test steering one answer", () => {
  it("answers a DeckApiRefusal with its status and message", async () => {
    fake.updateDeck.mockRejectedValueOnce(
      new DeckApiRefusal(409, "Stale deck")
    );

    await expect(
      deckClient.updateDeck("deck-1", { name: "x" })
    ).rejects.toThrow("[updateDeck] HTTP 409: Stale deck");
  });

  it("fails the request at the network level for any other rejection", async () => {
    fake.updateDeck.mockRejectedValueOnce(new Error("offline"));

    await expect(
      deckClient.updateDeck("deck-1", { name: "x" })
    ).rejects.toThrow(TypeError);
  });

  it("holds the response until the operation's promise settles", async () => {
    const pending = Promise.withResolvers<ApiDeck>();
    fake.fetchDeck.mockReturnValueOnce(pending.promise);
    let answered = false;

    const read = deckClient.fetchDeck("deck-1").then((deck) => {
      answered = true;
      return deck;
    });
    await expect.poll(() => fake.fetchDeck.mock.calls.length).toBe(1);
    expect(answered).toBe(false);
    pending.resolve(emptyApiDeck("deck-1", "Held"));

    expect((await read).name).toBe("Held");
  });

  // The next two tests run in order on purpose: the second proves that the
  // first one's override and seeded deck did not outlive it.
  it("overrides an answer for one test", async () => {
    seededDeck();
    fake.fetchDeck.mockResolvedValue(emptyApiDeck("deck-1", "Override"));

    expect((await deckClient.fetchDeck("deck-1")).name).toBe("Override");
  });

  it("starts the next test with the default answers and no deck", async () => {
    expect(fake.fetchDeck).not.toHaveBeenCalled();
    await expect(deckClient.fetchDeck("deck-1")).rejects.toThrow("HTTP 404");
  });
});
