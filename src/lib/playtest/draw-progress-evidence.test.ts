import { describe, expect, it } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import {
  analyzeDrawProgress,
  analyzeEngineDrawProgress,
} from "./draw-progress-evidence";
import { applyBottomCards, applyMulligan, createPlaytestState } from "./engine";

function makeCard(id: string): DeckCard {
  return {
    id,
    scryfallId: id,
    name: `Card ${id}`,
    quantity: 1,
    category: "creature",
    zone: "main",
    manaCost: "",
    cmc: 1,
    typeLine: "Creature",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
  };
}

describe("analyzeEngineDrawProgress", () => {
  // The hand holds seven until the choice is made; the cards still to bottom
  // are going back to the library, not extra cards seen.
  it("counts no extra cards while a mulligan's bottom choice is pending", () => {
    const cards = Array.from({ length: 40 }, (_, index) =>
      makeCard(`c${index}`)
    );
    const duel = createPlaytestState(cards, { firstMulliganFree: false });
    const choosing = applyMulligan(duel);
    const settled = applyBottomCards(choosing, [choosing.hand[0].id]);

    expect(choosing.cardsToBottom).toBe(1);
    expect(analyzeEngineDrawProgress(choosing)).toEqual({
      cardsSeen: 6,
      additionalCardsSeen: 0,
      status: "natural",
    });
    expect(analyzeEngineDrawProgress(choosing)).toEqual(
      analyzeEngineDrawProgress(settled)
    );
  });
});

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
