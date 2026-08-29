import { describe, expect, it } from "vitest";
import { analyzeDrawProgress } from "./draw-progress-evidence";

describe("analyzeDrawProgress", () => {
  it("reports natural draw progression when no extra cards were seen", () => {
    expect(
      analyzeDrawProgress({
        turn: 4,
        mulliganCount: 0,
        cardsOutsideLibrary: 10,
        libraryCount: 89,
      })
    ).toEqual({ cardsSeen: 10, additionalCardsSeen: 0, status: "natural" });
  });

  it("counts cards seen beyond the natural turn progression", () => {
    expect(
      analyzeDrawProgress({
        turn: 4,
        mulliganCount: 1,
        cardsOutsideLibrary: 12,
        libraryCount: 87,
      })
    ).toEqual({
      cardsSeen: 12,
      additionalCardsSeen: 3,
      status: "drawing-extra",
    });
  });

  it("prioritizes an empty-library warning", () => {
    expect(
      analyzeDrawProgress({
        turn: 10,
        mulliganCount: 0,
        cardsOutsideLibrary: 99,
        libraryCount: 0,
      })
    ).toEqual({
      cardsSeen: 99,
      additionalCardsSeen: 83,
      status: "library-empty",
    });
  });
});
