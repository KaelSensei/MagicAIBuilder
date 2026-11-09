import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import { ALL_FORMATS } from "@/lib/deck/formats";
import { adviseKeep, classifyHand, hasComputedKeepRules } from "./keep-rules";

function card(id: string, overrides: Partial<DeckCard>): DeckCard {
  return {
    id,
    scryfallId: id,
    name: id,
    quantity: 1,
    category: "creature",
    zone: "main",
    manaCost: "",
    cmc: 0,
    typeLine: "Creature",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    ...overrides,
  };
}

const land = (id: string) =>
  card(id, { typeLine: "Basic Land — Forest", category: "land" });
const ramp = (id: string, cmc: number) =>
  card(id, { typeLine: "Artifact", category: "ramp", cmc });
const spell = (id: string, cmc: number) => card(id, { cmc });

describe("classifyHand", () => {
  // The guide's hand classes: lands, and ramp costing 2 or less.
  it("counts lands and the ramp the deck tags at mana value 2 or less", () => {
    const hand = [
      land("forest"),
      land("island"),
      ramp("sol-ring", 1),
      ramp("arcane-signet", 2),
      ramp("cultivate", 3),
      spell("bear", 2),
      spell("dragon", 5),
    ];

    expect(classifyHand(hand)).toEqual({ lands: 2, cheapRamp: 2 });
  });
});

/** A multiplayer game before any mulligan: the first seven. */
const FIRST_SEVEN = { mulliganCount: 0, firstMulliganFree: true } as const;

describe("adviseKeep with the deck's bracket", () => {
  // Guide, "By bracket": B2, 2 lands and 0 ramp, first seven: -8.0%.
  it("calls a two-land first seven without cheap ramp a mulligan in Bracket 2", () => {
    expect(
      adviseKeep({
        hand: { lands: 2, cheapRamp: 0 },
        mulligan: FIRST_SEVEN,
        bracket: 2,
      })
    ).toEqual({
      kind: "bracket",
      verdict: "mulligan",
      bracket: 2,
      stage: "firstSeven",
      against: "freshSeven",
      marginPct: -8.0,
    });
  });

  // "Beyond ±2% the decision is clear; within ±2% it is a judgment call."
  it("calls a coin flip a judgment call: three lands and no cheap ramp in Bracket 2", () => {
    expect(
      adviseKeep({
        hand: { lands: 3, cheapRamp: 0 },
        mulligan: FIRST_SEVEN,
        bracket: 2,
      })
    ).toMatchObject({ verdict: "judgment", marginPct: -0.9 });
  });

  // The old land-only hint called this hand land-light.
  it("keeps one land with two cheap ramp pieces", () => {
    expect(
      adviseKeep({
        hand: { lands: 1, cheapRamp: 3 },
        mulligan: FIRST_SEVEN,
        bracket: 2,
      })
    ).toMatchObject({ verdict: "keep", marginPct: 2.2 });
  });

  // The guide reads ±2.0 as clear: "only just a keep (+2.0%)", "leans mulligan (−2.0%)".
  it("reads the ±2.0 boundary as the guide's summary does", () => {
    const hand = (lands: number, cheapRamp: number) => ({ lands, cheapRamp });
    const free = { mulliganCount: 1, firstMulliganFree: true };

    expect(
      adviseKeep({ hand: hand(2, 1), mulligan: FIRST_SEVEN, bracket: 4 })
    ).toMatchObject({
      verdict: "keep",
      marginPct: 2.0,
    });
    expect(
      adviseKeep({ hand: hand(4, 0), mulligan: free, bracket: 4 })
    ).toMatchObject({
      verdict: "mulligan",
      marginPct: -2.0,
    });
  });
});

describe("adviseKeep without the free mulligan", () => {
  // "The free-seven figure is also the first seven of a one-on-one game, since
  // both are followed by a six."
  it("weighs a duel's first seven against going to six, and still calls it the first seven", () => {
    expect(
      adviseKeep({
        hand: { lands: 2, cheapRamp: 0 },
        mulligan: { mulliganCount: 0, firstMulliganFree: false },
        bracket: 2,
      })
    ).toEqual({
      kind: "bracket",
      verdict: "judgment",
      bracket: 2,
      stage: "firstSeven",
      against: "six",
      marginPct: -1.5,
    });
  });
});

// Without a bracket rule, only what the guide states for every shell applies.
describe("adviseKeep without a bracket rule", () => {
  // Finding 2: "1 land with two cheap ramp pieces is a keep in every shell".
  it("falls back to the every-shell rule when the deck has no bracket", () => {
    expect(
      adviseKeep({
        hand: { lands: 1, cheapRamp: 2 },
        mulligan: FIRST_SEVEN,
        bracket: null,
      })
    ).toEqual({
      kind: "generic",
      verdict: "keep",
      rule: "oneLandTwoRamp",
      stage: "firstSeven",
      against: "freshSeven",
    });
  });

  // B3 shows "—" for 0 lands and 0 ramp: under 1% of its hands.
  it("falls back to the every-shell rule where the bracket table shows a dash", () => {
    expect(
      adviseKeep({
        hand: { lands: 0, cheapRamp: 0 },
        mulligan: FIRST_SEVEN,
        bracket: 3,
      })
    ).toMatchObject({
      kind: "generic",
      verdict: "mulligan",
      rule: "zeroLands",
    });
  });

  // "The right keep rule depends on the deck and on game speed": no
  // every-shell rule exists for three lands, and none for six or more.
  it.each([
    ["three lands, no bracket", { lands: 3, cheapRamp: 0 }, null],
    [
      "four lands and two ramp, a dash in Bracket 2",
      { lands: 4, cheapRamp: 2 },
      2,
    ],
    ["six lands", { lands: 6, cheapRamp: 0 }, 2],
  ])("gives no rule for %s", (_, hand, bracket) => {
    expect(adviseKeep({ hand, mulligan: FIRST_SEVEN, bracket })).toEqual({
      kind: "noRule",
      stage: "firstSeven",
      reason: "uncoveredHand",
    });
  });

  // Only keeps carry over to the free seven: "the free seven is always more lenient".
  it("carries only the every-shell keeps over to a hand weighed against a six", () => {
    const free = { mulliganCount: 1, firstMulliganFree: true };
    const duel = { mulliganCount: 0, firstMulliganFree: false };

    expect(
      adviseKeep({
        hand: { lands: 2, cheapRamp: 1 },
        mulligan: free,
        bracket: null,
      })
    ).toMatchObject({
      kind: "generic",
      verdict: "keep",
      rule: "twoLandsOneRampAgainstSix",
    });
    expect(
      adviseKeep({
        hand: { lands: 2, cheapRamp: 1 },
        mulligan: duel,
        bracket: null,
      })
    ).toMatchObject({ kind: "generic", stage: "firstSeven", against: "six" });
    expect(
      adviseKeep({
        hand: { lands: 2, cheapRamp: 0 },
        mulligan: free,
        bracket: null,
      })
    ).toMatchObject({ kind: "noRule", reason: "uncoveredHand" });
  });
});

// The guide publishes keep tables for the first and the free seven only.
describe("adviseKeep below seven cards", () => {
  it.each([
    ["six", { mulliganCount: 1, firstMulliganFree: false }],
    ["six", { mulliganCount: 2, firstMulliganFree: true }],
    ["five", { mulliganCount: 3, firstMulliganFree: true }],
    ["fourOrFewer", { mulliganCount: 3, firstMulliganFree: false }],
  ])("gives no computed rule at %s", (stage, mulligan) => {
    expect(
      adviseKeep({ hand: { lands: 2, cheapRamp: 1 }, mulligan, bracket: 2 })
    ).toEqual({
      kind: "noRule",
      stage,
      reason: "smallerHand",
    });
  });
});

/** One published cell of the guide's "By bracket" table. */
interface GuideCell {
  readonly lands: number;
  readonly cheapRamp: number;
  readonly bracket: number;
  readonly firstSeven: number;
  readonly freeSeven: number;
}

/**
 * Reads the guide's "By bracket" table, so the copied data cannot drift from
 * the document it cites. "—" cells are skipped.
 */
function readGuideByBracketTable(): readonly GuideCell[] {
  const guide = readFileSync(
    join(
      process.cwd(),
      "docs/product/guides/commander-mulligans-curves-and-play-style.md"
    ),
    "utf8"
  );
  const section = guide.split("### By bracket")[1]?.split("\n\n")[2] ?? "";
  const cells: GuideCell[] = [];
  for (const line of section.split("\n").slice(2)) {
    const [label = "", ...columns] = line
      .split("|")
      .slice(1, -1)
      .map((part) => part.trim());
    const match = /^(\d) lands?, (\d)\+? ramp$/.exec(label);
    if (!match) continue;
    columns.forEach((column, index) => {
      if (column === "—") return;
      const [first = "", free = ""] = column.replaceAll("−", "-").split(" / ");
      cells.push({
        lands: Number(match[1]),
        cheapRamp: Number(match[2]),
        bracket: index + 1,
        firstSeven: Number(first),
        freeSeven: Number(free),
      });
    });
  }
  return cells;
}

describe("the copied keep table", () => {
  const cells = readGuideByBracketTable();

  it("reads every published cell of the guide's table", () => {
    // 17 rows by 5 brackets, minus the 10 cells the guide marks "—".
    expect(cells).toHaveLength(75);
  });

  it("matches every published first-seven and free-seven margin", () => {
    for (const cell of cells) {
      const hand = { lands: cell.lands, cheapRamp: cell.cheapRamp };
      const first = adviseKeep({
        hand,
        mulligan: FIRST_SEVEN,
        bracket: cell.bracket,
      });
      const free = adviseKeep({
        hand,
        mulligan: { mulliganCount: 1, firstMulliganFree: true },
        bracket: cell.bracket,
      });

      expect(first, JSON.stringify(cell)).toMatchObject({
        marginPct: cell.firstSeven,
      });
      expect(free, JSON.stringify(cell)).toMatchObject({
        marginPct: cell.freeSeven,
      });
    }
  });
});

describe("hasComputedKeepRules", () => {
  // The guide simulates 99 cards plus a commander; it has no 60-card shells.
  it("applies only to Commander, the format the guide's model simulates", () => {
    expect(ALL_FORMATS.filter(hasComputedKeepRules)).toEqual(["commander"]);
  });
});
