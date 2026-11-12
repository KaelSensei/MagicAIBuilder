/**
 * The partner abilities `readPartnerAbilities` reads from Oracle text
 * (CR 702.124), and how long it takes on text built to make a regular
 * expression backtrack.
 */
import { describe, expect, it } from "vitest";

import {
  AMY_POND,
  BJORNA,
  CECILY_SAVED_BEFORE_RENAME,
  ELLIE,
  JAHEIRA,
  KRATOS,
  LEONARDO,
  PIR,
  ROSE_TYLER,
  SEFRIS,
  TYMNA,
} from "./fixtures/partner-cards";
import { readPartnerAbilities, type PairingCard } from "./partner-abilities";

/**
 * A wall-clock ceiling far above what a linear scan of the inputs below
 * needs (well under a millisecond) and far below what a quadratic one does
 * (about a second for 30,000 characters).
 */
const LINEAR_TIME_BUDGET_MS = 100;

/** @returns a card whose Oracle text is exactly `oracleText` */
function cardWithText(oracleText: string): PairingCard {
  return { name: "Test Card", typeLine: "Legendary Creature", oracleText };
}

describe("readPartnerAbilities — real Oracle texts (CR 702.124)", () => {
  it.each([
    {
      label: "plain partner (Tymna)",
      card: TYMNA,
      abilities: [{ kind: "partner" }],
    },
    {
      label: "partner with (Pir)",
      card: PIR,
      abilities: [{ kind: "partnerWith", name: "Toothy, Imaginary Friend" }],
    },
    {
      label: "partner—Survivors (Ellie)",
      card: ELLIE,
      abilities: [{ kind: "partnerQuality", quality: "Survivors" }],
    },
    {
      label: "partner—Father & son (Kratos)",
      card: KRATOS,
      abilities: [{ kind: "partnerQuality", quality: "Father & son" }],
    },
    {
      label: "partner—Friends forever (Bjorna)",
      card: BJORNA,
      abilities: [{ kind: "partnerQuality", quality: "Friends forever" }],
    },
    {
      label: "partner—Character select (Leonardo)",
      card: LEONARDO,
      abilities: [{ kind: "partnerQuality", quality: "Character select" }],
    },
    {
      label: "Friends forever saved before the rename (Cecily)",
      card: CECILY_SAVED_BEFORE_RENAME,
      abilities: [{ kind: "partnerQuality", quality: "Friends forever" }],
    },
    {
      label: "choose a Background (Jaheira)",
      card: JAHEIRA,
      abilities: [{ kind: "chooseBackground" }],
    },
    {
      label: "Doctor's companion (Rose Tyler)",
      card: ROSE_TYLER,
      abilities: [{ kind: "doctorsCompanion" }],
    },
    {
      label:
        "two abilities on one card, in Oracle order (Amy Pond, CR 702.124g)",
      card: AMY_POND,
      abilities: [
        { kind: "partnerWith", name: "Rory Williams" },
        { kind: "doctorsCompanion" },
      ],
    },
    { label: "no partner ability (Sefris)", card: SEFRIS, abilities: [] },
  ])("reads $label", ({ card, abilities }) => {
    expect(readPartnerAbilities(card)).toEqual(abilities);
  });
});

describe("readPartnerAbilities — the partner—[quality] line (CR 702.124i)", () => {
  it.each([
    {
      label: "a spaced dash",
      line: "Partner — Survivors",
      quality: "Survivors",
    },
    {
      label: "lower case",
      line: "partner—father & son",
      quality: "Father & son",
    },
    {
      label: "reminder text after the quality",
      line: "Partner—Character select (You can have two commanders if both have this ability.)",
      quality: "Character select",
    },
  ])("accepts $label", ({ line, quality }) => {
    expect(readPartnerAbilities(cardWithText(line))).toEqual([
      { kind: "partnerQuality", quality },
    ]);
  });

  it.each([
    {
      label: "a quality CR 702.124i does not list",
      line: "Partner—Best friends",
    },
    { label: "a dash with nothing after it", line: "Partner—" },
  ])("reads no ability from $label", ({ line }) => {
    expect(readPartnerAbilities(cardWithText(line))).toEqual([]);
  });

  it("rejects a long blank run after the dash in linear time", () => {
    // Blanks, then a carriage return the line split keeps: the old pattern
    // tried every way to share the blanks between `\s*` and `(.+)`.
    const line = `Partner—${" ".repeat(30_000)}x\ry`;

    const started = performance.now();
    const abilities = readPartnerAbilities(cardWithText(line));
    const elapsedMs = performance.now() - started;

    expect(abilities).toEqual([]);
    expect(elapsedMs).toBeLessThan(LINEAR_TIME_BUDGET_MS);
  });
});
