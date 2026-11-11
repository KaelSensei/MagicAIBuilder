import React from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckListTable } from "./DeckListTable";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

function makeCommander(colorIdentity: readonly string[]): DeckCard {
  return {
    id: "cmd",
    name: "Atraxa",
    manaCost: "",
    cmc: 4,
    typeLine: "Legendary Creature",
    oracleText: "",
    colorIdentity: [...colorIdentity],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "commander",
    quantity: 1,
    zone: "main",
  };
}

function makeDeck(colorIdentity: readonly string[]): Deck {
  return {
    id: "deck-1",
    name: "Test Deck",
    commander: makeCommander(colorIdentity),
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format: "commander",
    cardCount: 1,
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
  };
}

// The table built "{color} mana symbol" from its own English color table,
// while the grid view of the same decks already used the catalog.
describe("DeckListTable mana symbols", () => {
  it("names each symbol in French", () => {
    renderWithIntl(
      <DeckListTable
        decks={[makeDeck(["G", "U"])]}
        deletingId={null}
        duplicatingId={null}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
      />,
      { locale: "fr" }
    );

    expect(
      screen.getByRole("img", { name: "Symbole de mana Vert" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Symbole de mana Bleu" })
    ).toBeInTheDocument();
  });

  it("names a colorless identity in English", () => {
    renderWithIntl(
      <DeckListTable
        decks={[makeDeck([])]}
        deletingId={null}
        duplicatingId={null}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
      />,
      { locale: "en" }
    );

    expect(
      screen.getByRole("img", { name: "Colorless mana symbol" })
    ).toBeInTheDocument();
  });
});
