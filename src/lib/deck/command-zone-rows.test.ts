import { afterEach, describe, expect, it, vi } from "vitest";

import {
  removeReplacedCommandRows,
  withSavedCommandRow,
} from "./command-zone-rows";
import { createEmptyDeck } from "./store-factories";
import type { Deck, DeckCard } from "./types";

/**
 * Build a command-zone card as the store holds it.
 * @param id - Id the card carries
 * @param name - Card name
 * @returns A commander-category deck card
 */
function commandCard(id: string, name: string): DeckCard {
  return {
    id,
    scryfallId: `${id}-printing`,
    name,
    manaCost: "",
    cmc: 4,
    typeLine: "Legendary Creature",
    oracleText: "Partner",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "commander",
    quantity: 1,
    zone: "main",
  };
}

const THRASIOS = commandCard("thrasios", "Thrasios, Triton Hero");
const TYMNA = commandCard("tymna", "Tymna the Weaver");

/**
 * Hold one deck led by a Partner pair.
 * @returns The decks a store would hold
 */
function partnerDecks(): Readonly<Record<string, Deck>> {
  return {
    "deck-1": {
      ...createEmptyDeck("deck-1", "Partners"),
      commander: THRASIOS,
      partner: TYMNA,
      pairingType: "partner",
    },
  };
}

describe("withSavedCommandRow", () => {
  it("gives the placed partner its saved row id and keeps the commander", () => {
    const decks = withSavedCommandRow(partnerDecks(), {
      deckId: "deck-1",
      slot: "partner",
      placedId: "tymna",
      rowId: "row-7",
    });

    expect(decks["deck-1"]?.partner).toEqual({ ...TYMNA, id: "row-7" });
    expect(decks["deck-1"]?.commander).toBe(THRASIOS);
  });

  it("leaves a card placed after the save started alone", () => {
    const decks = partnerDecks();

    const result = withSavedCommandRow(decks, {
      deckId: "deck-1",
      slot: "commander",
      placedId: "an-older-choice",
      rowId: "row-7",
    });

    expect(result).toBe(decks);
  });

  it("leaves the decks alone when the deck was closed", () => {
    const decks = partnerDecks();

    const result = withSavedCommandRow(decks, {
      deckId: "deck-2",
      slot: "commander",
      placedId: "thrasios",
      rowId: "row-7",
    });

    expect(result).toBe(decks);
  });

  it("leaves the decks alone when the slot was emptied", () => {
    const emptied: Readonly<Record<string, Deck>> = {
      "deck-1": {
        ...createEmptyDeck("deck-1", "Partners"),
        commander: THRASIOS,
        partner: null,
      },
    };

    const result = withSavedCommandRow(emptied, {
      deckId: "deck-1",
      slot: "partner",
      placedId: "tymna",
      rowId: "row-7",
    });

    expect(result).toBe(emptied);
  });
});

/** The card-row delete route `deckApi.removeCard` calls for one row. */
function deleteRoute(rowId: string): string {
  return `/api/decks/deck-1/cards/${rowId}`;
}

/**
 * The deletes go through the real deck API client; only `fetch`, the HTTP
 * boundary, is replaced.
 */
describe("removeReplacedCommandRows", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the deletes of both replaced rows before either answers", async () => {
    let answer: () => void = () => {};
    const answered = new Promise<void>((resolve) => {
      answer = resolve;
    });
    const fetchStub = vi.fn<typeof fetch>(async () => {
      await answered;
      return new Response(null, { status: 200 });
    });
    vi.stubGlobal("fetch", fetchStub);

    const removal = removeReplacedCommandRows("deck-1", [THRASIOS, TYMNA], []);
    const sentBeforeAnyAnswer = fetchStub.mock.calls.map(([input]) => input);
    answer();
    await removal;

    expect(sentBeforeAnyAnswer).toEqual([
      deleteRoute("thrasios"),
      deleteRoute("tymna"),
    ]);
  });

  it("keeps the row of a card still on screen", async () => {
    const fetchStub = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 200 })
    );
    vi.stubGlobal("fetch", fetchStub);

    await removeReplacedCommandRows(
      "deck-1",
      [THRASIOS, TYMNA],
      [THRASIOS, null]
    );

    expect(fetchStub.mock.calls.map(([input]) => input)).toEqual([
      deleteRoute("tymna"),
    ]);
  });

  it("still deletes the other row when one delete fails, and never rejects", async () => {
    const fetchStub = vi.fn<typeof fetch>(
      async (input) =>
        new Response(null, {
          status: input === deleteRoute("thrasios") ? 500 : 200,
        })
    );
    vi.stubGlobal("fetch", fetchStub);

    await expect(
      removeReplacedCommandRows("deck-1", [THRASIOS, TYMNA], [])
    ).resolves.toBeUndefined();
    expect(fetchStub.mock.calls.map(([input]) => input)).toEqual([
      deleteRoute("thrasios"),
      deleteRoute("tymna"),
    ]);
  });
});
