import { describe, expect, it } from "vitest";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { isBackground, isCommanderEligible } from "./commander-eligibility";

function card(
  fields: Pick<ScryfallCard, "name" | "type_line"> & Partial<ScryfallCard>
): ScryfallCard {
  return { id: fields.name, cmc: 0, color_identity: [], ...fields };
}

/** CR 903.3 and 903.3a, comprehensive rules of 2026-08-07 (`src/lib/rules/data`). */
const ELIGIBILITY_CASES: readonly {
  readonly label: string;
  readonly card: ScryfallCard;
  readonly eligible: boolean;
}[] = [
  {
    label: "a legendary creature",
    card: card({
      name: "Talrand, Sky Summoner",
      type_line: "Legendary Creature — Merfolk Wizard",
    }),
    eligible: true,
  },
  {
    label: "a creature that is not legendary",
    card: card({ name: "Grizzly Bears", type_line: "Creature — Bear" }),
    eligible: false,
  },
  {
    label: "a legendary Vehicle",
    card: card({
      name: "Parhelion II",
      type_line: "Legendary Artifact — Vehicle",
      power: "5",
      toughness: "5",
    }),
    eligible: true,
  },
  {
    label: "a legendary Spacecraft with a power/toughness box",
    card: card({
      name: "Test Flagship",
      type_line: "Legendary Artifact — Spacecraft",
      power: "6",
      toughness: "6",
    }),
    eligible: true,
  },
  {
    label: "a legendary Spacecraft without a power/toughness box",
    card: card({
      name: "Test Station Ship",
      type_line: "Legendary Artifact — Spacecraft",
    }),
    eligible: false,
  },
  {
    label: "a legendary planeswalker without the commander clause",
    card: card({
      name: "Jace Beleren",
      type_line: "Legendary Planeswalker — Jace",
      oracle_text: "+2: Each player draws a card.",
    }),
    eligible: false,
  },
  {
    label: "a planeswalker that says it can be your commander",
    card: card({
      name: "Grist, the Hunger Tide",
      type_line: "Legendary Planeswalker — Grist",
      oracle_text:
        "As long as Grist, the Hunger Tide isn't on the battlefield, it's a 1/1 Insect creature in addition to its other types.\nGrist, the Hunger Tide can be your commander.",
    }),
    eligible: true,
  },
  {
    label: "a double-faced card whose front face is a legendary creature",
    card: card({
      name: "Kytheon, Hero of Akros // Gideon, Battle-Forged",
      type_line:
        "Legendary Creature — Human Soldier // Legendary Planeswalker — Gideon",
      card_faces: [
        {
          name: "Kytheon, Hero of Akros",
          type_line: "Legendary Creature — Human Soldier",
          power: "2",
          toughness: "1",
        },
        {
          name: "Gideon, Battle-Forged",
          type_line: "Legendary Planeswalker — Gideon",
        },
      ],
    }),
    eligible: true,
  },
  {
    label: "a Background",
    card: card({
      name: "Raised by Giants",
      type_line: "Legendary Enchantment — Background",
    }),
    eligible: false,
  },
];

describe("isCommanderEligible", () => {
  it.each(ELIGIBILITY_CASES)(
    "answers $eligible for $label",
    ({ card: candidate, eligible }) => {
      expect(isCommanderEligible(candidate)).toBe(eligible);
    }
  );
});

describe("isBackground", () => {
  it("recognises the Background subtype and nothing else", () => {
    expect(
      isBackground(
        card({
          name: "Raised by Giants",
          type_line: "Legendary Enchantment — Background",
        })
      )
    ).toBe(true);
    expect(
      isBackground(
        card({
          name: "Talrand, Sky Summoner",
          type_line: "Legendary Creature — Merfolk Wizard",
        })
      )
    ).toBe(false);
  });
});
