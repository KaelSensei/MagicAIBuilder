import { describe, expect, it } from "vitest";
import { analyzeDrawProgress } from "./draw-progress-evidence";

describe("analyzeDrawProgress", () => {
  it("reports natural draw progression when no extra cards were seen", () => {
    expect(
      analyzeDrawProgress({
        turn: 4,
        mulliganCount: 0,
        firstMulliganFree: true,
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
        firstMulliganFree: false,
        cardsOutsideLibrary: 12,
        libraryCount: 87,
      })
    ).toEqual({
      cardsSeen: 12,
      additionalCardsSeen: 3,
      status: "drawing-extra",
    });
  });

  // A free first mulligan (CR 103.5c) keeps seven: ten cards seen on turn 4
  // are the seven plus three natural draws, none extra.
  it("counts a free first mulligan as a kept seven", () => {
    expect(
      analyzeDrawProgress({
        turn: 4,
        mulliganCount: 1,
        firstMulliganFree: true,
        cardsOutsideLibrary: 10,
        libraryCount: 89,
      })
    ).toEqual({ cardsSeen: 10, additionalCardsSeen: 0, status: "natural" });
  });

  it("prioritizes an empty-library warning", () => {
    expect(
      analyzeDrawProgress({
        turn: 10,
        mulliganCount: 0,
        firstMulliganFree: true,
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
