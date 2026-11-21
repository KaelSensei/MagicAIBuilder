/**
 * Solitary tests of the deck's count by card type: which type each card counts under, which rows
 * are counted, and the order the counts come in.
 */
import { describe, expect, it } from "vitest";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { countDeckCardTypes, primaryCardType } from "./deck-type-counts";

describe("primaryCardType", () => {
  it.each([
    ["Artifact Creature — Golem", "creature"],
    ["Artifact Land", "land"],
    ["Land Creature — Forest Dryad", "land"],
    ["Kindred Instant — Rogue", "instant"],
    ["Legendary Enchantment Creature — God", "creature"],
    ["Legendary Planeswalker — Jace", "planeswalker"],
    ["Battle — Siege", "battle"],
    ["Legendary Artifact — Equipment", "artifact"],
    ["Enchantment — Aura", "enchantment"],
    ["Sorcery", "sorcery"],
    ["Conspiracy", "other"],
    ["", "other"],
  ])("counts a %s as %s", (typeLine, expected) => {
    expect(primaryCardType(aDeckCard({ typeLine }))).toBe(expected);
  });

  it("reads only the front face of a double-faced card stored as `Front // Back`", () => {
    const delver = aDeckCard({
      typeLine: "Creature — Human Wizard // Creature — Human Insect",
    });
    const fable = aDeckCard({
      typeLine: "Enchantment — Saga // Enchantment Creature — Goblin Shaman",
    });

    expect(primaryCardType(delver)).toBe("creature");
    expect(primaryCardType(fable)).toBe("enchantment");
  });

  it("reads the front face from `cardFaces` when the card carries them", () => {
    const emeria = aDeckCard({
      typeLine: "Sorcery // Land",
      cardFaces: [
        {
          name: "Emeria's Call",
          manaCost: "{4}{W}{W}{W}",
          typeLine: "Sorcery",
          oracleText: "",
          imageUri: "",
          artCropUri: "",
        },
        {
          name: "Emeria, Shattered Skyclave",
          manaCost: "",
          typeLine: "Land",
          oracleText: "",
          imageUri: "",
          artCropUri: "",
        },
      ],
    });

    expect(primaryCardType(emeria)).toBe("sorcery");
  });
});

describe("countDeckCardTypes", () => {
  it("counts the commander, the partner and every main-deck copy, and nothing else", () => {
    const deck = aDeck({
      commander: aDeckCard({
        id: "tymna",
        typeLine: "Legendary Creature — Human Cleric",
      }),
      partner: aDeckCard({
        id: "kraum",
        typeLine: "Legendary Creature — Zombie Horror",
      }),
      cards: [
        aDeckCard({
          id: "island",
          typeLine: "Basic Land — Island",
          quantity: 10,
        }),
        aDeckCard({ id: "bolt", typeLine: "Instant", zone: "sideboard" }),
        aDeckCard({ id: "ponder", typeLine: "Sorcery", zone: "maybeboard" }),
      ],
    });

    expect(countDeckCardTypes(deck)).toEqual([
      { type: "creature", count: 2 },
      { type: "land", count: 10 },
    ]);
  });

  it("lists creatures, lands, instants, sorceries, artifacts, enchantments, planeswalkers, battles, then other, leaving out a type with no card", () => {
    const deck = aDeck({
      cards: [
        aDeckCard({ id: "other", typeLine: "Conspiracy" }),
        aDeckCard({ id: "battle", typeLine: "Battle — Siege" }),
        aDeckCard({ id: "walker", typeLine: "Planeswalker — Jace" }),
        aDeckCard({ id: "sorcery", typeLine: "Sorcery", quantity: 2 }),
        aDeckCard({ id: "land", typeLine: "Land" }),
        aDeckCard({ id: "creature", typeLine: "Creature — Elf" }),
      ],
    });

    expect(countDeckCardTypes(deck)).toEqual([
      { type: "creature", count: 1 },
      { type: "land", count: 1 },
      { type: "sorcery", count: 2 },
      { type: "planeswalker", count: 1 },
      { type: "battle", count: 1 },
      { type: "other", count: 1 },
    ]);
  });

  it("gives no count for an empty deck", () => {
    expect(countDeckCardTypes(aDeck())).toEqual([]);
  });
});
