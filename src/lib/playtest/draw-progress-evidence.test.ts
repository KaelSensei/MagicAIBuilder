import { describe, expect, it } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import {
  analyzeDrawProgress,
  analyzeEngineDrawProgress,
} from "./draw-progress-evidence";
import { applyBottomCards, applyMulligan, createPlaytestState } from "./engine";

function makeCard(id: string): DeckCard {
  return aDeckCard({
    id,
    scryfallId: id,
    name: `Card ${id}`,
    cmc: 1,
    typeLine: "Creature",
    category: "creature",
  });
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
        multiplayer: false,
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
        multiplayer: false,
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
        multiplayer: false,
        mulliganCount: 1,
        firstMulliganFree: true,
        cardsOutsideLibrary: 10,
        libraryCount: 89,
      })
    ).toEqual({ cardsSeen: 10, additionalCardsSeen: 0, status: "natural" });
  });

  // CR 103.8a: the starting player of a two-player game skips the turn-1 draw,
  // so turn 4 allows three natural draws. CR 103.8c: in a multiplayer game
  // nobody skips it, so turn 4 allows four.
  it.each([
    {
      table: "two-player",
      multiplayer: false,
      extra: 1,
      status: "drawing-extra",
    },
    { table: "multiplayer", multiplayer: true, extra: 0, status: "natural" },
  ] as const)(
    "counts the turn-1 draw of a $table game as $status",
    ({ multiplayer, extra, status }) => {
      expect(
        analyzeDrawProgress({
          turn: 4,
          multiplayer,
          mulliganCount: 0,
          firstMulliganFree: true,
          cardsOutsideLibrary: 11,
          libraryCount: 88,
        })
      ).toEqual({ cardsSeen: 11, additionalCardsSeen: extra, status });
    }
  );

  it("prioritizes an empty-library warning", () => {
    expect(
      analyzeDrawProgress({
        turn: 10,
        multiplayer: false,
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
