import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import type { PlaytestEngine } from "@/lib/playtest/engine";
import type { DeckCard } from "@/lib/deck/types";
import messages from "@/messages/en/playtest-evidence.json";
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
    mulliganCount: 0,
    lifeTotal: 40,
    lifeHistory: [],
    isGameOver: false,
    hand: [],
    library: Array.from({ length: 89 }, (_, index) => card(index)),
    battlefield: [],
    graveyard: [],
    exile: [],
    history: [],
    ...overrides,
  };
}

function renderEvidence(playtestEngine: PlaytestEngine) {
  return render(
    <NextIntlClientProvider
      locale="en"
      messages={{ playtestEvidence: messages }}
    >
      <DrawProgressEvidence engine={playtestEngine} />
    </NextIntlClientProvider>
  );
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
});
