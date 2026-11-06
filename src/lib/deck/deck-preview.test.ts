import { describe, expect, it } from "vitest";
import { filterCardsByCategory, previewCardImages } from "./deck-preview";

const CARDS = [
  { id: "1", name: "Sol Ring", category: "artifact", imageUri: "https://example.com/sol.jpg" },
  { id: "2", name: "Island", category: "land", imageUri: "" },
  { id: "3", name: "Counterspell", category: "instant", imageUri: "https://example.com/counter.jpg" },
] as const;

describe("filterCardsByCategory", () => {
  it("returns every card when the chip is all", () => {
    expect(filterCardsByCategory(CARDS, "all")).toEqual(CARDS);
  });

  it("keeps only the selected category", () => {
    expect(filterCardsByCategory(CARDS, "instant").map((card) => card.name)).toEqual([
      "Counterspell",
    ]);
  });
});

describe("previewCardImages", () => {
  it("skips cards without an image and stops at the limit", () => {
    expect(previewCardImages(CARDS, 1).map((card) => card.id)).toEqual(["1"]);
  });
});
