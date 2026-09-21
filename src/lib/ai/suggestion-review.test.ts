import { describe, expect, it } from "vitest";
import type { CardSuggestion, CardRemoval } from "@/hooks/useAISuggestions";
import {
  buildSuggestionDiff,
  filterSuggestionsByPriority,
  toggleSuggestionSelection,
  type SuggestionPriorityFilter,
} from "./suggestion-review";

const suggestion = (
  name: string,
  priority: CardSuggestion["priority"]
): CardSuggestion => ({
  name,
  priority,
  reason: `${name} reason`,
  category: "ramp",
});

const removal = (name: string): CardRemoval => ({
  name,
  reason: `${name} reason`,
});

describe("filterSuggestionsByPriority", () => {
  it("keeps only suggestions matching the selected priority", () => {
    const suggestions = [
      suggestion("A", "high"),
      suggestion("B", "low"),
      suggestion("C", "high"),
    ];
    const filter: SuggestionPriorityFilter = "high";

    expect(
      filterSuggestionsByPriority(suggestions, filter).map((item) => item.name)
    ).toEqual(["A", "C"]);
  });

  it("returns all suggestions for the all filter", () => {
    const suggestions = [suggestion("A", "high"), suggestion("B", "low")];

    expect(filterSuggestionsByPriority(suggestions, "all")).toEqual(
      suggestions
    );
  });
});

describe("buildSuggestionDiff", () => {
  it("reports only net changes against the current deck", () => {
    const diff = buildSuggestionDiff(
      ["Sol Ring", "Island"],
      ["Sol Ring", "Rhystic Study"],
      [removal("Island"), removal("Missing Card")]
    );

    expect(diff).toEqual({
      additions: ["Rhystic Study"],
      removals: ["Island"],
    });
  });

  it("deduplicates repeated selections", () => {
    expect(
      buildSuggestionDiff(
        ["Island"],
        ["Rhystic Study", "Rhystic Study"],
        [removal("Island"), removal("Island")]
      )
    ).toEqual({ additions: ["Rhystic Study"], removals: ["Island"] });
  });
});

describe("toggleSuggestionSelection", () => {
  it("selects an absent card without mutating the original set", () => {
    const current = new Set(["Sol Ring"]);
    const next = toggleSuggestionSelection(current, "Arcane Signet");

    expect([...next]).toEqual(["Sol Ring", "Arcane Signet"]);
    expect([...current]).toEqual(["Sol Ring"]);
  });

  it("deselects an already selected card", () => {
    expect([
      ...toggleSuggestionSelection(new Set(["Sol Ring"]), "Sol Ring"),
    ]).toEqual([]);
  });
});
