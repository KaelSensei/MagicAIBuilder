import { describe, expect, it } from "vitest";
import { loadComprehensiveRules, parseComprehensiveRules } from "./comprehensive";

const NBSP = "\u00A0";

const FIXTURE = [
  "Magic: The Gathering Comprehensive Rules",
  NBSP,
  "These rules are effective as of August 7, 2026.",
  NBSP,
  "Contents",
  NBSP,
  "1. Game Concepts",
  "100. General",
  "101. The Magic Golden Rules",
  NBSP,
  "9. Casual Variants",
  "900. General",
  NBSP,
  "Glossary",
  NBSP,
  "Credits",
  "",
  "1. Game Concepts",
  NBSP,
  "100. General",
  NBSP,
  "100.1. These Magic rules apply to any Magic game.",
  NBSP,
  "100.1a A two-player game is a game that begins with only two players.",
  NBSP,
  "Example: A sample example line.",
  NBSP,
  "101. The Magic Golden Rules",
  NBSP,
  "101.1. Whenever a card contradicts these rules, the card takes precedence.",
  NBSP,
  "9. Casual Variants",
  NBSP,
  "900. General",
  NBSP,
  "900.1. This section contains rules for casual variants.",
  NBSP,
  "Glossary",
  NBSP,
  "Abandon",
  "To turn a face-up ongoing scheme card face down.",
  NBSP,
  "Ability",
  "1. Text on an object. 2. An activated or triggered ability on the stack.",
  "This kind of ability is an object.",
  NBSP,
  "Credits",
  NBSP,
  "Original game design: Richard Garfield",
].join("\n");

describe("parseComprehensiveRules", () => {
  const parsed = parseComprehensiveRules(FIXTURE);

  it("extracts the effective date", () => {
    expect(parsed.effectiveDate).toBe("August 7, 2026");
  });

  it("parses sections with their chapters", () => {
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.sections[0]).toMatchObject({
      number: "1",
      title: "Game Concepts",
    });
    expect(parsed.sections[0].chapters.map((c) => c.number)).toEqual([
      "100",
      "101",
    ]);
    expect(parsed.sections[1].chapters[0].title).toBe("General");
  });

  it("parses rule paragraphs with their reference numbers", () => {
    const chapter100 = parsed.sections[0].chapters[0];
    expect(chapter100.paragraphs).toHaveLength(3);
    expect(chapter100.paragraphs[0]).toEqual({
      ref: "100.1",
      text: "100.1. These Magic rules apply to any Magic game.",
    });
    expect(chapter100.paragraphs[1].ref).toBe("100.1a");
  });

  it("marks non-rule lines (examples) with a null ref", () => {
    const chapter100 = parsed.sections[0].chapters[0];
    expect(chapter100.paragraphs[2]).toEqual({
      ref: null,
      text: "Example: A sample example line.",
    });
  });

  it("does not leak contents-page entries into the body", () => {
    const chapter101 = parsed.sections[0].chapters[1];
    expect(chapter101.paragraphs).toHaveLength(1);
  });

  it("parses glossary entries with multi-line definitions", () => {
    expect(parsed.glossary).toHaveLength(2);
    expect(parsed.glossary[0]).toEqual({
      term: "Abandon",
      definition: "To turn a face-up ongoing scheme card face down.",
    });
    expect(parsed.glossary[1].definition).toContain(
      "This kind of ability is an object."
    );
  });

  it("stops the glossary at the credits", () => {
    const terms = parsed.glossary.map((g) => g.term);
    expect(terms).not.toContain("Credits");
    expect(terms).not.toContain("Original game design: Richard Garfield");
  });
});

describe("loadComprehensiveRules (real file)", () => {
  const rules = loadComprehensiveRules();

  it("parses all 9 sections", () => {
    expect(rules.sections).toHaveLength(9);
    expect(rules.sections[8].title).toBe("Casual Variants");
  });

  it("finds chapter 903 (Commander)", () => {
    const chapters = rules.sections.flatMap((s) => s.chapters);
    const commander = chapters.find((c) => c.number === "903");
    expect(commander?.title).toBe("Commander");
    expect(commander?.paragraphs.length).toBeGreaterThan(10);
  });

  it("parses a large glossary", () => {
    expect(rules.glossary.length).toBeGreaterThan(500);
  });

  it("returns the same cached instance on repeated calls", () => {
    expect(loadComprehensiveRules()).toBe(rules);
  });
});
