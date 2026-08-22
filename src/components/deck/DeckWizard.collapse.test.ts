import { describe, it, expect } from "vitest";
import { collapseEntries } from "./DeckWizard";
import type { BuildCard } from "@/hooks/useAIDeckBuild";

const card = (name: string, quantity: number, category = "other"): BuildCard => ({
  name,
  category,
  quantity,
});

describe("collapseEntries", () => {
  it("keeps the quantity of a multi-copy entry", () => {
    const entries = collapseEntries([card("Island", 12, "land")]);
    expect(entries).toEqual([{ name: "Island", category: "land", quantity: 12 }]);
  });

  it("sums repeated entries for the same card", () => {
    const entries = collapseEntries([
      card("Swamp", 5, "land"),
      card("Swamp", 3, "land"),
    ]);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.quantity).toBe(8);
  });

  it("preserves the total card count of a full decklist", () => {
    const cards: BuildCard[] = [
      card("Sol Ring", 1, "ramp"),
      card("Command Tower", 1, "land"),
      card("Island", 12, "land"),
      card("Swamp", 12, "land"),
      card("Forest", 11, "land"),
      card("Plains", 62, "land"),
    ];
    const total = collapseEntries(cards).reduce((s, e) => s + e.quantity, 0);
    expect(total).toBe(99);
  });

  it("returns one entry per distinct name", () => {
    const entries = collapseEntries([
      card("Sol Ring", 1),
      card("Arcane Signet", 1),
      card("Sol Ring", 1),
    ]);
    expect(entries.map((e) => e.name)).toEqual(["Sol Ring", "Arcane Signet"]);
  });

  it("handles an empty list", () => {
    expect(collapseEntries([])).toEqual([]);
  });
});
