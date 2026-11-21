/**
 * Solitary tests of the deal: a deck and its options in, the engine's starting zones and
 * session rules out. Moved from `store.test.ts` with the dealing (PT-01); the store's own tests
 * keep the cases that go through its actions (reset, tap, move).
 */
import { describe, it, expect } from "vitest";
import {
  buildSetup,
  dealFrom,
  isRandomDeal,
  trialCardChoices,
  type PlaytestOptions,
} from "./deal";
import type { PlaytestDeps, PlaytestEngine } from "./engine";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { seededRandom } from "@/test/seeded-random";

function makeCard(id: string, name = id): DeckCard {
  return aDeckCard({
    id,
    scryfallId: id,
    name,
    cmc: 1,
    typeLine: "Creature",
    category: "creature",
  });
}

function makeDeck(
  opts: {
    cardCount?: number;
    commander?: DeckCard | null;
    format?: Deck["format"];
  } = {}
): Deck {
  const {
    cardCount = 25,
    commander = makeCard("cmd", "Kenrith"),
    format = "commander",
  } = opts;
  return aDeck({
    name: "Test",
    format,
    commander,
    cards: Array.from({ length: cardCount }, (_, i) =>
      makeCard(`c${i}`, `Card ${i}`)
    ),
  });
}

/** Names of the cards in a zone, in order. */
function namesIn(cards: readonly DeckCard[] = []): readonly string[] {
  return cards.map((card) => card.name);
}

/** A 100-card Commander deck: Kenrith, 15 Forests in one row, and 84 singletons. */
function makeForestDeck(): Deck {
  const singletons = makeDeck({ cardCount: 84 }).cards;
  return {
    ...makeDeck(),
    cards: [{ ...makeCard("forest", "Forest"), quantity: 15 }, ...singletons],
  };
}

const GAME_START = Date.UTC(2026, 10, 10, 20, 0, 0);
/** Always picks the last index, so the Fisher–Yates shuffle swaps nothing. */
const inDeckOrder: PlaytestDeps = {
  random: { intBelow: (upperExclusive) => upperExclusive - 1 },
  clock: { now: () => GAME_START },
};

/** Deals `deck` as the store does at the start of a session, in deck order. */
function deal(deck: Deck, options: PlaytestOptions = {}): PlaytestEngine {
  return dealFrom(buildSetup(deck, options), inDeckOrder);
}

describe("dealing a Commander deck", () => {
  it("deals every copy into the 99 and starts the commander in the command zone", () => {
    const engine = deal(makeForestDeck());
    const dealt = [...engine.hand, ...engine.library];

    expect({
      dealt: dealt.length,
      forests: dealt.filter((card) => card.name === "Forest").length,
      commanderDealt: dealt.some((card) => card.name === "Kenrith"),
      commandZone: namesIn(engine.commandZone),
    }).toEqual({
      dealt: 99,
      forests: 15,
      commanderDealt: false,
      commandZone: ["Kenrith"],
    });
  });

  it("deals only the main deck, not the sideboard or the cards being considered", () => {
    const mainDeck = makeDeck({ cardCount: 20 });
    const deck: Deck = {
      ...mainDeck,
      cards: [
        ...mainDeck.cards,
        { ...makeCard("sb", "Negate"), quantity: 2, zone: "sideboard" },
        {
          ...makeCard("mb", "Maybe Card"),
          zone: "maybeboard",
          isMaybeboard: true,
        },
      ],
    };
    const engine = deal(deck);
    const dealt = namesIn([...engine.hand, ...engine.library]);

    expect(dealt).toHaveLength(20);
    expect(dealt).not.toContain("Negate");
    expect(dealt).not.toContain("Maybe Card");
  });

  it("leaves formats without a command zone as they were", () => {
    const modernDeck: Deck = {
      ...makeDeck({ cardCount: 59 }),
      format: "modern",
    };
    const engine = deal(modernDeck);
    const dealt = namesIn([...engine.hand, ...engine.library]);

    expect(dealt).toHaveLength(60);
    expect(dealt).toContain("Kenrith");
    expect(engine.commandZone).toEqual([]);
  });

  // Brawl's commander and Oathbreaker's oathbreaker both live in the commander slot.
  it.each(["brawl", "oathbreaker"] as const)(
    "starts the %s commander slot in the command zone",
    (format) => {
      const engine = deal({ ...makeDeck({ cardCount: 59 }), format });

      expect(engine.hand.length + engine.library.length).toBe(59);
      expect(namesIn(engine.commandZone)).toEqual(["Kenrith"]);
    }
  );
});

describe("the session rules the table size decides", () => {
  it("keeps the free mulligan in a one-on-one Brawl game", () => {
    const engine = deal(makeDeck({ format: "brawl" }), { multiplayer: false });

    expect(engine.firstMulliganFree).toBe(true);
  });

  // The table size decides the first-turn draw (CR 103.8a, 103.8c). No pod
  // size is stored, so an unanswered question falls back on the format's
  // usual table.
  it.each([
    { format: "commander", options: {}, multiplayer: true },
    {
      format: "commander",
      options: { multiplayer: false },
      multiplayer: false,
    },
    { format: "modern", options: {}, multiplayer: false },
  ] as const)(
    "deals a $format game with options $options as multiplayer: $multiplayer",
    ({ format, options, multiplayer }) => {
      const engine = deal(makeDeck({ format }), options);

      expect(engine.multiplayer).toBe(multiplayer);
    }
  );

  // CR 903.12f: 25 life in a two-player Brawl game, 30 in a multiplayer one.
  // Other formats start on the same total at any table (CR 103.4c: 40 in Commander).
  it.each([
    { format: "brawl", options: { multiplayer: false }, life: 25 },
    { format: "brawl", options: { multiplayer: true }, life: 30 },
    { format: "brawl", options: {}, life: 30 },
    { format: "commander", options: { multiplayer: false }, life: 40 },
  ] as const)(
    "starts a $format game with options $options at $life life",
    ({ format, options, life }) => {
      const engine = deal(makeDeck({ format }), options);

      expect(engine.lifeTotal).toBe(life);
    }
  );

  it("starts Commander decks on 40 life", () => {
    expect(deal(makeDeck()).lifeTotal).toBe(40);
  });

  it("starts non-Commander decks on the format life total", () => {
    const modernDeck = {
      ...makeDeck({ commander: null }),
      format: "modern" as const,
    };

    expect(deal(modernDeck).lifeTotal).toBe(20);
  });
});

/** A 100-card Commander deck holding the two cards a player has just added. */
function makeNewCardsDeck(): Deck {
  const deck = makeForestDeck();
  return {
    ...deck,
    cards: [
      ...deck.cards.slice(0, -2),
      makeCard("tithe", "Smothering Tithe"),
      makeCard("ring", "Sol Ring"),
    ],
  };
}

describe("a new-card trial", () => {
  it("deals two chosen cards into the opening hand and keeps them out of the library", () => {
    const engine = deal(makeNewCardsDeck(), {
      trialCardIds: ["tithe", "ring"],
    });

    expect({
      hand: engine.hand.length,
      chosenInHand: namesIn(engine.hand).filter((name) =>
        ["Smothering Tithe", "Sol Ring"].includes(name)
      ),
      library: engine.library.length,
      chosenInLibrary: engine.library.filter((card) =>
        ["tithe", "ring"].includes(card.id)
      ).length,
    }).toEqual({
      hand: 7,
      chosenInHand: ["Smothering Tithe", "Sol Ring"],
      library: 99 - 7,
      chosenInLibrary: 0,
    });
  });

  it("refuses an eighth chosen copy: the first seven start in hand, the eighth stays in the library", () => {
    const chosen = ["c0", "c1", "c2", "c3", "c4", "c5", "c6", "c7"];
    const engine = deal(makeNewCardsDeck(), { trialCardIds: chosen });

    expect({
      hand: engine.hand.map((card) => card.id),
      eighthInLibrary: engine.library.some((card) => card.id === "c7"),
    }).toEqual({ hand: chosen.slice(0, 7), eighthInLibrary: true });
  });

  it("deals a row with two copies twice when both copies are chosen", () => {
    const deck = makeForestDeck();
    const engine = deal(deck, { trialCardIds: ["forest", "forest#2"] });

    expect(engine.hand.slice(0, 2).map((card) => card.id)).toEqual([
      "forest",
      "forest#2",
    ]);
    expect(engine.library.some((card) => card.id === "forest#2")).toBe(false);
  });

  it("never deals a commander from the command zone into the hand", () => {
    const engine = deal(makeNewCardsDeck(), { trialCardIds: ["cmd", "tithe"] });

    expect({
      commandZone: namesIn(engine.commandZone),
      commanderInHand: namesIn(engine.hand).includes("Kenrith"),
      first: engine.hand[0]?.name,
    }).toEqual({
      commandZone: ["Kenrith"],
      commanderInHand: false,
      first: "Smothering Tithe",
    });
  });

  it("offers only main-deck copies to choose from, one per physical copy", () => {
    const deck: Deck = {
      ...makeDeck({ cardCount: 1 }),
      cards: [
        { ...makeCard("bolt", "Lightning Bolt"), quantity: 2 },
        { ...makeCard("sb", "Negate"), zone: "sideboard" },
        { ...makeCard("mb", "Maybe Card"), zone: "maybeboard" },
      ],
    };

    expect(
      trialCardChoices(deck.cards).map(({ card, copy, copies }) => ({
        id: card.id,
        copy,
        copies,
      }))
    ).toEqual([
      { id: "bolt", copy: 1, copies: 2 },
      { id: "bolt#2", copy: 2, copies: 2 },
    ]);
  });

  it("deals the same hand from the same seed and the same chosen cards", () => {
    const setup = buildSetup(makeNewCardsDeck(), { trialCardIds: ["tithe"] });
    const first = dealFrom(setup, { random: seededRandom(7) });
    const second = dealFrom(setup, { random: seededRandom(7) });

    expect(second.hand.map((card) => card.id)).toEqual(
      first.hand.map((card) => card.id)
    );
    expect(first.hand[0]?.id).toBe("tithe");
  });

  it("opens the action log with a line naming the chosen cards", () => {
    const engine = deal(makeNewCardsDeck(), {
      trialCardIds: ["tithe", "ring"],
    });

    expect(engine.actionLog).toEqual([
      {
        id: 1,
        turn: 1,
        phase: "Draw",
        description: "Started with chosen cards: Smothering Tithe, Sol Ring",
      },
    ]);
    expect(engine.nextActionId).toBe(2);
  });

  it("keeps a random deal's log empty and its setup random", () => {
    const setup = buildSetup(makeNewCardsDeck(), {});

    expect(isRandomDeal(setup)).toBe(true);
    expect(dealFrom(setup, inDeckOrder).actionLog).toEqual([]);
    expect(
      isRandomDeal(buildSetup(makeNewCardsDeck(), { trialCardIds: ["ring"] }))
    ).toBe(false);
  });
});

describe("the shuffle", () => {
  it("deals the opening hand in the order its random source dictates", () => {
    const engine = deal(makeDeck());

    expect(engine.hand.map((card) => card.id)).toEqual([
      "c0",
      "c1",
      "c2",
      "c3",
      "c4",
      "c5",
      "c6",
    ]);
  });
});
