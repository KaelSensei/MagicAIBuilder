import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PlaytestEngine } from "@/lib/playtest/engine";
import type { DeckCard } from "@/lib/deck/types";
import { renderWithIntl } from "@/test/render-with-intl";
import { DrawProgressEvidence } from "./DrawProgressEvidence";

function card(index: number): DeckCard {
  return {
    id: `card-${index}`,
    scryfallId: `card-${index}`,
    name: `Card ${index}`,
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

function engine(overrides: Partial<PlaytestEngine>): PlaytestEngine {
  return {
    turn: 4,
    phase: "Draw",
    // A two-player table: one natural draw per turn after the first (CR 103.8a).
    multiplayer: false,
    mulliganCount: 0,
    firstMulliganFree: true,
    cardsToBottom: 0,
    lifeTotal: 40,
    lifeHistory: [],
    isGameOver: false,
    hand: [],
    library: Array.from({ length: 89 }, (_, index) => card(index)),
    battlefield: [],
    graveyard: [],
    exile: [],
    commandZone: [],
    commanderIds: [],
    diceRolls: [],
    actionLog: [],
    nextActionId: 1,
    history: [],
    ...overrides,
  };
}

function renderEvidence(playtestEngine: PlaytestEngine) {
  return renderWithIntl(<DrawProgressEvidence engine={playtestEngine} />);
}

describe("DrawProgressEvidence", () => {
  it("shows when card access is limited to natural draws", () => {
    renderEvidence(
      engine({ hand: Array.from({ length: 10 }, (_, index) => card(index)) })
    );

    expect(screen.getByText("10 cards seen")).toBeDefined();
    expect(screen.getByText(/natural draws only/i)).toBeDefined();
  });

  it("highlights card draw beyond natural turn progression", () => {
    renderEvidence(
      engine({
        hand: Array.from({ length: 13 }, (_, index) => card(index)),
        library: Array.from({ length: 86 }, (_, index) => card(index + 13)),
      })
    );

    expect(screen.getByText("13 cards seen")).toBeDefined();
    expect(screen.getByText(/3 extra cards seen/i)).toBeDefined();
  });

  // A free first mulligan (CR 103.5c) keeps seven, so it is not an extra card.
  it("treats a free Commander mulligan as a kept seven", () => {
    renderEvidence(
      engine({
        multiplayer: true,
        mulliganCount: 1,
        firstMulliganFree: true,
        hand: Array.from({ length: 10 }, (_, index) => card(index)),
      })
    );

    expect(screen.getByText(/natural draws only/i)).toBeDefined();
  });

  // The commander starts in the command zone (CR 903.6); casting it draws nothing.
  it("does not count a commander cast from the command zone as a card seen", () => {
    const commander = { ...card(99), id: "cmd", name: "Kenrith" };
    renderEvidence(
      engine({
        turn: 2,
        hand: Array.from({ length: 8 }, (_, index) => card(index)),
        library: Array.from({ length: 91 }, (_, index) => card(index + 8)),
        battlefield: [{ ...commander, tapped: false, counters: 0 }],
        commanderIds: ["cmd"],
      })
    );

    expect(screen.getByText("8 cards seen")).toBeDefined();
    expect(screen.getByText(/natural draws only/i)).toBeDefined();
  });
});
