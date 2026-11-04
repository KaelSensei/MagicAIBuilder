import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Deck, DeckCard } from "@/lib/deck/types";
import enDeck from "@/messages/en/deck.json";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => React.createElement("a", { href, ...props }, children),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
}));

import { getDeckPresentationManaColors, HomeDeckCard } from "./HomeDeckCard";

function makeCard(
  id: string,
  name: string,
  colorIdentity: readonly string[]
): DeckCard {
  return {
    id,
    name,
    manaCost: "",
    cmc: 0,
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

function makeDeck(options?: {
  readonly commander?: DeckCard | null;
  readonly partner?: DeckCard | null;
}): Deck {
  return {
    id: "deck-1",
    name: "Test Deck",
    commander: options?.commander ?? null,
    partner: options?.partner ?? null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format: "commander",
    cardCount: 0,
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

describe("getDeckPresentationManaColors", () => {
  it("returns empty when the deck has no commander", () => {
    expect(getDeckPresentationManaColors(makeDeck())).toEqual([]);
  });

  it("keeps commander identity order", () => {
    const deck = makeDeck({
      commander: makeCard("cmd", "Atraxa", ["W", "U", "B", "G"]),
    });

    expect(getDeckPresentationManaColors(deck)).toEqual(["W", "U", "B", "G"]);
  });

  it("merges commander and partner identity without duplicates", () => {
    const deck = makeDeck({
      commander: makeCard("cmd", "Thrasios", ["U", "G"]),
      partner: makeCard("partner", "Rograkh", ["R"]),
    });

    expect(getDeckPresentationManaColors(deck)).toEqual(["U", "G", "R"]);
  });

  it("falls back to colorless for a colorless commander", () => {
    const deck = makeDeck({
      commander: makeCard("cmd", "Kozilek", []),
    });

    expect(getDeckPresentationManaColors(deck)).toEqual(["C"]);
  });
});

describe("HomeDeckCard", () => {
  it("separates deck identity from its at-a-glance status", () => {
    const deck = makeDeck({
      commander: makeCard("cmd", "Atraxa", ["W", "U", "B", "G"]),
    });

    render(
      <NextIntlClientProvider locale="en" messages={{ deck: enDeck }}>
        <HomeDeckCard
          deck={deck}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
          deletingId={null}
          duplicatingId={null}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByTestId("deck-identity")).toHaveTextContent("Test Deck");
    expect(screen.getByTestId("deck-status")).toHaveTextContent("0 cards");
  });
});
