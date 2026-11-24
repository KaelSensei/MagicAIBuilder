/**
 * `pathToBracket` lists what stands between a deck and a lower target bracket
 * (I-77 slice 4, requirements 5.1 to 5.4): the official floors first, with
 * their cards, then the heuristic terms with the count at which each would
 * read lower.
 *
 * Solitary on the pure policy, fed with real assessments: the fixture decks
 * go through `computeDeckStats` and `explainBracket` as they do in the
 * builder, so every bound comes from the method itself.
 */
import { describe, expect, it } from "vitest";
import type { BracketLevel } from "@/lib/constants/brackets";
import type { BracketAssessment } from "@/lib/deck/bracket-assessment";
import { type ComboData, explainBracket } from "@/lib/deck/explain-bracket";
import { pathToBracket } from "@/lib/deck/path-to-bracket";
import { computeDeckStats } from "@/lib/deck/stats";
import {
  aBasicLand,
  aCoreList,
  aCoreListWithOneGameChanger,
  aCreature,
  aDrawCard,
  aRampCard,
  aRemovalCard,
  aThirtyCardList,
  aTwoCardInfinite,
  armageddon,
  cards,
  timeWarp,
} from "@/lib/deck/testing/bracket-decks";
import type { DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";

/** A Game Changer on Wizards' list, with no role in any term. */
function aGameChanger(name: string): DeckCard {
  return aDeckCard({
    id: `gc-${name}`,
    name,
    cmc: 2,
    typeLine: "Enchantment",
    isGameChanger: true,
  });
}

/**
 * A 99-card list at mana value 2: 37 lands, 14 ramp, 14 draw, 11 removal and
 * 23 creatures. Ramp, draw, removal and average mana value each read 4; win
 * speed reads 2. The heuristic is 3.6, so the estimate is 4.
 */
function aStrongList(): DeckCard[] {
  return [
    ...cards(37, aBasicLand),
    ...cards(14, (i) => aRampCard(i, 2)),
    ...cards(14, (i) => aDrawCard(i, 2)),
    ...cards(11, (i) => aRemovalCard(i, 2)),
    ...cards(23, (i) => aCreature(i, 2)),
  ];
}

/** The assessment the builder computes for a Commander deck of these cards. */
function assess(
  deckCards: readonly DeckCard[],
  comboData: ComboData = { kind: "found", combos: [], fetchedAt: null }
): BracketAssessment {
  const deck = aDeck({ cards: [...deckCards] });
  const assessment = explainBracket({
    deck,
    stats: computeDeckStats(deck),
    comboData,
  });
  if (assessment === null) throw new Error("a Commander deck is assessed");
  return assessment;
}

function path(deckCards: readonly DeckCard[], target: BracketLevel) {
  return pathToBracket(assess(deckCards), target);
}

describe("pathToBracket — the official floors come first", () => {
  it("a Bracket 2 target lists the Game Changer floor with its two cards before any term", () => {
    const lines = path(
      [
        ...aStrongList().slice(0, -2),
        aGameChanger("Smothering Tithe"),
        aGameChanger("Rhystic Study"),
      ],
      2
    );

    expect(lines[0]).toEqual({
      kind: "gameChangerFloor",
      target: 2,
      allowed: 0,
      count: 2,
      cards: ["Rhystic Study", "Smothering Tithe"],
    });
    expect(
      lines.slice(1).map((line) => ("key" in line ? line.key : null))
    ).toEqual(["ramp", "draw", "removal", "avgCmc"]);
  });
});

describe("pathToBracket — the heuristic terms follow, re-run at their bounds", () => {
  it("a draw term at 4 from 14 cards names 8 as the bound for Bracket 2", () => {
    const draw = path(aStrongList(), 2).find(
      (line) => "key" in line && line.key === "draw"
    );

    expect(draw).toEqual({
      kind: "term",
      key: "draw",
      score: 4,
      measure: "draw",
      value: 14,
      direction: "higherIsStronger",
      bound: 8,
      wouldRead: 2,
    });
  });

  it("re-runs the ramp term with its curve: 14 ramp cards on a curve of 2 read 3 at 8 or fewer", () => {
    const ramp = path(aStrongList(), 3).find(
      (line) => "key" in line && line.key === "ramp"
    );

    expect(ramp).toEqual({
      kind: "term",
      key: "ramp",
      score: 4,
      measure: "ramp",
      value: 14,
      direction: "higherIsStronger",
      bound: 8,
      wouldRead: 3,
    });
  });

  it("says no single count brings the ramp term to 2 when its curve alone keeps it above", () => {
    const ramp = path(aStrongList(), 2).find(
      (line) => "key" in line && line.key === "ramp"
    );

    expect(ramp).toEqual({ kind: "termOutOfReach", key: "ramp", score: 4 });
  });

  it("names the average mana value above which the curve term would read 2", () => {
    const curve = path(aStrongList(), 2).find(
      (line) => "key" in line && line.key === "avgCmc"
    );

    expect(curve).toEqual({
      kind: "term",
      key: "avgCmc",
      score: 4,
      measure: "avgCmc",
      value: 2,
      direction: "lowerIsStronger",
      bound: 2.5,
      wouldRead: 2,
    });
  });

  it("leaves out a term already at or below the target", () => {
    const keys = path(aStrongList(), 2).flatMap((line) =>
      "key" in line ? [line.key] : []
    );

    expect(keys).not.toContain("winSpeed");
  });
});

describe("pathToBracket — a target the estimate does not exceed", () => {
  it("a target at the estimate says only that no official rule stops the deck there", () => {
    expect(path(aStrongList(), 4)).toEqual([
      { kind: "noRuleStops", target: 4 },
    ]);
  });

  it("a target above the estimate says the same, though the list holds a Game Changer", () => {
    const list = aCoreListWithOneGameChanger();

    expect(assess(list).estimate).toBe(3);
    expect(path(list, 4)).toEqual([{ kind: "noRuleStops", target: 4 }]);
  });

  it("a Bracket 5 target says only that a list cannot show the cEDH intent", () => {
    expect(path(aStrongList(), 5)).toEqual([{ kind: "cedhIntent" }]);
  });
});

describe("pathToBracket — what the estimate could not check", () => {
  const unavailable: ComboData = { kind: "unavailable" };

  it("combo data unavailable marks the combo floor not checked, after the floors and before the terms", () => {
    const lines = pathToBracket(
      assess(
        [...aStrongList().slice(0, -1), aGameChanger("Rhystic Study")],
        unavailable
      ),
      2
    );

    expect(lines.slice(0, 3)).toEqual([
      {
        kind: "gameChangerFloor",
        target: 2,
        allowed: 0,
        count: 1,
        cards: ["Rhystic Study"],
      },
      { kind: "comboFloorNotChecked" },
      { kind: "termOutOfReach", key: "ramp", score: 4 },
    ]);
  });

  it("combo data unavailable is said beside a target the estimate does not exceed", () => {
    expect(pathToBracket(assess(aStrongList(), unavailable), 4)).toEqual([
      { kind: "noRuleStops", target: 4 },
      { kind: "comboFloorNotChecked" },
    ]);
  });

  it("a list under 60 cards lists its floors only, then says it has too few cards for the heuristic part", () => {
    const lines = path(
      [...aThirtyCardList(), aGameChanger("Smothering Tithe")],
      2
    );

    expect(lines).toEqual([
      {
        kind: "gameChangerFloor",
        target: 2,
        allowed: 0,
        count: 1,
        cards: ["Smothering Tithe"],
      },
      { kind: "tooFewCards", deckSize: 31 },
    ]);
  });
});

describe("pathToBracket — other floors", () => {
  it("lists a two-card combo the way it lists Game Changers, with the cards of the combo", () => {
    const lines = pathToBracket(
      assess(aCoreList(), {
        kind: "found",
        combos: [
          aTwoCardInfinite(
            "Pitiless Plunderer",
            "Chatterfang, Squirrel General"
          ),
        ],
        fetchedAt: "2026-11-20",
      }),
      2
    );

    expect(lines).toEqual([
      {
        kind: "restrictionFloor",
        rule: "twoCardCombos",
        target: 2,
        count: 1,
        cards: ["Chatterfang, Squirrel General", "Pitiless Plunderer"],
      },
    ]);
  });

  it("lists extra-turn cards first for a Bracket 1 target, which allows none", () => {
    const [first] = path([...aCoreList().slice(0, -1), timeWarp()], 1);

    expect(first).toEqual({
      kind: "restrictionFloor",
      rule: "extraTurns",
      target: 1,
      count: 1,
      cards: ["Time Warp"],
    });
  });

  it("does not list extra-turn cards for a Bracket 2 target, which allows them unchained", () => {
    const lines = path([...aCoreList().slice(0, -1), timeWarp()], 2);

    expect(lines).toEqual([{ kind: "noRuleStops", target: 2 }]);
  });

  it("names mass land denial for a target at the estimate, since it sets no part of the estimate yet", () => {
    const list = [...aCoreList().slice(0, -1), armageddon()];

    expect(assess(list).estimate).toBe(2);
    expect(path(list, 2)).toEqual([
      {
        kind: "restrictionFloor",
        rule: "massLandDenial",
        target: 2,
        count: 1,
        cards: ["Armageddon"],
      },
    ]);
  });

  it("says no official rule stops a list with Armageddon at Bracket 4", () => {
    expect(path([...aCoreList().slice(0, -1), armageddon()], 4)).toEqual([
      { kind: "noRuleStops", target: 4 },
    ]);
  });

  it("allows up to three Game Changers at Bracket 3", () => {
    const lines = path(
      [
        ...aCoreList().slice(0, -4),
        ...[
          "Ad Nauseam",
          "Cyclonic Rift",
          "Rhystic Study",
          "Smothering Tithe",
        ].map(aGameChanger),
      ],
      3
    );

    expect(lines).toEqual([
      {
        kind: "gameChangerFloor",
        target: 3,
        allowed: 3,
        count: 4,
        cards: [
          "Ad Nauseam",
          "Cyclonic Rift",
          "Rhystic Study",
          "Smothering Tithe",
        ],
      },
    ]);
  });
});

describe("pathToBracket — determinism", () => {
  it("gives the same lines in the same order whatever the card order", () => {
    const list = [
      ...aStrongList().slice(0, -2),
      aGameChanger("Smothering Tithe"),
      aGameChanger("Rhystic Study"),
    ];
    const combos: ComboData = {
      kind: "found",
      combos: [aTwoCardInfinite("Pitiless Plunderer", "Bear 0")],
      fetchedAt: null,
    };

    const inOrder = pathToBracket(assess(list, combos), 1);
    const reversed = pathToBracket(assess(list.toReversed(), combos), 1);

    expect(inOrder.map((line) => line.kind)).toEqual([
      "gameChangerFloor",
      "restrictionFloor",
      "termOutOfReach",
      "term",
      "term",
      "term",
      "term",
    ]);
    expect(reversed).toEqual(inOrder);
  });
});
