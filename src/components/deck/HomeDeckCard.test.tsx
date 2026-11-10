import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Deck, DeckCard } from "@/lib/deck/types";
import enDeck from "@/messages/en/deck.json";
import enBuilder from "@/messages/en/builder.json";
import frDeck from "@/messages/fr/deck.json";
import frBuilder from "@/messages/fr/builder.json";

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
      <NextIntlClientProvider locale="en" messages={{ deck: enDeck, builder: enBuilder }} timeZone="UTC">
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

  it("uses French accessible labels for its mana symbols", () => {
    const deck = makeDeck({ commander: makeCard("cmd", "Atraxa", ["G"]) });

    render(
      <NextIntlClientProvider locale="fr" messages={{ deck: frDeck, builder: frBuilder }} timeZone="UTC">
        <HomeDeckCard deck={deck} onDelete={vi.fn()} onDuplicate={vi.fn()} deletingId={null} duplicatingId={null} />
      </NextIntlClientProvider>
    );

    expect(screen.getByRole("img", { name: "Symbole de mana Vert" })).toBeDefined();
  });

  // The badge was the English literal "AI" under every locale.
  it("marks an AI-generated deck in French", () => {
    const deck: Deck = { ...makeDeck(), isAIGenerated: true };

    render(
      <NextIntlClientProvider
        locale="fr"
        messages={{ deck: frDeck, builder: frBuilder }}
        timeZone="UTC"
      >
        <HomeDeckCard
          deck={deck}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
          deletingId={null}
          duplicatingId={null}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("IA")).toBeInTheDocument();
    expect(screen.queryByText("AI")).not.toBeInTheDocument();
  });
});

describe("HomeDeckCard commander art", () => {
  // Scryfall retires the art_crop JPEG on 2027-01-01; decks saved before then
  // still store it.
  it("paints a stored JPEG art crop from Scryfall's WebP art", () => {
    const commander: DeckCard = {
      ...makeCard("cmd", "Atraxa", ["G"]),
      artCropUri:
        "https://cards.scryfall.io/art_crop/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.jpg?1599707796",
    };

    render(
      <NextIntlClientProvider
        locale="en"
        messages={{ deck: enDeck, builder: enBuilder }}
        timeZone="UTC"
      >
        <HomeDeckCard
          deck={makeDeck({ commander })}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
          deletingId={null}
          duplicatingId={null}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByTestId("deck-card").style.backgroundImage).toContain(
      "https://cards.scryfall.io/art/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.webp?1599707796"
    );
  });
});
