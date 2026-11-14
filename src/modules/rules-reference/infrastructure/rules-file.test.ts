import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BUNDLED_RULES_EFFECTIVE_ON } from "@/modules/rules-reference";
import { RULES_FILE, loadComprehensiveRules } from "./rules-file";

describe("RULES_FILE", () => {
  it("names the rules edition bundled next to this module", () => {
    expect(RULES_FILE).toMatch(
      /src[/\\]modules[/\\]rules-reference[/\\]infrastructure[/\\]data[/\\]MagicCompRules-20260807\.txt$/
    );
    expect(existsSync(RULES_FILE)).toBe(true);
  });
});

describe("loadComprehensiveRules (real file)", () => {
  const rules = loadComprehensiveRules();

  it("reads the effective date of the bundled file", () => {
    expect(rules.effectiveDate).toEqual(new Date(Date.UTC(2026, 7, 7)));
    expect(rules.effectiveDate?.toISOString().slice(0, 10)).toBe(BUNDLED_RULES_EFFECTIVE_ON);
  });

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
