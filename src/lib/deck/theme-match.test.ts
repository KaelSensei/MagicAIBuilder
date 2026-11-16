import { describe, expect, it } from "vitest";

import { matchTheme, type DeckTheme } from "./theme-match";
import type { CardFace } from "./types";
import { aDeckCard } from "@/test/builders/card";

/** The handle of I-102's first Red: the creature type Dragon, any handle. */
const DRAGON_TYPE: DeckTheme = {
  handles: [{ kind: "creatureType", value: "Dragon" }],
  match: "any",
};

const SHIVAN_DRAGON = aDeckCard({
  id: "shivan-dragon",
  name: "Shivan Dragon",
  typeLine: "Creature — Dragon",
  oracleText: "Flying\n{R}: Shivan Dragon gets +1/+0 until end of turn.",
  category: "creature",
});

/** A blank card face, for the fields a face test does not read. */
const FACE: CardFace = {
  name: "",
  manaCost: "",
  typeLine: "",
  oracleText: "",
  imageUri: "",
  artCropUri: "",
};

const SOL_RING = aDeckCard({
  id: "sol-ring",
  name: "Sol Ring",
  typeLine: "Artifact",
  oracleText: "{T}: Add {C}{C}.",
  category: "ramp",
});

describe("matchTheme", () => {
  it("puts a Dragon on the creature-type Dragon theme by its type line, and Sol Ring off it", () => {
    expect(matchTheme(SHIVAN_DRAGON, DRAGON_TYPE)).toEqual({
      onTheme: true,
      evidence: [
        { handleIndex: 0, field: "typeLine", excerpt: "Creature — Dragon" },
      ],
    });
    expect(matchTheme(SOL_RING, DRAGON_TYPE)).toEqual({
      onTheme: false,
      evidence: [],
    });
  });

  it("puts a changeling on every creature-type theme, citing its Changeling ability (CR 702.73a)", () => {
    const mirrorEntity = aDeckCard({
      name: "Mirror Entity",
      typeLine: "Creature — Shapeshifter",
      oracleText:
        "Changeling (This card is every creature type.)\n{X}: Until end of turn, creatures you control have base power and toughness X/X and gain all creature types.",
    });

    expect(matchTheme(mirrorEntity, DRAGON_TYPE)).toEqual({
      onTheme: true,
      evidence: [{ handleIndex: 0, field: "oracleText", excerpt: "Changeling" }],
    });
  });

  it("reads the creature type on the back face of a two-faced card, citing that face", () => {
    const invasionOfTarkir = aDeckCard({
      name: "Invasion of Tarkir // Defiant Thundermaw",
      typeLine: "Battle — Siege // Creature — Dragon",
    });

    expect(matchTheme(invasionOfTarkir, DRAGON_TYPE)).toEqual({
      onTheme: true,
      evidence: [
        { handleIndex: 0, field: "typeLine", excerpt: "Creature — Dragon" },
      ],
    });
  });

  it("matches a word in the name as a whole word, whatever its case", () => {
    const dragonWord: DeckTheme = {
      handles: [{ kind: "nameWord", value: "dragon" }],
      match: "any",
    };
    const dragonlordAtarka = aDeckCard({
      name: "Dragonlord Atarka",
      typeLine: "Legendary Creature — Elder Dragon",
    });

    expect(matchTheme(SHIVAN_DRAGON, dragonWord)).toEqual({
      onTheme: true,
      evidence: [{ handleIndex: 0, field: "name", excerpt: "Shivan Dragon" }],
    });
    expect(matchTheme(dragonlordAtarka, dragonWord).onTheme).toBe(false);
  });

  it("matches a word in the back face's name, citing that face", () => {
    const thundermawWord: DeckTheme = {
      handles: [{ kind: "nameWord", value: "Thundermaw" }],
      match: "any",
    };
    const invasionOfTarkir = aDeckCard({
      name: "Invasion of Tarkir // Defiant Thundermaw",
    });

    expect(matchTheme(invasionOfTarkir, thundermawWord).evidence).toEqual([
      { handleIndex: 0, field: "name", excerpt: "Defiant Thundermaw" },
    ]);
  });

  it("matches the first letter of the name after a leading The when the owner ignores it", () => {
    const letterS: DeckTheme = {
      handles: [{ kind: "firstLetter", value: "S", ignoreLeadingThe: true }],
      match: "any",
    };
    const names = ["Sol Ring", "Sakura-Tribe Elder", "The Scarab God"];

    expect(
      names.map((name) => matchTheme(aDeckCard({ name }), letterS))
    ).toEqual(
      names.map((name) => ({
        onTheme: true,
        evidence: [{ handleIndex: 0, field: "name", excerpt: name }],
      }))
    );
  });

  it("counts the T of a leading The when the owner does not ignore it", () => {
    const theUrDragon = aDeckCard({ name: "The Ur-Dragon" });
    const letter = (value: string): DeckTheme => ({
      handles: [{ kind: "firstLetter", value, ignoreLeadingThe: false }],
      match: "any",
    });

    expect(matchTheme(theUrDragon, letter("T")).onTheme).toBe(true);
    expect(matchTheme(theUrDragon, letter("U")).onTheme).toBe(false);
  });

  it("matches a card type or supertype before the em dash, not a subtype", () => {
    const cardType = (value: string): DeckTheme => ({
      handles: [{ kind: "cardType", value }],
      match: "any",
    });
    const dragonlordAtarka = aDeckCard({
      name: "Dragonlord Atarka",
      typeLine: "Legendary Creature — Elder Dragon",
    });

    expect(matchTheme(dragonlordAtarka, cardType("legendary"))).toEqual({
      onTheme: true,
      evidence: [
        {
          handleIndex: 0,
          field: "typeLine",
          excerpt: "Legendary Creature — Elder Dragon",
        },
      ],
    });
    expect(matchTheme(dragonlordAtarka, cardType("Dragon")).onTheme).toBe(
      false
    );
  });

  it("with the all switch, keeps on theme only the cards that meet every handle", () => {
    const legendaryDragons: DeckTheme = {
      handles: [
        { kind: "creatureType", value: "Dragon" },
        { kind: "cardType", value: "Legendary" },
      ],
      match: "all",
    };
    const dragonlordAtarka = aDeckCard({
      name: "Dragonlord Atarka",
      typeLine: "Legendary Creature — Elder Dragon",
    });
    const typeLine = "Legendary Creature — Elder Dragon";

    expect(matchTheme(dragonlordAtarka, legendaryDragons)).toEqual({
      onTheme: true,
      evidence: [
        { handleIndex: 0, field: "typeLine", excerpt: typeLine },
        { handleIndex: 1, field: "typeLine", excerpt: typeLine },
      ],
    });
    expect(matchTheme(SHIVAN_DRAGON, legendaryDragons)).toEqual({
      onTheme: false,
      evidence: [
        { handleIndex: 0, field: "typeLine", excerpt: "Creature — Dragon" },
      ],
    });
  });

  it("reads a creature type without the spaces typed around it", () => {
    const spacedDragon: DeckTheme = {
      handles: [{ kind: "creatureType", value: " dragon " }],
      match: "any",
    };

    expect(matchTheme(SHIVAN_DRAGON, spacedDragon).onTheme).toBe(true);
  });

  it("puts no card on a handle whose word is blank", () => {
    const blankWords: DeckTheme = {
      handles: [
        { kind: "nameWord", value: " " },
        { kind: "textWord", value: "" },
      ],
      match: "any",
    };

    expect(matchTheme(SHIVAN_DRAGON, blankWords)).toEqual({
      onTheme: false,
      evidence: [],
    });
  });

  describe("word in text", () => {
    const dragonInText: DeckTheme = {
      handles: [{ kind: "textWord", value: "Dragon" }],
      match: "any",
    };

    it("matches a whole word of the Oracle text, citing the line", () => {
      const dragonTempest = aDeckCard({
        name: "Dragon Tempest",
        typeLine: "Enchantment",
        oracleText:
          "Whenever a creature you control with flying enters, it gains haste until end of turn.\nWhenever a Dragon you control enters, it deals X damage to any target.",
      });

      expect(matchTheme(dragonTempest, dragonInText)).toEqual({
        onTheme: true,
        evidence: [
          {
            handleIndex: 0,
            field: "oracleText",
            excerpt:
              "Whenever a Dragon you control enters, it deals X damage to any target.",
          },
        ],
      });
    });

    it("does not count the card's own name in its text", () => {
      expect(matchTheme(SHIVAN_DRAGON, dragonInText)).toEqual({
        onTheme: false,
        evidence: [],
      });
    });

    it("cuts a long line to 120 characters around the matched word", () => {
      const crucibleOfTheSpiritDragon = aDeckCard({
        name: "Crucible of the Spirit Dragon",
        typeLine: "Land",
        oracleText:
          "{T}, Remove X storage counters from this land: Add X mana in any combination of colors. Spend this mana only to cast Dragon spells or activate abilities of Dragons.",
      });

      const [evidence] = matchTheme(
        crucibleOfTheSpiritDragon,
        dragonInText
      ).evidence;

      expect(evidence?.excerpt).toBe(
        "…Add X mana in any combination of colors. Spend this mana only to cast Dragon spells or activate abilities of Dragons."
      );
    });

    it("does not read reminder text (CR 207.2a)", () => {
      const creatureInText: DeckTheme = {
        handles: [{ kind: "textWord", value: "creature" }],
        match: "any",
      };
      const changeling = aDeckCard({
        name: "A Changeling",
        oracleText: "Changeling (This card is every creature type.)",
      });

      expect(matchTheme(changeling, creatureInText).onTheme).toBe(false);
    });

    it("reads the back face's Oracle text of a two-faced card", () => {
      const back = "Whenever a Dragon you control attacks, draw a card.";
      const twoFaced = aDeckCard({
        name: "Front Face // Back Face",
        oracleText: "Flying",
        cardFaces: [
          { ...FACE, name: "Front Face", oracleText: "Flying" },
          { ...FACE, name: "Back Face", oracleText: back },
        ],
      });

      expect(matchTheme(twoFaced, dragonInText).evidence).toEqual([
        { handleIndex: 0, field: "oracleText", excerpt: back },
      ]);
    });
  });
});
