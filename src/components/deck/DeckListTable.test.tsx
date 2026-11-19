import React from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { renderWithProviders, type TestLocale } from "@/test/render";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckListTable } from "./DeckListTable";

vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

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

describe("DeckListTable card count", () => {
  // CR 100.2a: a constructed deck holds at least 60 cards, not Commander's 100.
  it("counts a Standard deck of 60 cards out of 60", () => {
    renderWithProviders(
      <DeckListTable
        decks={[
          {
            ...makeDeck([]),
            format: "standard",
            commander: null,
            cardCount: 60,
          },
        ]}
        deletingId={null}
        duplicatingId={null}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    expect(
      screen.getByRole("cell", { name: "60 / 60+ (complete)" })
    ).toBeInTheDocument();
  });

  it("counts a Commander deck out of 100", () => {
    renderWithProviders(
      <DeckListTable
        decks={[{ ...makeDeck(["U"]), cardCount: 100 }]}
        deletingId={null}
        duplicatingId={null}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    expect(
      screen.getByRole("cell", { name: "100 / 100 (complete)" })
    ).toBeInTheDocument();
  });
});

// A finished deck looked the same as an unfinished one in the list: the count
// now says, in words, whether the deck meets its size rule (CR 903.5a, 100.2a).
describe("DeckListTable deck size state", () => {
  function renderDeckList(deck: Deck, locale: TestLocale = "en"): void {
    renderWithProviders(
      <DeckListTable
        decks={[deck]}
        deletingId={null}
        duplicatingId={null}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
      />,
      { locale }
    );
  }

  /** A Commander deck led by `commanderName` that holds `cardCount` cards. */
  function commanderDeck(
    cardCount: number,
    commanderName = "Talrand, Sky Summoner"
  ): Deck {
    return aDeck({ commander: aDeckCard({ name: commanderName }), cardCount });
  }

  it("announces a 100-card Commander deck in the deck list as complete", () => {
    renderDeckList(commanderDeck(100));

    expect(
      screen.getByRole("cell", { name: "100 / 100 (complete)" })
    ).toBeInTheDocument();
    expect(screen.getByText("100 / 100")).toHaveClass("text-green-500");
  });

  it("announces a 97-card Commander deck as 3 cards short, without the complete colour", () => {
    renderDeckList(commanderDeck(97));

    expect(
      screen.getByRole("cell", { name: "97 / 100 (3 cards short)" })
    ).toBeInTheDocument();
    expect(screen.getByText("97 / 100")).not.toHaveClass("text-green-500");
  });

  it("announces a 99-card Commander deck as 1 card short", () => {
    renderDeckList(commanderDeck(99));

    expect(
      screen.getByRole("cell", { name: "99 / 100 (1 card short)" })
    ).toBeInTheDocument();
  });

  it("announces a 102-card Commander deck as 2 cards over, without the complete colour", () => {
    renderDeckList(commanderDeck(102));

    expect(
      screen.getByRole("cell", { name: "102 / 100 (2 cards over)" })
    ).toBeInTheDocument();
    expect(screen.getByText("102 / 100")).not.toHaveClass("text-green-500");
  });

  // CR 903.5e: Whtz, the Bibliophile lifts the deck's maximum, so a deck of
  // more than 100 cards under it is complete, never over.
  it("announces a 120-card Whtz deck as complete", () => {
    renderDeckList(commanderDeck(120, "Whtz, the Bibliophile"));

    expect(
      screen.getByRole("cell", { name: "120 (complete)" })
    ).toBeInTheDocument();
  });

  it("announces how many cards a deck lacks in French", () => {
    renderDeckList(commanderDeck(98), "fr");

    expect(
      screen.getByRole("cell", { name: "98 / 100 (2 cartes manquantes)" })
    ).toBeInTheDocument();
  });
});
