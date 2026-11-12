import { describe, it, expect } from "vitest";
import {
  BRACKET_DEFINITIONS,
  BRACKET_LEVELS,
  parseBracketLevel,
  type BracketDefinition,
  type BracketLevel,
} from "@/lib/constants/brackets";

/**
 * The official Commander Brackets table: Wizards' bracket text of 2025-10-21 and
 * the Commander Format Panel graphic it links, unchanged by the 2026-02-09
 * update and still current on 2026-11-09.
 * https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025
 */
type OfficialRow = Pick<
  BracketDefinition,
  | "name"
  | "maxGameChangers"
  | "massLandDenial"
  | "extraTurns"
  | "twoCardCombos"
  | "thematicExceptions"
  | "minTurns"
>;

const OFFICIAL_TABLE: Readonly<Record<BracketLevel, OfficialRow>> = {
  1: {
    name: "Exhibition",
    maxGameChangers: 0,
    massLandDenial: "none",
    extraTurns: "none",
    twoCardCombos: { kind: "none" },
    thematicExceptions: ["gameChangers", "extraTurns", "twoCardCombos"],
    minTurns: 9,
  },
  2: {
    name: "Core",
    maxGameChangers: 0,
    massLandDenial: "none",
    extraTurns: "noChaining",
    twoCardCombos: { kind: "none" },
    thematicExceptions: [],
    minTurns: 8,
  },
  3: {
    name: "Upgraded",
    maxGameChangers: 3,
    massLandDenial: "none",
    extraTurns: "noChaining",
    twoCardCombos: { kind: "notBeforeTurn", turn: 6 },
    thematicExceptions: [],
    minTurns: 6,
  },
  4: {
    name: "Optimized",
    maxGameChangers: Infinity,
    massLandDenial: "unrestricted",
    extraTurns: "unrestricted",
    twoCardCombos: { kind: "unrestricted" },
    thematicExceptions: [],
    minTurns: 4,
  },
  5: {
    name: "cEDH",
    maxGameChangers: Infinity,
    massLandDenial: "unrestricted",
    extraTurns: "unrestricted",
    twoCardCombos: { kind: "unrestricted" },
    thematicExceptions: [],
    minTurns: null,
  },
};

const OFFICIAL_COLUMNS = [
  "name",
  "maxGameChangers",
  "massLandDenial",
  "extraTurns",
  "twoCardCombos",
  "thematicExceptions",
  "minTurns",
] as const satisfies readonly (keyof OfficialRow)[];

const OFFICIAL_CELLS = BRACKET_LEVELS.flatMap((level) =>
  OFFICIAL_COLUMNS.map((column) => ({
    level,
    column,
    expected: OFFICIAL_TABLE[level][column],
  }))
);

describe("BRACKET_DEFINITIONS", () => {
  it("covers the five official brackets, in order", () => {
    expect(BRACKET_LEVELS).toEqual([1, 2, 3, 4, 5]);
    expect(Object.keys(BRACKET_DEFINITIONS)).toEqual(["1", "2", "3", "4", "5"]);
    for (const level of BRACKET_LEVELS) {
      expect(BRACKET_DEFINITIONS[level].level).toBe(level);
    }
  });

  it.each(OFFICIAL_CELLS)(
    "bracket $level: $column matches the official table",
    ({ level, column, expected }) => {
      expect(BRACKET_DEFINITIONS[level][column]).toEqual(expected);
    }
  );

  // Wizards removed the tutor restriction on 2025-10-21 and relies on the Game
  // Changers list to catch the most efficient tutors.
  it.each(BRACKET_LEVELS)(
    "bracket %i carries no tutor restriction",
    (level) => {
      expect(BRACKET_DEFINITIONS[level]).not.toHaveProperty("allowsTutors");
    }
  );

  it.each(BRACKET_LEVELS)("bracket %i has its own colour token", (level) => {
    const { color, cssVar } = BRACKET_DEFINITIONS[level];
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
    expect(cssVar).toBe(`var(--bracket-${level})`);
  });
});

describe("parseBracketLevel", () => {
  it.each([
    { value: 1, expected: 1 },
    { value: 4, expected: 4 },
    { value: 5, expected: 5 },
    { value: 0, expected: null },
    { value: 6, expected: null },
    { value: 2.5, expected: null },
    { value: null, expected: null },
    { value: undefined, expected: null },
  ])("reads $value as $expected", ({ value, expected }) => {
    expect(parseBracketLevel(value)).toBe(expected);
  });
});
