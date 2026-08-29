import { describe, expect, it } from "vitest";

import { parseComprehensiveRules, searchComprehensiveRules } from "./comprehensive";

const RULES = parseComprehensiveRules(`Magic: The Gathering Comprehensive Rules
These rules are effective as of January 1, 2026.

1. Game Concepts
100. General
100.1. Players begin the game.

2. Parts of a Card
200. General
200.1. A card has a name.

Glossary
Flying
A keyword ability.
`);

describe("searchComprehensiveRules", () => {
  it("finds matching rule paragraphs and glossary entries offline", () => {
    expect(searchComprehensiveRules(RULES, "players")).toEqual([
      { kind: "rule", chapter: "100", reference: "100.1", text: "100.1. Players begin the game." },
    ]);
    expect(searchComprehensiveRules(RULES, "keyword")).toEqual([
      { kind: "glossary", chapter: null, reference: "Flying", text: "A keyword ability." },
    ]);
  });

  it("returns no results for blank queries and caps results", () => {
    expect(searchComprehensiveRules(RULES, "   ")).toEqual([]);
    expect(searchComprehensiveRules(RULES, "a", 1)).toHaveLength(1);
  });
});
