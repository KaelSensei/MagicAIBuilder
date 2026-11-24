/**
 * `explainBracket` shows how the bracket estimate is reached (I-77 slice 1):
 * the official floors, the five heuristic terms with their inputs, bounds and
 * cards, the badge on every count, and what the estimate cannot see.
 *
 * Sociable at the deck-analysis boundary: the fixture decks go through
 * `computeDeckStats` and `categorizeCard` as they do in the builder.
 */
import { describe, expect, it } from "vitest";
import { explainBracket } from "@/lib/deck/explain-bracket";
import type {
  BracketAssessment,
  BracketFloorRow,
} from "@/lib/deck/bracket-assessment";
import { computeDeckStats } from "@/lib/deck/stats";
import type { DeckCard } from "@/lib/deck/types";
import type { Combo } from "@/modules/combos";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import {
  aCoreList,
  aCoreListWithOneGameChanger,
  aCreature,
  aRampCard,
  aThirtyCardList,
  aTwoCardInfinite,
  armageddon,
  cards,
  timeWarp,
} from "@/lib/deck/testing/bracket-decks";

/** Explains a Commander deck of these cards with the combos Spellbook found. */
function explain(
  cards: readonly DeckCard[],
  combos: readonly Combo[] = []
): BracketAssessment {
  const deck = aDeck({ cards: [...cards] });
  const assessment = explainBracket({
    deck,
    stats: computeDeckStats(deck),
    comboData: { kind: "found", combos, fetchedAt: "2026-11-19" },
  });
  if (assessment === null) throw new Error("a Commander deck is assessed");
  return assessment;
}

function floorRow(
  assessment: BracketAssessment,
  rule: BracketFloorRow["rule"]
): BracketFloorRow | undefined {
  return assessment.floors.find((row) => row.rule === rule);
}

describe("explainBracket — the official floors", () => {
  it("names the Game Changer floor that lifts a heuristic 2 to an estimate of 3", () => {
    const assessment = explain(aCoreListWithOneGameChanger());

    expect(Math.round(assessment.heuristicPart.heuristic)).toBe(2);
    expect(floorRow(assessment, "gameChangers")).toEqual({
      status: "checked",
      rule: "gameChangers",
      count: 1,
      certainty: "exact",
      cards: ["Drannith Magistrate"],
      floor: 3,
      ruleRef: "wotc-brackets-2025-10-21#gameChangers",
    });
    expect(assessment.floor).toBe(3);
    expect(assessment.estimate).toBe(3);
    expect(assessment.decidedBy).toBe("floor");
  });

  it("names both cards of a two-card infinite and floors the list at 3, as an estimated reading of Spellbook's data", () => {
    const assessment = explain(aCoreList(), [
      aTwoCardInfinite("Pitiless Plunderer", "Chatterfang, Squirrel General"),
    ]);

    expect(floorRow(assessment, "twoCardCombos")).toEqual({
      status: "checked",
      rule: "twoCardCombos",
      count: 1,
      certainty: "estimated",
      cards: ["Chatterfang, Squirrel General", "Pitiless Plunderer"],
      floor: 3,
      ruleRef: "wotc-brackets-2025-10-21#twoCardCombos",
    });
    expect(assessment.comboSource).toEqual({
      kind: "commanderSpellbook",
      fetchedAt: "2026-11-19",
      variantIds: ["Pitiless Plunderer+Chatterfang, Squirrel General"],
    });
    expect(assessment.estimate).toBe(3);
  });

  it("reads the two-card-combo floor as not checked, and the audit as incomplete, when combo data is unavailable", () => {
    const deck = aDeck({ cards: aCoreList() });
    const assessment = explainBracket({
      deck,
      stats: computeDeckStats(deck),
      comboData: { kind: "unavailable" },
    });

    expect(assessment?.floors).toContainEqual({
      status: "notChecked",
      rule: "twoCardCombos",
      reason: "comboDataUnavailable",
      ruleRef: "wotc-brackets-2025-10-21#twoCardCombos",
    });
    expect(assessment?.comboSource).toEqual({ kind: "unavailable" });
    expect(assessment?.complete).toBe(false);
  });

  it("reads the two-card-combo floor as not checked yet, and the audit as incomplete, while the combo lookup is pending", () => {
    const deck = aDeck({ cards: aCoreList() });
    const assessment = explainBracket({
      deck,
      stats: computeDeckStats(deck),
      comboData: { kind: "pending" },
    });

    expect(assessment?.floors).toContainEqual({
      status: "notChecked",
      rule: "twoCardCombos",
      reason: "comboLookupPending",
      ruleRef: "wotc-brackets-2025-10-21#twoCardCombos",
    });
    expect(assessment?.comboSource).toEqual({ kind: "pending" });
    expect(assessment?.complete).toBe(false);
  });

  it("is complete when Spellbook answered, with every official restriction checked", () => {
    const assessment = explain(aCoreList());

    expect(assessment.floors.map((row) => [row.rule, row.status])).toEqual([
      ["gameChangers", "checked"],
      ["twoCardCombos", "checked"],
      ["massLandDenial", "checked"],
      ["extraTurns", "checked"],
    ]);
    expect(assessment.complete).toBe(true);
  });
});

describe("explainBracket — mass land denial and extra turns (slice 3)", () => {
  it("names Armageddon in an estimated mass-land-denial row that sets Bracket 4, leaving the estimate unchanged", () => {
    const assessment = explain([...aCoreList().slice(0, -1), armageddon()]);

    expect(floorRow(assessment, "massLandDenial")).toEqual({
      status: "checked",
      rule: "massLandDenial",
      count: 1,
      certainty: "estimated",
      cards: ["Armageddon"],
      floor: 4,
      ruleRef: "wotc-brackets-2025-10-21#massLandDenial",
    });
    expect(assessment.floor).toBe(1);
    expect(assessment.estimate).toBe(2);
    expect(assessment.decidedBy).toBe("heuristic");
  });

  it("names Time Warp in an estimated extra-turn row that sets Bracket 2, where extra turns are allowed unchained", () => {
    const assessment = explain([...aCoreList().slice(0, -1), timeWarp()]);

    expect(floorRow(assessment, "extraTurns")).toEqual({
      status: "checked",
      rule: "extraTurns",
      count: 1,
      certainty: "estimated",
      cards: ["Time Warp"],
      floor: 2,
      ruleRef: "wotc-brackets-2025-10-21#extraTurns",
    });
    expect(assessment.floor).toBe(1);
  });

  it("reads a list with neither as zero cards at Bracket 1 for both rows", () => {
    const assessment = explain(aCoreList());

    expect(floorRow(assessment, "massLandDenial")).toEqual({
      status: "checked",
      rule: "massLandDenial",
      count: 0,
      certainty: "estimated",
      cards: [],
      floor: 1,
      ruleRef: "wotc-brackets-2025-10-21#massLandDenial",
    });
    expect(floorRow(assessment, "extraTurns")).toMatchObject({
      count: 0,
      cards: [],
      floor: 1,
    });
  });

  it("counts a commander that takes extra turns, since the command zone is part of the deck", () => {
    const deck = aDeck({ cards: aCoreList(), commander: timeWarp() });
    const assessment = explainBracket({
      deck,
      stats: computeDeckStats(deck),
      comboData: { kind: "found", combos: [], fetchedAt: null },
    });

    expect(assessment?.floors).toContainEqual(
      expect.objectContaining({ rule: "extraTurns", cards: ["Time Warp"] })
    );
  });

  it("leaves out the sideboard and the Considering list", () => {
    const assessment = explain([
      ...aCoreList(),
      { ...armageddon(), zone: "sideboard" },
      { ...timeWarp(), zone: "maybeboard" },
    ]);

    expect(floorRow(assessment, "massLandDenial")).toMatchObject({ count: 0 });
    expect(floorRow(assessment, "extraTurns")).toMatchObject({ count: 0 });
  });
});

describe("explainBracket — the heuristic terms", () => {
  it("shows the ramp term's inputs, bounds, score and the cards a rule placed there", () => {
    const ramp = explain(aCoreList()).heuristicPart.terms.find(
      (term) => term.key === "ramp"
    );

    expect(ramp?.inputs).toEqual([
      { name: "ramp", count: 8, certainty: "estimated" },
      { name: "avgCmc", count: 3.65, certainty: "exact" },
    ]);
    expect(ramp?.thresholds).toEqual([
      {
        measure: "ramp",
        value: 8,
        bounds: [5, 8, 12],
        direction: "higherIsStronger",
      },
      {
        measure: "avgCmc",
        value: 3.65,
        bounds: [2.5, 3, 3.5],
        direction: "lowerIsStronger",
      },
    ]);
    expect(ramp?.score).toBe(2);
    expect(ramp?.cards).toHaveLength(8);
    expect(ramp?.cards[0]).toEqual({
      by: "rule",
      cardId: "ramp-0",
      name: "Mana Rock 0",
      ruleId: "categories/ramp",
    });
  });

  it("marks the average mana value in each term that reads it", () => {
    const readers = explain(aCoreList())
      .heuristicPart.terms.filter((term) =>
        term.inputs.some((input) => input.name === "avgCmc")
      )
      .map((term) => term.key);

    expect(readers).toEqual(["ramp", "winSpeed", "avgCmc"]);
  });

  it("lets the heuristic decide when it reads above the floor", () => {
    const assessment = explain(aCoreList());

    expect(assessment.heuristicPart).toMatchObject({
      kind: "scored",
      deckSize: { count: 99, certainty: "exact" },
    });
    expect(assessment.heuristicPart.terms.map((term) => term.score)).toEqual([
      2, 2, 2, 1, 1,
    ]);
    expect(assessment.heuristicPart.heuristic).toBeCloseTo(1.6);
    expect(assessment.floor).toBe(1);
    expect(assessment.estimate).toBe(2);
    expect(assessment.decidedBy).toBe("heuristic");
  });

  it("names the fast-win cards of the win speed term with the rule that read each", () => {
    const winSpeed = explain([
      ...aCoreList().slice(0, -2),
      aDeckCard({
        id: "thoracle",
        name: "Thassa's Oracle",
        cmc: 2,
        colorIdentity: ["U"],
        typeLine: "Creature — Merfolk Wizard",
        oracleText:
          "When Thassa's Oracle enters, look at the top X cards of your library. If X is greater than or equal to the number of cards in your library, you win the game.",
        category: "winCondition",
      }),
      aDeckCard({
        id: "grapeshot",
        name: "Grapeshot",
        cmc: 2,
        colorIdentity: ["R"],
        typeLine: "Sorcery",
        oracleText: "Grapeshot deals 1 damage to any target. Storm",
        category: "sorcery",
      }),
    ]).heuristicPart.terms.find((term) => term.key === "winSpeed");

    expect(winSpeed?.inputs).toContainEqual({
      name: "fastWins",
      count: 2,
      certainty: "estimated",
    });
    expect(winSpeed?.cards).toEqual([
      {
        by: "rule",
        cardId: "grapeshot",
        name: "Grapeshot",
        ruleId: "winSpeed/storm",
      },
      {
        by: "rule",
        cardId: "thoracle",
        name: "Thassa's Oracle",
        ruleId: "categories/winCondition",
      },
      {
        by: "rule",
        cardId: "thoracle",
        name: "Thassa's Oracle",
        ruleId: "winSpeed/winTheGame",
      },
    ]);
    expect(winSpeed?.score).toBe(3);
  });

  it("says a card the owner moved into a term was placed by them, and still counts it", () => {
    const movedBear: DeckCard = {
      ...aCreature(0),
      id: "moved-bear",
      category: "ramp",
    };
    const ramp = explain([...aCoreList(), movedBear]).heuristicPart.terms.find(
      (term) => term.key === "ramp"
    );

    expect(ramp?.inputs[0]).toEqual({
      name: "ramp",
      count: 9,
      certainty: "estimated",
    });
    expect(ramp?.cards).toContainEqual({
      by: "owner",
      cardId: "moved-bear",
      name: "Bear 0",
    });
    expect(ramp?.cards.filter((card) => card.by === "rule")).toHaveLength(8);
  });

  it("counts only the floors on a list under 60 cards, keeping its terms for the record", () => {
    const assessment = explain(aThirtyCardList());

    expect(assessment.heuristicPart).toMatchObject({
      kind: "tooFewCards",
      deckSize: { count: 30, certainty: "exact" },
    });
    expect(assessment.heuristicPart.terms).toHaveLength(5);
    expect(assessment.heuristicPart.heuristic).toBeCloseTo(2.6);
    expect(assessment.estimate).toBe(1);
    expect(assessment.decidedBy).toBe("floor");
  });
});

describe("explainBracket — the result", () => {
  it("gives the same assessment whatever the card order", () => {
    const list = [
      ...aCoreListWithOneGameChanger(),
      aDeckCard({ id: "odd-1", name: "Zuran Orb" }),
      aDeckCard({ id: "odd-2", name: "Aether Vial" }),
    ];
    const combos = [
      aTwoCardInfinite("Dramatic Reversal", "Isochron Scepter"),
      aTwoCardInfinite("Exquisite Blood", "Sanguine Bond"),
    ];

    expect(explain(list.toReversed(), combos.toReversed())).toEqual(
      explain(list, combos)
    );
  });

  it("stops the estimate at Bracket 4, however strong the list", () => {
    const gameChangers = cards(10, (i) => ({
      ...aRampCard(i, 1),
      id: `gc-${i}`,
      isGameChanger: true,
    }));
    const assessment = explain(
      [...aCoreList().slice(0, -10), ...gameChangers],
      [aTwoCardInfinite("Thassa's Oracle", "Demonic Consultation")]
    );

    expect(floorRow(assessment, "gameChangers")).toMatchObject({
      count: 10,
      floor: 4,
    });
    expect(assessment.estimate).toBe(4);
  });

  it("names the cards no rule gives a role, sorted, each once", () => {
    const assessment = explain([
      ...aCoreList(),
      aDeckCard({ id: "odd-1", name: "Zuran Orb" }),
      aDeckCard({ id: "odd-2", name: "Aether Vial" }),
      aDeckCard({ id: "odd-3", name: "Aether Vial" }),
    ]);

    expect(assessment.unclassified).toEqual(["Aether Vial", "Zuran Orb"]);
  });

  it("states its method version 1, its dated rules version and every blind spot of a list", () => {
    const assessment = explain(aCoreList());

    expect(assessment.methodVersion).toBe(1);
    expect(assessment.rulesVersionId).toBe("wotc-brackets-2025-10-21");
    expect(assessment.blindSpots).toEqual([
      "combosSpellbookMisses",
      "comboTurn",
      "extraTurnChaining",
      "thematicExceptions",
      "pilotAndPod",
      "cedhIntent",
    ]);
  });

  it("puts a badge on every count it holds", () => {
    const assessment = explain(aCoreListWithOneGameChanger(), [
      aTwoCardInfinite("Dramatic Reversal", "Isochron Scepter"),
    ]);
    const counts = countsIn(assessment);

    expect(counts.length).toBeGreaterThan(10);
    expect(counts.filter((badge) => !isCertainty(badge))).toEqual([]);
  });
});

/** The `certainty` beside every `count` in a value, `undefined` where one is missing. */
function countsIn(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(countsIn);
  if (typeof value !== "object" || value === null) return [];
  const own =
    "count" in value
      ? ["certainty" in value ? value.certainty : undefined]
      : [];
  return [...own, ...Object.values(value).flatMap(countsIn)];
}

function isCertainty(value: unknown): boolean {
  return value === "exact" || value === "sourced" || value === "estimated";
}
