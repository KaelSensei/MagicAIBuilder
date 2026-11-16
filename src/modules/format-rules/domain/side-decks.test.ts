import { describe, expect, it } from "vitest";

import {
  checkSideDeck,
  type SideCardLegality,
  type SideDeck,
  type SideDeckCard,
  type SideRuleId,
  type SideRuleResult,
} from "@/modules/format-rules/domain/side-decks";

/** A plane with a distinct English name. */
function plane(name: string, quantity = 1): SideDeckCard {
  return { name, typeLine: "Plane — Dominaria", quantity };
}

/** A phenomenon, which has no subtype (CR 205.3r). */
function phenomenon(name: string): SideDeckCard {
  return { name, typeLine: "Phenomenon", quantity: 1 };
}

/** A scheme; `ongoing` gives it the Ongoing supertype (CR 314.4). */
function scheme(name: string, quantity = 1, ongoing = false): SideDeckCard {
  return {
    name,
    typeLine: ongoing ? "Ongoing Scheme" : "Scheme",
    quantity,
  };
}

/** An Attraction, an artifact subtype (CR 717.1), legal in Commander by default. */
function attraction(
  name: string,
  commanderLegality: SideCardLegality = "legal",
  quantity = 1
): SideDeckCard {
  return {
    name,
    typeLine: "Artifact — Attraction",
    quantity,
    commanderLegality,
  };
}

/** `count` cards named "<prefix> 1" to "<prefix> <count>". */
function numbered(
  count: number,
  prefix: string,
  make: (name: string) => SideDeckCard
): readonly SideDeckCard[] {
  return Array.from({ length: count }, (_, i) => make(`${prefix} ${i + 1}`));
}

/** `count` planes named "Plane 1" to "Plane <count>". */
function planes(count: number): readonly SideDeckCard[] {
  return numbered(count, "Plane", (name) => plane(name));
}

/** The result of one rule, failing the test when the report lacks it. */
function rule(
  results: readonly SideRuleResult[],
  ruleId: SideRuleId
): SideRuleResult {
  const found = results.find((result) => result.ruleId === ruleId);
  if (found === undefined) {
    throw new Error(`the report has no ${ruleId} rule`);
  }
  return found;
}

/** A planar deck with no declared option. */
function planarDeck(cards: readonly SideDeckCard[]): SideDeck {
  return { kind: "planar", option: { kind: "none" }, cards };
}

/** A single communal planar deck for `players` players (CR 901.15a). */
function communalDeck(
  players: 2 | 3 | 4 | 5 | 6 | 7 | 8,
  cards: readonly SideDeckCard[]
): SideDeck {
  return {
    kind: "planar",
    option: { kind: "singleCommunal", players },
    cards,
  };
}

describe("checkSideDeck — planar deck (CR 901.3)", () => {
  it("fails a planar deck of nine distinct planes on the ten-card minimum", () => {
    const report = checkSideDeck(planarDeck(planes(9)));

    expect(rule(report.results, "planarMinTen")).toEqual({
      ruleId: "planarMinTen",
      crRule: "901.3",
      verdict: "fail",
      cards: [],
      detail: { bound: "atLeast", actual: 9, limit: 10 },
    });
  });

  it("passes every rule for ten distinct planes", () => {
    const report = checkSideDeck(planarDeck(planes(10)));

    expect(report).toEqual({
      kind: "planar",
      option: "none",
      results: [
        expect.objectContaining({ ruleId: "planarTypeOnly", verdict: "pass" }),
        expect.objectContaining({ ruleId: "planarMinTen", verdict: "pass" }),
        expect.objectContaining({
          ruleId: "planarPhenomenaMaxTwo",
          verdict: "pass",
        }),
        expect.objectContaining({
          ruleId: "planarDistinctNames",
          verdict: "pass",
        }),
      ],
    });
  });

  it("fails three phenomena and names them, while two are allowed", () => {
    const three = [
      ...planes(8),
      phenomenon("Chaotic Aether"),
      phenomenon("Interplanar Tunnel"),
      phenomenon("Spatial Merging"),
    ];

    expect(
      rule(checkSideDeck(planarDeck(three)).results, "planarPhenomenaMaxTwo")
    ).toEqual({
      ruleId: "planarPhenomenaMaxTwo",
      crRule: "901.3",
      verdict: "fail",
      cards: ["Chaotic Aether", "Interplanar Tunnel", "Spatial Merging"],
      detail: { bound: "atMost", actual: 3, limit: 2 },
    });
    expect(
      rule(
        checkSideDeck(planarDeck(three.slice(0, 10))).results,
        "planarPhenomenaMaxTwo"
      ).verdict
    ).toBe("pass");
  });

  it("counts phenomena toward the ten cards", () => {
    const report = checkSideDeck(
      planarDeck([
        ...planes(8),
        phenomenon("Chaotic Aether"),
        phenomenon("Morphic Tide"),
      ])
    );

    expect(rule(report.results, "planarMinTen").verdict).toBe("pass");
  });

  it("fails two copies of one plane, even on two lines", () => {
    const report = checkSideDeck(
      planarDeck([...planes(9), plane("Plane 1"), plane("Tazeem", 2)])
    );

    expect(rule(report.results, "planarDistinctNames")).toEqual({
      ruleId: "planarDistinctNames",
      crRule: "901.3",
      verdict: "fail",
      cards: ["Plane 1", "Tazeem"],
      detail: { bound: "atMost", actual: 2, limit: 1 },
    });
  });

  it("fails a card that is neither a plane nor a phenomenon and does not count it", () => {
    const report = checkSideDeck(
      planarDeck([
        ...planes(9),
        {
          name: "Ajani Goldmane",
          typeLine: "Legendary Planeswalker — Ajani",
          quantity: 1,
        },
      ])
    );

    expect(rule(report.results, "planarTypeOnly")).toEqual({
      ruleId: "planarTypeOnly",
      crRule: "901.3",
      verdict: "fail",
      cards: ["Ajani Goldmane"],
      detail: { bound: "atMost", actual: 1, limit: 0 },
    });
    expect(rule(report.results, "planarMinTen").detail.actual).toBe(9);
  });

  it("reports an empty planar deck without throwing", () => {
    const report = checkSideDeck(planarDeck([]));

    expect(rule(report.results, "planarMinTen").detail).toEqual({
      bound: "atLeast",
      actual: 0,
      limit: 10,
    });
    expect(rule(report.results, "planarDistinctNames").verdict).toBe("pass");
  });
});

describe("checkSideDeck — single communal planar deck (CR 901.15a)", () => {
  it("needs forty cards for four players, the smaller of forty and ten per player", () => {
    const short = checkSideDeck(communalDeck(4, planes(39)));
    const full = checkSideDeck(communalDeck(4, planes(40)));

    expect(short.option).toBe("singleCommunal");
    expect(rule(short.results, "communalMinSize")).toEqual({
      ruleId: "communalMinSize",
      crRule: "901.15a",
      verdict: "fail",
      cards: [],
      detail: { bound: "atLeast", actual: 39, limit: 40 },
    });
    expect(rule(full.results, "communalMinSize").verdict).toBe("pass");
    expect(full.results.map((result) => result.ruleId)).not.toContain(
      "planarMinTen"
    );
  });

  it("needs thirty cards for three players and caps phenomena at six", () => {
    const sixPhenomena = numbered(6, "Phenomenon", phenomenon);
    const sevenPhenomena = numbered(7, "Phenomenon", phenomenon);
    const fits = checkSideDeck(
      communalDeck(3, [...planes(24), ...sixPhenomena])
    );
    const tooMany = checkSideDeck(
      communalDeck(3, [...planes(24), ...sevenPhenomena])
    );

    expect(rule(fits.results, "communalMinSize").detail.limit).toBe(30);
    expect(rule(fits.results, "communalPhenomenaMax").verdict).toBe("pass");
    expect(rule(tooMany.results, "communalPhenomenaMax")).toMatchObject({
      crRule: "901.15a",
      verdict: "fail",
      detail: { bound: "atMost", actual: 7, limit: 6 },
    });
  });

  it("keeps the distinct-name rule under CR 901.15a", () => {
    const report = checkSideDeck(
      communalDeck(2, [...planes(19), plane("Plane 1")])
    );

    expect(rule(report.results, "planarDistinctNames")).toMatchObject({
      crRule: "901.15a",
      verdict: "fail",
      cards: ["Plane 1"],
    });
  });
});

describe("checkSideDeck — scheme deck (CR 904.3)", () => {
  function schemeDeck(
    cards: readonly SideDeckCard[],
    option: "none" | "supervillainRumble" | "archenemyCommander" = "none"
  ): SideDeck {
    return { kind: "scheme", option: { kind: option }, cards };
  }

  const twentySchemes = numbered(20, "Scheme", (name) => scheme(name));

  it("fails nineteen schemes on the twenty-card minimum, counting ongoing schemes", () => {
    const report = checkSideDeck(
      schemeDeck([
        ...numbered(18, "Scheme", (name) => scheme(name)),
        scheme("Because I Have Willed It", 1, true),
      ])
    );

    expect(rule(report.results, "schemeMinTwenty")).toEqual({
      ruleId: "schemeMinTwenty",
      crRule: "904.3",
      verdict: "fail",
      cards: [],
      detail: { bound: "atLeast", actual: 19, limit: 20 },
    });
  });

  it("allows two copies of a scheme and fails three", () => {
    const two = checkSideDeck(
      schemeDeck([...twentySchemes, scheme("Scheme 1")])
    );
    const three = checkSideDeck(
      schemeDeck([...twentySchemes, scheme("Scheme 1", 2)])
    );

    expect(rule(two.results, "schemeMaxTwoCopies").verdict).toBe("pass");
    expect(rule(three.results, "schemeMaxTwoCopies")).toEqual({
      ruleId: "schemeMaxTwoCopies",
      crRule: "904.3",
      verdict: "fail",
      cards: ["Scheme 1"],
      detail: { bound: "atMost", actual: 3, limit: 2 },
    });
  });

  it("fails a card that is not a scheme", () => {
    const report = checkSideDeck(
      schemeDeck([...twentySchemes, plane("Tazeem")])
    );

    expect(rule(report.results, "schemeTypeOnly")).toMatchObject({
      crRule: "904.3",
      verdict: "fail",
      cards: ["Tazeem"],
    });
  });

  it("says which option was declared and applies the same construction rule", () => {
    const none = checkSideDeck(schemeDeck(twentySchemes));
    const commander = checkSideDeck(
      schemeDeck(twentySchemes, "archenemyCommander")
    );
    const rumble = checkSideDeck(
      schemeDeck(twentySchemes, "supervillainRumble")
    );

    expect(commander.option).toBe("archenemyCommander");
    expect(rumble.option).toBe("supervillainRumble");
    expect(commander.results).toEqual(none.results);
    expect(rumble.results).toEqual(none.results);
    expect(none.results.every((result) => result.verdict === "pass")).toBe(
      true
    );
  });
});

describe("checkSideDeck — Attraction deck (CR 717.2a)", () => {
  function attractionDeck(cards: readonly SideDeckCard[]): SideDeck {
    return { kind: "attraction", cards };
  }

  const tenAttractions = numbered(10, "Attraction", (name) => attraction(name));

  it("passes every rule for ten distinct Commander-legal Attractions", () => {
    const report = checkSideDeck(attractionDeck(tenAttractions));

    expect(report.option).toBe("none");
    expect(report.results.map((result) => result.ruleId)).toEqual([
      "attractionTypeOnly",
      "attractionMinTen",
      "attractionDistinctNames",
      "attractionCommanderLegal",
    ]);
    expect(report.results.every((result) => result.verdict === "pass")).toBe(
      true
    );
  });

  it("fails nine Attractions and two copies of one", () => {
    const report = checkSideDeck(
      attractionDeck([
        ...tenAttractions.slice(0, 8),
        attraction("Attraction 1"),
      ])
    );

    expect(rule(report.results, "attractionMinTen")).toMatchObject({
      crRule: "717.2a",
      verdict: "fail",
      detail: { bound: "atLeast", actual: 9, limit: 10 },
    });
    expect(rule(report.results, "attractionDistinctNames")).toMatchObject({
      crRule: "717.2a",
      verdict: "fail",
      cards: ["Attraction 1"],
    });
  });

  it("fails a card that is not an Attraction", () => {
    const report = checkSideDeck(
      attractionDeck([
        ...tenAttractions,
        { name: "Sol Ring", typeLine: "Artifact", quantity: 1 },
      ])
    );

    expect(rule(report.results, "attractionTypeOnly")).toMatchObject({
      verdict: "fail",
      cards: ["Sol Ring"],
    });
  });

  it("fails an Attraction that is not legal in Commander and names it", () => {
    const report = checkSideDeck(
      attractionDeck([
        ...tenAttractions,
        attraction("Bounce House", "not_legal"),
        attraction("Ride Guide", "banned"),
      ])
    );

    expect(rule(report.results, "attractionCommanderLegal")).toEqual({
      ruleId: "attractionCommanderLegal",
      crRule: "100.7",
      verdict: "fail",
      cards: ["Bounce House", "Ride Guide"],
      detail: { bound: "atMost", actual: 2, limit: 0 },
    });
  });

  it("reports unknown, not pass, when an Attraction's legality was not stored", () => {
    const report = checkSideDeck(
      attractionDeck([
        ...tenAttractions,
        {
          name: "Kiddie Coaster",
          typeLine: "Artifact — Attraction",
          quantity: 1,
        },
      ])
    );

    expect(rule(report.results, "attractionCommanderLegal")).toMatchObject({
      verdict: "unknown",
      cards: ["Kiddie Coaster"],
    });
  });
});

describe("checkSideDeck — types", () => {
  it("refuses an option that does not belong to the kind", () => {
    const report = checkSideDeck({
      kind: "scheme",
      // @ts-expect-error a communal planar deck is not a scheme deck option
      option: { kind: "singleCommunal", players: 4 },
      cards: [],
    });

    expect(report.kind).toBe("scheme");
  });
});
