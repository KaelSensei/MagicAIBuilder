import { describe, expect, it } from "vitest";

import { aDeckCard } from "@/test/builders/card";
import { aScryfallCard } from "@/test/builders/scryfall";

import { makeDeckCard, rebuildCardFaces } from "./store-card-faces";
import { buildTokenLibrary, formatTokenLibrary } from "./token-library";
import type { DeckCard } from "./types";

/** The faces of Liliana, Heretical Healer // Liliana, Defiant Necromancer, as Scryfall prints them. */
const LILIANA_FRONT = {
  name: "Liliana, Heretical Healer",
  oracleText:
    "Lifelink\nWhenever another nontoken creature you control dies, exile Liliana, Heretical Healer, then return her to the battlefield transformed under her owner's control. If you do, create a 2/2 black Zombie creature token.",
};
const LILIANA_BACK = {
  name: "Liliana, Defiant Necromancer",
  oracleText:
    '+2: Each player discards a card.\n−X: Return target nonlegendary creature card with mana value X from your graveyard to the battlefield.\n−8: You get an emblem with "Whenever a creature dies, return it to the battlefield under your control at the beginning of the next end step."',
};

function card(name: string, oracleText: string): DeckCard {
  return {
    id: name,
    name,
    manaCost: "",
    cmc: 3,
    typeLine: "Creature",
    oracleText,
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "creature",
    quantity: 1,
    zone: "main",
    scryfallId: name,
  };
}

describe("buildTokenLibrary", () => {
  it.each([
    ["Creates ten 2/2 blue black Zombie creature tokens.", "Zombie", ["blue", "black"], 10],
    ["Create 12 0/1 colorless Eldrazi-Spawn tokens.", "Eldrazi-Spawn", ["colorless"], 12],
    ["Create a 1/1 green token.", "green", [], 1],
    ["Create 1/1 Elf token.", "Elf", [], 1],
    ["Create an 1/1 WHITE Soldier creature token.", "Soldier", ["WHITE"], 1],
  ])("preserves the existing token grammar for %s", (text, name, colors, count) => {
    expect(buildTokenLibrary([card("Source", text)])).toEqual([
      expect.objectContaining({ name, colors, count }),
    ]);
  });

  it("ignores unsupported amounts without hiding a later valid creation", () => {
    expect(buildTokenLibrary([card("Source", "Create several 1/1 Elf tokens. Create two 2/2 Wolf tokens.")]))
      .toEqual([expect.objectContaining({ name: "Wolf", count: 2 })]);
  });

  it("extracts and deduplicates created tokens and emblems", () => {
    const entries = buildTokenLibrary([
      card("Raise the Alarm", "Create two 1/1 white Soldier creature tokens."),
      card(
        "Garruk",
        "Create a 3/3 green Beast creature token. You get an emblem with trample."
      ),
      card("Another", "Create a 1/1 white Soldier creature token."),
    ]);

    expect(entries).toEqual([
      {
        name: "Soldier",
        power: "1/1",
        colors: ["white"],
        count: 3,
        kind: "token",
      },
      {
        name: "Beast",
        power: "3/3",
        colors: ["green"],
        count: 1,
        kind: "token",
      },
      {
        name: "Garruk Emblem",
        power: null,
        colors: [],
        count: 1,
        kind: "emblem",
      },
    ]);
  });

  it("names each emblem after the card that gives it (CR 114.2)", () => {
    const entries = buildTokenLibrary([
      card(
        "Elspeth, Sun's Champion",
        '−7: You get an emblem with "Creatures you control get +2/+2 and have flying."'
      ),
      card(
        "Chandra, Torch of Defiance",
        '−7: You get an emblem with "Whenever you cast a spell, this emblem deals 5 damage to any target."'
      ),
    ]);

    expect(entries).toEqual([
      expect.objectContaining({
        name: "Elspeth, Sun's Champion Emblem",
        kind: "emblem",
        count: 1,
      }),
      expect.objectContaining({
        name: "Chandra, Torch of Defiance Emblem",
        kind: "emblem",
        count: 1,
      }),
    ]);
  });

  it("names a double-faced card's emblem after the face that gives it, not the whole card (CR 114.2, CR 712.1)", () => {
    const liliana = aDeckCard({
      name: `${LILIANA_FRONT.name} // ${LILIANA_BACK.name}`,
      oracleText: `${LILIANA_FRONT.oracleText} // ${LILIANA_BACK.oracleText}`,
      cardFaces: rebuildCardFaces(
        "liliana",
        `${LILIANA_FRONT.name} // ${LILIANA_BACK.name}`,
        "Legendary Creature — Human Cleric // Legendary Planeswalker — Liliana",
        "{1}{B}{B} // ",
        `${LILIANA_FRONT.oracleText} // ${LILIANA_BACK.oracleText}`
      ),
    });

    const emblems = buildTokenLibrary([liliana]).filter(
      (entry) => entry.kind === "emblem"
    );

    expect(emblems).toEqual([
      {
        name: "Liliana, Defiant Necromancer Emblem",
        power: null,
        colors: [],
        count: 1,
        kind: "emblem",
      },
    ]);
  });

  it("counts the emblems of a double-faced card added from Scryfall from its faces' rules text", () => {
    const liliana = {
      ...makeDeckCard(
        aScryfallCard({
          name: `${LILIANA_FRONT.name} // ${LILIANA_BACK.name}`,
          layout: "transform",
          card_faces: [
            { name: LILIANA_FRONT.name, oracle_text: LILIANA_FRONT.oracleText },
            { name: LILIANA_BACK.name, oracle_text: LILIANA_BACK.oracleText },
          ],
        })
      ),
      quantity: 2,
    };

    const emblems = buildTokenLibrary([liliana]).filter(
      (entry) => entry.kind === "emblem"
    );

    expect(emblems).toEqual([
      expect.objectContaining({
        name: "Liliana, Defiant Necromancer Emblem",
        count: 2,
      }),
    ]);
  });

  it("returns an empty library when no card creates a token", () => {
    expect(
      buildTokenLibrary([
        card("Lightning Bolt", "Lightning Bolt deals 3 damage to any target."),
      ])
    ).toEqual([]);
  });

  it("formats a portable token checklist", () => {
    expect(
      formatTokenLibrary([
        {
          name: "Soldier",
          power: "1/1",
          colors: ["white"],
          count: 3,
          kind: "token",
        },
        { name: "Emblem", power: null, colors: [], count: 1, kind: "emblem" },
        {
          name: "Beast",
          power: "3/3",
          colors: ["green"],
          count: 2,
          kind: "token",
        },
      ])
    ).toBe("2x 3/3 green Beast token\n3x 1/1 white Soldier token\n1x Emblem");
  });

  it("returns an empty export for an empty token library", () => {
    expect(formatTokenLibrary([])).toBe("");
  });
});
