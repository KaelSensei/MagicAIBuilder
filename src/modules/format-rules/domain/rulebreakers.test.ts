/**
 * The rulebreaker table against the Oracle texts it is derived from, recorded
 * from Scryfall on 2026-11-16 (`fixtures/rulebreaker-cards-v1.ts`), and the
 * command-zone lookup (CR 903.5e).
 */
import { describe, expect, it } from "vitest";
import { RECORDED_RULEBREAKER_CARDS } from "./fixtures/rulebreaker-cards-v1";
import {
  deckConstructionExceptions,
  liftsMaximumDeckSize,
  RULEBREAKERS,
  type RulebreakerException,
} from "./rulebreakers";

const RECORDED = Object.values(RECORDED_RULEBREAKER_CARDS);

/** The table's exceptions for a recorded card, found by Oracle id. */
function exceptionsOf(oracleId: string): readonly RulebreakerException[] {
  return deckConstructionExceptions([{ oracleId, name: "" }]);
}

function kinds(exceptions: readonly RulebreakerException[]): readonly string[] {
  return exceptions.map(({ kind }) => kind);
}

describe("the rulebreaker table", () => {
  it("holds exactly the eight cards Scryfall's o:rulebreaker returned, keyed by Oracle id with their exact names", () => {
    expect(
      RULEBREAKERS.map(({ oracleId, name }) => ({ oracleId, name }))
    ).toEqual(
      RECORDED.map(({ oracle_id, name }) => ({ oracleId: oracle_id, name }))
    );
  });

  it("cites CR 903.5e on every entry", () => {
    expect(new Set(RULEBREAKERS.map(({ rule }) => rule))).toEqual(
      new Set(["CR 903.5e"])
    );
  });

  describe.each(RECORDED)("$name", (card) => {
    const exceptions = kinds(exceptionsOf(card.oracle_id));

    it("grants any basic land exactly when its Oracle text says so", () => {
      expect(exceptions.includes("any-basic-land")).toBe(
        card.oracle_text.includes("any basic land cards")
      );
    });

    it("grants any land exactly when its Oracle text says so", () => {
      expect(exceptions.includes("any-land")).toBe(
        card.oracle_text.includes("can have any land cards")
      );
    });

    it("lifts the maximum deck size exactly when its Oracle text says so", () => {
      expect(exceptions.includes("no-maximum-deck-size")).toBe(
        card.oracle_text.includes("no maximum deck size")
      );
    });

    it("lifts the identity rule for some cards exactly when its Oracle text says 'of any color identity'", () => {
      expect(exceptions.includes("ignore-identity-for")).toBe(
        card.oracle_text.includes("of any color identity")
      );
    });
  });
});

describe("deckConstructionExceptions", () => {
  const { seluma, whtz } = RECORDED_RULEBREAKER_CARDS;

  it("finds a card with an Oracle id by that id, whatever its name", () => {
    expect(
      kinds(
        deckConstructionExceptions([{ oracleId: whtz.oracle_id, name: "Whtz" }])
      )
    ).toEqual(["no-maximum-deck-size"]);
  });

  it("finds a card without an Oracle id by its exact Oracle name", () => {
    expect(
      kinds(deckConstructionExceptions([{ oracleId: null, name: seluma.name }]))
    ).toEqual(["ignore-identity-for", "any-basic-land"]);
  });

  it("grants nothing for a commander that is no rulebreaker", () => {
    expect(
      deckConstructionExceptions([
        { oracleId: null, name: "Atraxa, Praetors' Voice" },
      ])
    ).toEqual([]);
  });

  it("combines both commanders' exceptions", () => {
    const zone = [
      { oracleId: null, name: whtz.name },
      { oracleId: null, name: "Thrasios, Triton Hero" },
    ];

    expect(liftsMaximumDeckSize(deckConstructionExceptions(zone))).toBe(true);
  });
});
