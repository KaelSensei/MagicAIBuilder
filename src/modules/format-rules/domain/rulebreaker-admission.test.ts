/**
 * Which rulebreaker exception admits a card (CR 903.5e): the answer the deck
 * editor names on a card's line. Solitary: a pure function of the command zone
 * and the card's front-face type line and mana value. The commanders are the
 * recorded Scryfall cards of `fixtures/rulebreaker-cards-v1.ts`.
 */
import { describe, expect, it } from "vitest";
import { RECORDED_RULEBREAKER_CARDS } from "./fixtures/rulebreaker-cards-v1";
import {
  deckConstructionExceptions,
  isIdentityExempt,
  rulebreakerAdmission,
  type CommandZoneCard,
  type ConstructionCard,
} from "./rulebreakers";

const { grizzlegom, maular, seluma, tolabow } = RECORDED_RULEBREAKER_CARDS;

/** A stored command-zone card: no Oracle id, found by its exact name. */
function commander(name: string): CommandZoneCard {
  return { oracleId: null, name };
}

/** Fallen Angel, a mono-black Angel ({3}{B}{B}). */
const FALLEN_ANGEL: ConstructionCard = {
  typeLine: "Creature — Angel",
  manaValue: 5,
};
/** Gravedigger, a mono-black Zombie ({3}{B}). */
const GRAVEDIGGER: ConstructionCard = {
  typeLine: "Creature — Zombie",
  manaValue: 4,
};
const SWAMP: ConstructionCard = {
  typeLine: "Basic Land — Swamp",
  manaValue: 0,
};
/** Underground River, a nonbasic land of identity UB. */
const UNDERGROUND_RIVER: ConstructionCard = { typeLine: "Land", manaValue: 0 };
/** Counterspell, a blue instant ({U}{U}). */
const COUNTERSPELL: ConstructionCard = { typeLine: "Instant", manaValue: 2 };

describe("rulebreakerAdmission", () => {
  it("names Seluma and its identity exception for an Angel", () => {
    expect(
      rulebreakerAdmission([commander(seluma.name)], FALLEN_ANGEL)
    ).toEqual({
      rulebreaker: "Seluma, Light of Aysen",
      exception: "ignore-identity-for",
    });
  });

  it("names Seluma's basic land exception for a basic land", () => {
    expect(rulebreakerAdmission([commander(seluma.name)], SWAMP)).toEqual({
      rulebreaker: "Seluma, Light of Aysen",
      exception: "any-basic-land",
    });
  });

  it("names Grizzlegom's land exception for a nonbasic land", () => {
    expect(
      rulebreakerAdmission([commander(grizzlegom.name)], UNDERGROUND_RIVER)
    ).toEqual({
      rulebreaker: "Grizzlegom, Hurloon Hero",
      exception: "any-land",
    });
  });

  it("names Maular's basic land exception for a basic land, which its creature exception does not cover", () => {
    expect(rulebreakerAdmission([commander(maular.name)], SWAMP)).toEqual({
      rulebreaker: "Maular, the Next Evolution",
      exception: "any-basic-land",
    });
  });

  it("admits no card that passes none of the commander's tests", () => {
    expect(
      rulebreakerAdmission([commander(seluma.name)], GRAVEDIGGER)
    ).toBeUndefined();
    expect(
      rulebreakerAdmission([commander(grizzlegom.name)], FALLEN_ANGEL)
    ).toBeUndefined();
  });

  it("admits nothing through Tolabow's chosen colour, which the deck does not store", () => {
    expect(
      rulebreakerAdmission([commander(tolabow.name)], COUNTERSPELL)
    ).toBeUndefined();
  });

  it("admits nothing under a commander that is no rulebreaker", () => {
    expect(
      rulebreakerAdmission([commander("Atraxa, Praetors' Voice")], FALLEN_ANGEL)
    ).toBeUndefined();
    expect(rulebreakerAdmission([], FALLEN_ANGEL)).toBeUndefined();
  });

  it("names the partner that is the rulebreaker when the other commander is not", () => {
    const zone = [commander("Thrasios, Triton Hero"), commander(seluma.name)];

    expect(rulebreakerAdmission(zone, FALLEN_ANGEL)?.rulebreaker).toBe(
      "Seluma, Light of Aysen"
    );
  });

  it.each([
    { name: "an Angel", card: FALLEN_ANGEL },
    { name: "a Zombie", card: GRAVEDIGGER },
    { name: "a basic land", card: SWAMP },
    { name: "a nonbasic land", card: UNDERGROUND_RIVER },
    { name: "an instant", card: COUNTERSPELL },
  ])(
    "agrees with isIdentityExempt for $name under every rulebreaker",
    ({ card }) => {
      for (const recorded of Object.values(RECORDED_RULEBREAKER_CARDS)) {
        const zone = [commander(recorded.name)];

        expect(rulebreakerAdmission(zone, card) !== undefined).toBe(
          isIdentityExempt(card, deckConstructionExceptions(zone))
        );
      }
    }
  );
});
