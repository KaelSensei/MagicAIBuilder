/**
 * A league round's change allowance (I-104 slice 1): swaps, money and the
 * declared pool, as a report. Nothing is stored.
 */
import { describe, expect, it } from "vitest";
import {
  checkRoundAllowance,
  type AllowancePart,
  type LeagueListCard,
  type LeagueListPair,
} from "./league-allowance";

/** Six cards leaving a round-2 list. */
const SIX_OUT: readonly LeagueListCard[] = [
  { name: "Sol Ring", count: 1 },
  { name: "Arcane Signet", count: 1 },
  { name: "Cultivate", count: 1 },
  { name: "Kodama's Reach", count: 1 },
  { name: "Birds of Paradise", count: 1 },
  { name: "Counterspell", count: 1 },
];

/** Six cards arriving in the round-3 list. */
const SIX_IN: readonly LeagueListCard[] = [
  { name: "Rhystic Study", count: 1 },
  { name: "Smothering Tithe", count: 1 },
  { name: "Cyclonic Rift", count: 1 },
  { name: "Teferi's Protection", count: 1 },
  { name: "Fierce Guardianship", count: 1 },
  { name: "Deflecting Swat", count: 1 },
];

describe("checkRoundAllowance", () => {
  it("fails six swaps against a cap of five and names the six pairs", () => {
    const report = checkRoundAllowance(
      { previous: SIX_OUT, next: SIX_IN },
      [
        {
          kind: "swaps",
          max: 5,
          basicsExempt: true,
          commanderCounts: false,
        },
      ],
      []
    );

    expect(report.passed).toBe(false);
    expect(report.parts).toEqual([
      {
        part: "swaps",
        verdict: "fail",
        detail: "6 of 5",
        pairs: [
          { out: "Arcane Signet", in: "Cyclonic Rift", exempt: false },
          { out: "Birds of Paradise", in: "Deflecting Swat", exempt: false },
          { out: "Counterspell", in: "Fierce Guardianship", exempt: false },
          { out: "Cultivate", in: "Rhystic Study", exempt: false },
          { out: "Kodama's Reach", in: "Smothering Tithe", exempt: false },
          { out: "Sol Ring", in: "Teferi's Protection", exempt: false },
        ],
      },
    ]);
  });

  it("passes four swaps against a cap of five", () => {
    const report = checkRoundAllowance(
      { previous: SIX_OUT.slice(0, 4), next: SIX_IN.slice(0, 4) },
      [{ kind: "swaps", max: 5, basicsExempt: true, commanderCounts: false }],
      []
    );
    expect(report.passed).toBe(true);
    expect(report.parts[0]).toMatchObject({
      verdict: "pass",
      detail: "4 of 5",
    });
  });

  it("does not count a basic land swapped for a basic land", () => {
    const previous: readonly LeagueListCard[] = [
      { name: "Island", count: 1, basic: true },
      { name: "Sol Ring", count: 1 },
    ];
    const next: readonly LeagueListCard[] = [
      { name: "Forest", count: 1, basic: true },
      { name: "Rhystic Study", count: 1 },
    ];
    const exempt = checkRoundAllowance(
      { previous, next },
      [{ kind: "swaps", max: 1, basicsExempt: true, commanderCounts: false }],
      []
    );
    const counted = checkRoundAllowance(
      { previous, next },
      [{ kind: "swaps", max: 1, basicsExempt: false, commanderCounts: false }],
      []
    );
    expect(exempt.passed).toBe(true);
    expect(exempt.parts[0]).toMatchObject({
      verdict: "pass",
      detail: "1 of 1",
      pairs: [
        { out: "Island", in: "Forest", exempt: true },
        { out: "Sol Ring", in: "Rhystic Study", exempt: false },
      ],
    });
    expect(counted.passed).toBe(false);
    expect(counted.parts[0]).toMatchObject({
      verdict: "fail",
      detail: "2 of 1",
    });
  });

  it("counts a commander change only when the host says it counts", () => {
    const previous: readonly LeagueListCard[] = [
      { name: "Atraxa, Praetors' Voice", count: 1, commander: true },
    ];
    const next: readonly LeagueListCard[] = [
      { name: "Etali, Primal Conqueror", count: 1, commander: true },
    ];
    const ignored = checkRoundAllowance(
      { previous, next },
      [{ kind: "swaps", max: 0, basicsExempt: true, commanderCounts: false }],
      []
    );
    const counted = checkRoundAllowance(
      { previous, next },
      [{ kind: "swaps", max: 0, basicsExempt: true, commanderCounts: true }],
      []
    );
    expect(ignored.parts[0]).toMatchObject({
      verdict: "pass",
      detail: "0 of 0",
      pairs: [],
    });
    expect(counted.parts[0]).toMatchObject({
      verdict: "fail",
      detail: "1 of 0",
      pairs: [
        {
          out: "Atraxa, Praetors' Voice",
          in: "Etali, Primal Conqueror",
          exempt: false,
        },
      ],
    });
  });

  it("counts the larger side when more cards leave than arrive", () => {
    const report = checkRoundAllowance(
      {
        previous: [
          { name: "Sol Ring", count: 1 },
          { name: "Arcane Signet", count: 1 },
        ],
        next: [],
      },
      [{ kind: "swaps", max: 1, basicsExempt: true, commanderCounts: false }],
      []
    );
    expect(report.parts[0]).toMatchObject({
      verdict: "fail",
      detail: "2 of 1",
      pairs: [
        { out: "Arcane Signet", in: null, exempt: false },
        { out: "Sol Ring", in: null, exempt: false },
      ],
    });
  });

  it("passes $13.50 of additions against $10 plus $4 carried and carries $0.50", () => {
    const report = checkRoundAllowance(
      {
        previous: [
          { name: "Sol Ring", count: 1 },
          { name: "Arcane Signet", count: 1 },
        ],
        next: [
          { name: "Rhystic Study", count: 1 },
          { name: "Smothering Tithe", count: 1 },
        ],
      },
      [
        {
          kind: "money",
          amount: 10,
          market: "usd",
          priceSource: "tcgplayer",
          carryOver: true,
          carriedIn: 4,
        },
      ],
      [
        price("Rhystic Study", "usd", "tcgplayer", "2026-11-19", 10),
        price("Smothering Tithe", "usd", "tcgplayer", "2026-11-19", 3.5),
      ]
    );
    expect(report.passed).toBe(true);
    expect(report.parts[0]).toEqual({
      part: "money",
      verdict: "pass",
      detail: "$13.50 of $14.00",
      cards: [],
      carryOut: 0.5,
      priceDate: "2026-11-19",
      priceSource: "tcgplayer",
    });
  });

  it("fails money when the additions cost more than the budget", () => {
    const report = checkRoundAllowance(
      { previous: [], next: [{ name: "Rhystic Study", count: 1 }] },
      [
        {
          kind: "money",
          amount: 10,
          market: "usd",
          priceSource: "tcgplayer",
          carryOver: true,
          carriedIn: 4,
        },
      ],
      [price("Rhystic Study", "usd", "tcgplayer", "2026-11-19", 15)]
    );
    expect(report.passed).toBe(false);
    expect(report.parts[0]).toMatchObject({
      verdict: "fail",
      detail: "$15.00 of $14.00",
      carryOut: null,
    });
  });

  it("leaves money unknown when an added card has no price, and the report does not pass", () => {
    const report = checkRoundAllowance(
      { previous: [], next: [{ name: "Rhystic Study", count: 1 }] },
      [
        {
          kind: "swaps",
          max: 5,
          basicsExempt: true,
          commanderCounts: false,
        },
        {
          kind: "money",
          amount: 10,
          market: "usd",
          priceSource: "tcgplayer",
          carryOver: true,
          carriedIn: 0,
        },
      ],
      [price("Rhystic Study", "usd", "tcgplayer", "2026-11-19", null)]
    );
    expect(report.passed).toBe(false);
    expect(report.parts[1]).toMatchObject({
      verdict: "unknown",
      detail: "Rhystic Study is unpriced",
      cards: ["Rhystic Study"],
      carryOut: null,
    });
  });

  it("ignores carried money when this round does not carry, and carries nothing out", () => {
    const report = checkRoundAllowance(
      { previous: [], next: [{ name: "Sol Ring", count: 1 }] },
      [
        {
          kind: "money",
          amount: 10,
          market: "usd",
          priceSource: "tcgplayer",
          carryOver: false,
          carriedIn: 4,
        },
      ],
      [price("Sol Ring", "usd", "tcgplayer", "2026-11-19", 3)]
    );
    expect(report.parts[0]).toMatchObject({
      verdict: "pass",
      detail: "$3.00 of $10.00",
      carryOut: 0,
    });
  });

  it("treats a price from another market or another source as unpriced", () => {
    const lists: LeagueListPair = {
      previous: [],
      next: [{ name: "Sol Ring", count: 1 }],
    };
    const part: AllowancePart = {
      kind: "money",
      amount: 10,
      market: "usd",
      priceSource: "tcgplayer",
      carryOver: false,
      carriedIn: 0,
    };
    const otherMarket = checkRoundAllowance(
      lists,
      [part],
      [price("Sol Ring", "eur", "tcgplayer", "2026-11-19", 3)]
    );
    const otherSource = checkRoundAllowance(
      lists,
      [part],
      [price("Sol Ring", "usd", "cardmarket", "2026-11-19", 3)]
    );
    expect(otherMarket.parts[0]).toMatchObject({ verdict: "unknown" });
    expect(otherSource.parts[0]).toMatchObject({ verdict: "unknown" });
  });

  it("prices a euro league in euros", () => {
    const report = checkRoundAllowance(
      { previous: [], next: [{ name: "Sol Ring", count: 1 }] },
      [
        {
          kind: "money",
          amount: 1,
          market: "eur",
          priceSource: "cardmarket",
          carryOver: false,
          carriedIn: 0,
        },
      ],
      [price("Sol Ring", "eur", "cardmarket", "2026-11-19", 1)]
    );
    expect(report.parts[0]).toMatchObject({
      verdict: "pass",
      detail: "€1.00 of €1.00",
    });
  });

  it("fails a card added outside the declared pool and names it", () => {
    const report = checkRoundAllowance(
      { previous: [], next: [{ name: "Sol Ring", count: 1 }] },
      [{ kind: "pool", declaredOnly: true, declared: ["Rhystic Study"] }],
      []
    );
    expect(report.passed).toBe(false);
    expect(report.parts[0]).toEqual({
      part: "pool",
      verdict: "fail",
      detail: "Sol Ring is outside the declared pool",
      cards: ["Sol Ring"],
    });
  });

  it("does not ask the pool about a card the previous list already had", () => {
    const kept: readonly LeagueListCard[] = [{ name: "Sol Ring", count: 1 }];
    const report = checkRoundAllowance(
      { previous: kept, next: kept },
      [{ kind: "pool", declaredOnly: true, declared: [] }],
      []
    );
    expect(report.parts[0]).toMatchObject({
      verdict: "pass",
      detail: "inside the declared pool",
      cards: [],
    });
  });

  it("passes the pool part when the host did not restrict additions", () => {
    const report = checkRoundAllowance(
      { previous: [], next: [{ name: "Sol Ring", count: 1 }] },
      [{ kind: "pool", declaredOnly: false, declared: [] }],
      []
    );
    expect(report.parts[0]).toMatchObject({
      verdict: "pass",
      detail: "not restricted",
    });
  });

  it("passes an empty allowance", () => {
    const report = checkRoundAllowance(
      { previous: SIX_OUT, next: SIX_IN },
      [],
      []
    );
    expect(report).toEqual({ parts: [], passed: true });
  });
});

function price(
  name: string,
  market: "usd" | "eur",
  source: string,
  priceDate: string,
  amount: number | null
) {
  return { name, market, source, priceDate, amount };
}
