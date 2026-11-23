import { describe, expect, it } from "vitest";

import { classifyLand } from "./land-classifier";
import { LAND_CYCLE_TABLE, LAND_CYCLES } from "./land-cycles";

/** A land face as a deck row stores it, with Scryfall's current Oracle wording. */
function land(typeLine: string, oracleText: string) {
  return { typeLine, oracleText, colorIdentity: [] };
}

const STEAM_VENTS = land(
  "Land — Island Mountain",
  "({T}: Add {U} or {R}.)\nAs this land enters, you may pay 2 life. If you don't, it enters tapped."
);
const SPIREBLUFF_CANAL = land(
  "Land",
  "This land enters tapped unless you control two or fewer other lands.\n{T}: Add {U} or {R}."
);
const IZZET_BOILERWORKS = land(
  "Land",
  "This land enters tapped.\nWhen this land enters, return a land you control to its owner's hand.\n{T}: Add {U}{R}."
);
const SHIVAN_REEF = land(
  "Land",
  "{T}: Add {C}.\n{T}: Add {U} or {R}. This land deals 1 damage to you."
);
const RAGING_RAVINE = land(
  "Land",
  'This land enters tapped.\n{T}: Add {R} or {G}.\n{2}{R}{G}: Until end of turn, this land becomes a 3/3 red and green Elemental creature with "Whenever this creature attacks, put a +1/+1 counter on it." It\'s still a land.'
);
const MISHRAS_FACTORY = land(
  "Land",
  "{T}: Add {C}.\n{1}: This land becomes a 2/2 Assembly-Worker artifact creature until end of turn. It's still a land."
);
const POLLUTED_DELTA = land(
  "Land",
  "{T}, Pay 1 life, Sacrifice this land: Search your library for an Island or Swamp card, put it onto the battlefield, then shuffle."
);
const EVOLVING_WILDS = land(
  "Land",
  "{T}, Sacrifice this land: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle."
);
const SOL_RING = land("Artifact", "{T}: Add {C}{C}.");

describe("classifyLand: a land in a cycle", () => {
  it("makes a shock land paid: it enters untapped for 2 life", () => {
    expect(classifyLand(STEAM_VENTS, "shockland")).toMatchObject({
      entry: { class: "paid", cost: "pay 2 life" },
      cycle: "shockland",
    });
  });

  it("makes a fast land conditional on two or fewer other lands", () => {
    expect(classifyLand(SPIREBLUFF_CANAL, "fastland")).toMatchObject({
      entry: {
        class: "conditional",
        condition: "you control two or fewer other lands",
      },
    });
  });

  it("makes a bounce land always tapped", () => {
    expect(classifyLand(IZZET_BOILERWORKS, "bounceland")?.entry).toEqual({
      class: "tapped",
    });
  });

  it("takes the cycle's class over the text: a pain land is paid although its text enters untapped", () => {
    expect(classifyLand(SHIVAN_REEF, "painland")?.entry).toEqual({
      class: "paid",
      cost: "1 damage when it taps for coloured mana",
    });
  });

  it("reads each creature land's own text, since the cycle mixes tapped and untapped lands", () => {
    expect(classifyLand(RAGING_RAVINE, "creatureland")?.entry).toEqual({
      class: "tapped",
    });
    expect(classifyLand(MISHRAS_FACTORY, "creatureland")?.entry).toEqual({
      class: "untapped",
    });
  });
});

describe("classifyLand: a land outside any cycle reads its Oracle text", () => {
  it("is always tapped when it enters tapped without a condition", () => {
    expect(classifyLand(IZZET_BOILERWORKS)).toMatchObject({
      entry: { class: "tapped" },
      cycle: undefined,
    });
  });

  it("is conditional on its unless clause", () => {
    expect(classifyLand(SPIREBLUFF_CANAL)?.entry).toEqual({
      class: "conditional",
      condition: "you control two or fewer other lands",
    });
  });

  it("is paid when the player may pay life to keep it untapped", () => {
    expect(classifyLand(STEAM_VENTS)?.entry).toEqual({
      class: "paid",
      cost: "pay 2 life",
    });
  });

  it("is untapped when its text never taps it", () => {
    expect(classifyLand(SHIVAN_REEF)?.entry).toEqual({ class: "untapped" });
  });
});

describe("classifyLand: what a land makes and fetches", () => {
  it("names the colours a land makes", () => {
    expect(classifyLand(SPIREBLUFF_CANAL)).toMatchObject({
      produces: { kind: "colours", colours: ["U", "R"] },
      fetchTypes: [],
      fetchesAnyBasic: false,
    });
  });

  it("names the land types a fetch land finds, and the colours they bring", () => {
    expect(classifyLand(POLLUTED_DELTA, "fetchland")).toMatchObject({
      produces: { kind: "colours", colours: ["U", "B"] },
      fetchTypes: ["Island", "Swamp"],
      fetchesAnyBasic: false,
      entry: { class: "untapped" },
    });
  });

  it("marks a fetch for any basic land, which is tapped when the land it finds enters tapped", () => {
    expect(classifyLand(EVOLVING_WILDS)).toMatchObject({
      produces: { kind: "identity" },
      fetchTypes: [],
      fetchesAnyBasic: true,
      entry: { class: "tapped" },
    });
  });

  it("gives no land facts for a card that is not a land", () => {
    expect(classifyLand(SOL_RING)).toBeUndefined();
  });
});

describe("LAND_CYCLE_TABLE", () => {
  it("is dated and keyed by the 21 land-cycle keywords Scryfall answered on 2026-11-10", () => {
    expect(LAND_CYCLE_TABLE.keywordsCheckedOn).toBe("2026-11-10");
    expect(LAND_CYCLES).toHaveLength(21);
    expect(Object.keys(LAND_CYCLE_TABLE.cycles).sort()).toEqual(
      [...LAND_CYCLES].sort()
    );
  });
});
