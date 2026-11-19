/**
 * Which rulebreaker commander admits a stored deck's off-identity card
 * (CR 903.5e): the answer the editor names on the card's line. A card the
 * command zone's colours already allow (CR 903.5c) needs no admission, and a
 * rulebreaker in the 99 admits nothing. The commanders are the recorded
 * Scryfall cards of `rulebreaker-cards-v1.ts`.
 */
import { describe, expect, it } from "vitest";
import {
  RECORDED_RULEBREAKER_CARDS,
  type RecordedRulebreakerCard,
} from "@/modules/format-rules/domain/fixtures/rulebreaker-cards-v1";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { admittedByRulebreaker, rulebreakerAdmissions } from "./color-identity";
import type { DeckCard } from "./types";

const { grizzlegom, seluma } = RECORDED_RULEBREAKER_CARDS;

/** The recorded card as the deck stores its commander. */
function asCommander(card: RecordedRulebreakerCard): DeckCard {
  return aDeckCard({
    id: `commander-${card.oracle_id}`,
    name: card.name,
    cmc: card.cmc,
    typeLine: card.type_line,
    colorIdentity: [...card.color_identity],
    category: "commander",
  });
}

/** Fallen Angel, a mono-black Angel ({3}{B}{B}). */
const FALLEN_ANGEL = aDeckCard({
  id: "fallen-angel",
  name: "Fallen Angel",
  cmc: 5,
  typeLine: "Creature — Angel",
  colorIdentity: ["B"],
});
/** Serra Angel, a mono-white Angel ({3}{W}{W}): inside Seluma's white identity. */
const SERRA_ANGEL = aDeckCard({
  id: "serra-angel",
  name: "Serra Angel",
  cmc: 5,
  typeLine: "Creature — Angel",
  colorIdentity: ["W"],
});
const SWAMP = aDeckCard({
  id: "swamp",
  name: "Swamp",
  typeLine: "Basic Land — Swamp",
  colorIdentity: ["B"],
});
const PLAINS = aDeckCard({
  id: "plains",
  name: "Plains",
  typeLine: "Basic Land — Plains",
  colorIdentity: ["W"],
});
/** Underground River, a nonbasic land of identity UB. */
const UNDERGROUND_RIVER = aDeckCard({
  id: "underground-river",
  name: "Underground River",
  typeLine: "Land",
  colorIdentity: ["U", "B"],
});
/** Giada, Font of Hope: a white Angel commander that is no rulebreaker. */
const GIADA = aDeckCard({
  id: "giada",
  name: "Giada, Font of Hope",
  typeLine: "Legendary Creature — Angel Vampire",
  colorIdentity: ["W"],
  category: "commander",
});

describe("admittedByRulebreaker", () => {
  it("names Seluma for a mono-black Angel in a Seluma deck", () => {
    const deck = aDeck({ commander: asCommander(seluma) });

    expect(admittedByRulebreaker(deck, FALLEN_ANGEL)).toEqual({
      rulebreaker: "Seluma, Light of Aysen",
      exception: "ignore-identity-for",
    });
  });

  it("names Seluma's basic land exception for an off-colour basic land", () => {
    const deck = aDeck({ commander: asCommander(seluma) });

    expect(admittedByRulebreaker(deck, SWAMP)?.exception).toBe(
      "any-basic-land"
    );
  });

  it("names Grizzlegom for an off-colour nonbasic land", () => {
    const deck = aDeck({ commander: asCommander(grizzlegom) });

    expect(admittedByRulebreaker(deck, UNDERGROUND_RIVER)).toEqual({
      rulebreaker: "Grizzlegom, Hurloon Hero",
      exception: "any-land",
    });
  });

  it("admits nothing the commander's colours already allow (CR 903.5c)", () => {
    const deck = aDeck({ commander: asCommander(seluma) });

    expect(admittedByRulebreaker(deck, SERRA_ANGEL)).toBeUndefined();
    expect(admittedByRulebreaker(deck, PLAINS)).toBeUndefined();
  });

  it("admits nothing when Seluma is in the 99, not the command zone (CR 903.5e)", () => {
    const selumaInThe99 = {
      ...asCommander(seluma),
      id: "seluma-99",
      category: "creature" as const,
    };
    const deck = aDeck({
      commander: GIADA,
      cards: [selumaInThe99, FALLEN_ANGEL],
    });

    expect(admittedByRulebreaker(deck, FALLEN_ANGEL)).toBeUndefined();
  });

  it("admits nothing in a deck without a commander", () => {
    expect(admittedByRulebreaker(aDeck(), FALLEN_ANGEL)).toBeUndefined();
  });

  it("names the rulebreaker partner when the commander is not one", () => {
    const deck = aDeck({ commander: GIADA, partner: asCommander(seluma) });

    expect(admittedByRulebreaker(deck, FALLEN_ANGEL)?.rulebreaker).toBe(
      "Seluma, Light of Aysen"
    );
  });
});

describe("rulebreakerAdmissions", () => {
  it("maps each admitted main-deck card's row id to its admission, and nothing else", () => {
    const sideboardAngel = {
      ...FALLEN_ANGEL,
      id: "fallen-angel-side",
      zone: "sideboard" as const,
    };
    const deck = aDeck({
      commander: asCommander(seluma),
      cards: [FALLEN_ANGEL, SERRA_ANGEL, SWAMP, PLAINS, sideboardAngel],
    });

    expect([...rulebreakerAdmissions(deck)]).toEqual([
      [
        "fallen-angel",
        {
          rulebreaker: "Seluma, Light of Aysen",
          exception: "ignore-identity-for",
        },
      ],
      [
        "swamp",
        { rulebreaker: "Seluma, Light of Aysen", exception: "any-basic-land" },
      ],
    ]);
  });
});
