/**
 * Solitary tests of the deal: a deck and its options in, the engine's starting zones and
 * session rules out. Moved from `store.test.ts` with the dealing (PT-01); the store's own tests
 * keep the cases that go through its actions (reset, tap, move).
 */
import { describe, it, expect } from "vitest";
import { buildSetup, dealFrom, type PlaytestOptions } from "./deal";
import type { PlaytestDeps, PlaytestEngine } from "./engine";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";

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
