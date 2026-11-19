/**
 * Deck Lab card classification (I-31 requirement 2, slice 2): the spec's classification table
 * replayed on real Oracle text, then zones, quantities, overrides, the fallback count and
 * determinism. Sociable: each card goes through the app's own Scryfall mapper (`makeDeckCard`)
 * before it is classified, as a saved deck's card would.
 */
import { describe, expect, it } from "vitest";

import { makeDeckCard } from "@/lib/deck/store-card-faces";
import type { DeckCard } from "@/lib/deck/types";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";

import { classifyDeck } from "./classify-deck";
import {
  RECORDED_LAB_CARDS,
  type RecordedLabCardHandle,
} from "./fixtures/scryfall-lab-cards-v1";
import type { LabCard, LabCardOverride } from "./types";

/** The recorded card as a deck stores it, with its handle as row id. */
function recorded(
  handle: RecordedLabCardHandle,
  overrides: Partial<DeckCard> = {}
): DeckCard {
  return {
    ...makeDeckCard(RECORDED_LAB_CARDS[handle]),
    id: handle,
    ...overrides,
  };
}

/** Classifies a deck holding only `cards`, with no commander and no override. */
function classifyCards(
  cards: readonly DeckCard[],
  overrides: ReadonlyMap<string, LabCardOverride> = new Map()
) {
  return classifyDeck({ deck: aDeck({ cards: [...cards] }), overrides });
}

/** The one lab card a single-card deck classifies to. */
function classifyOne(handle: RecordedLabCardHandle): LabCard | undefined {
  return classifyCards([recorded(handle)]).library[0];
}

const NO_PIPS = { W: 0, U: 0, B: 0, R: 0, G: 0 };

describe("classifyDeck — the spec's classification table", () => {
  it.each<[RecordedLabCardHandle, Partial<LabCard>]>([
    [
      "solRing",
      {
        kind: "rock",
        cost: 1,
        out: 2,
        produces: { kind: "colours", colours: [] },
        ruleId: "mana-rock",
      },
    ],
    [
      "arcaneSignet",
      {
        kind: "rock",
        cost: 2,
        out: 1,
        produces: { kind: "identity" },
        ruleId: "mana-rock",
      },
    ],
    [
      "azoriusSignet",
      {
        kind: "rock",
        cost: 2,
        out: 1,
        produces: { kind: "colours", colours: ["W", "U"] },
        ruleId: "filter-rock",
      },
    ],
    [
      "commandTower",
      {
        kind: "land",
        cost: 0,
        out: 1,
        entersTapped: false,
        produces: { kind: "identity" },
        dependsOnOpponents: false,
        ruleId: "untapped-land",
      },
    ],
    [
      "cultivate",
      {
        kind: "lramp",
        cost: 3,
        pips: { ...NO_PIPS, G: 1 },
        out: 1,
        toHand: 1,
        entersTapped: true,
        fetchTypes: ["basic"],
        ruleId: "land-search-ramp",
      },
    ],
    [
      "llanowarElves",
      {
        kind: "dork",
        cost: 1,
        out: 1,
        produces: { kind: "colours", colours: ["G"] },
        ruleId: "mana-creature",
      },
    ],
    [
      "floodedStrand",
      {
        kind: "fetch",
        fetchTypes: ["Plains", "Island"],
        produces: { kind: "colours", colours: ["W", "U"] },
        entersTapped: false,
        ruleId: "fetch-land",
      },
    ],
    [
      "evolvingWilds",
      {
        kind: "fetch",
        fetchTypes: ["basic"],
        produces: { kind: "identity" },
        entersTapped: true,
        ruleId: "fetch-land",
      },
    ],
    [
      "hallowedFountain",
      {
        kind: "land",
        entersTapped: false,
        produces: { kind: "colours", colours: ["W", "U"] },
        ruleId: "conditionally-tapped-land",
      },
    ],
    [
      "tranquilCove",
      {
        kind: "tland",
        entersTapped: true,
        produces: { kind: "colours", colours: ["W", "U"] },
        ruleId: "tapped-land",
      },
    ],
    [
      "shatterskullSmashing",
      {
        kind: "mdfc",
        cost: 2,
        pips: { ...NO_PIPS, R: 2 },
        out: 1,
        entersTapped: false,
        produces: { kind: "colours", colours: ["R"] },
        ruleId: "mdfc-land-back",
      },
    ],
    [
      "exoticOrchard",
      {
        kind: "land",
        produces: { kind: "identity" },
        dependsOnOpponents: true,
        ruleId: "untapped-land",
      },
    ],
  ])("classifies %s as documented", (handle, expected) => {
    expect(classifyOne(handle)).toMatchObject({
      ...expected,
      overridden: false,
    });
  });
});

describe("classifyDeck — the other kinds", () => {
  it.each<[RecordedLabCardHandle, Partial<LabCard>]>([
    [
      "forest",
      {
        kind: "land",
        out: 1,
        produces: { kind: "colours", colours: ["G"] },
        ruleId: "basic-land",
      },
    ],
    ["harmonize", { kind: "draw", cost: 4, drawN: 3, ruleId: "burst-draw" }],
    [
      "phyrexianArena",
      { kind: "engine", cost: 3, drawN: 1, ruleId: "draw-engine" },
    ],
    [
      "fellwarStone",
      {
        kind: "rock",
        cost: 2,
        out: 1,
        produces: { kind: "identity" },
        dependsOnOpponents: true,
        ruleId: "mana-rock",
      },
    ],
    [
      "rampantGrowth",
      {
        kind: "lramp",
        cost: 2,
        out: 1,
        toHand: 0,
        entersTapped: true,
        fetchTypes: ["basic"],
        ruleId: "land-search-ramp",
      },
    ],
  ])("classifies %s", (handle, expected) => {
    expect(classifyOne(handle)).toMatchObject(expected);
  });
});

describe("classifyDeck — edge cases", () => {
  it.each<[string, RecordedLabCardHandle, Partial<LabCard>]>([
    [
      "a transforming card with a land back is a spell, and its reminder text adds no mana",
      "treasureMap",
      { kind: "spell", cost: 2, out: 0, ruleId: "spell-fallback" },
    ],
    [
      "a modal card with a land on each face is a land, read from its front",
      "hengegatePathway",
      {
        kind: "land",
        produces: { kind: "colours", colours: ["W"] },
        ruleId: "untapped-land",
      },
    ],
    [
      "a check land plays untapped, its condition met",
      "glacialFortress",
      {
        kind: "land",
        entersTapped: false,
        ruleId: "conditionally-tapped-land",
      },
    ],
    [
      "a land that makes no mana adds none",
      "mazeOfIth",
      { kind: "land", out: 0, produces: { kind: "colours", colours: [] } },
    ],
    [
      "a land-ramp spell that finds two basics puts both onto the battlefield",
      "explosiveVegetation",
      {
        kind: "lramp",
        out: 2,
        toHand: 0,
        entersTapped: true,
        fetchTypes: ["basic"],
      },
    ],
  ])("%s", (_behaviour, handle, expected) => {
    expect(classifyOne(handle)).toMatchObject(expected);
  });
});

describe("classifyDeck — fallback", () => {
  it("files a card no rule matches as a spell at its mana value, and counts it", () => {
    const unknown = aDeckCard({
      id: "unknown",
      name: "Unknown Card",
      cmc: 5,
      typeLine: "Creature",
    });

    const result = classifyCards([
      recorded("counterspell"),
      unknown,
      recorded("solRing"),
    ]);

    expect(
      result.library.find((card) => card.name === "Counterspell")
    ).toMatchObject({
      kind: "spell",
      cost: 2,
      pips: { ...NO_PIPS, U: 2 },
      ruleId: "spell-fallback",
    });
    expect(
      result.library.find((card) => card.name === "Unknown Card")
    ).toMatchObject({
      kind: "spell",
      cost: 5,
      ruleId: "spell-fallback",
    });
    expect(result.fallbackCount).toBe(2);
  });
});

describe("classifyDeck — zones and quantities", () => {
  it("expands each main-deck row into one lab card per copy", () => {
    const result = classifyCards([
      recorded("forest", { quantity: 30 }),
      recorded("solRing"),
    ]);

    expect(result.library).toHaveLength(31);
    expect(
      result.library.filter((card) => card.name === "Forest")
    ).toHaveLength(30);
  });

  it("puts the commanders in the command zone, not the library", () => {
    const commander = aDeckCard({
      id: "cmd",
      name: "Kenrith, the Returned King",
      cmc: 5,
    });
    const partner = recorded("llanowarElves", { id: "partner" });
    const deck = aDeck({ commander, partner, cards: [recorded("solRing")] });

    const result = classifyDeck({ deck, overrides: new Map() });

    expect(result.commandZone.map((card) => card.name)).toEqual([
      "Kenrith, the Returned King",
      "Llanowar Elves",
    ]);
    expect(result.library.map((card) => card.name)).toEqual(["Sol Ring"]);
  });

  it("leaves Sideboard and Considering cards out", () => {
    const result = classifyCards([
      recorded("solRing"),
      recorded("counterspell", { zone: "sideboard" }),
      recorded("harmonize", { zone: "maybeboard", isMaybeboard: true }),
    ]);

    expect(result.library.map((card) => card.name)).toEqual(["Sol Ring"]);
  });
});

describe("classifyDeck — overrides", () => {
  it("applies an override to every copy and marks it overridden, keeping the rule that classified it", () => {
    const smashing = RECORDED_LAB_CARDS.shatterskullSmashing.name;
    const overrides = new Map<string, LabCardOverride>([
      [smashing, { kind: "spell" }],
    ]);

    const result = classifyCards(
      [recorded("shatterskullSmashing", { quantity: 2 }), recorded("solRing")],
      overrides
    );

    expect(result.library.filter((card) => card.name === smashing)).toEqual([
      expect.objectContaining({
        kind: "spell",
        overridden: true,
        ruleId: "mdfc-land-back",
      }),
      expect.objectContaining({
        kind: "spell",
        overridden: true,
        ruleId: "mdfc-land-back",
      }),
    ]);
    expect(
      result.library.find((card) => card.name === "Sol Ring")
    ).toMatchObject({
      kind: "rock",
      overridden: false,
    });
  });

  it("no longer counts an overridden fallback card as a fallback", () => {
    const overrides = new Map<string, LabCardOverride>([
      ["Counterspell", { kind: "draw", drawN: 0 }],
    ]);

    const result = classifyCards([recorded("counterspell")], overrides);

    expect(result.fallbackCount).toBe(0);
  });
});

describe("classifyDeck — determinism", () => {
  it("gives the same result whatever the order of the deck's rows", () => {
    const rows = [
      recorded("forest", { quantity: 3 }),
      recorded("cultivate"),
      recorded("counterspell"),
      recorded("shatterskullSmashing"),
      recorded("solRing"),
    ];

    expect(classifyCards([...rows].reverse())).toEqual(classifyCards(rows));
  });
});
