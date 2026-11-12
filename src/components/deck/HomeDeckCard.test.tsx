import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { renderWithIntl } from "@/test/render-with-intl";

vi.mock(import("@/i18n/navigation"), () => import("@/test/i18n-navigation-stub"));

import { getDeckPresentationManaColors, HomeDeckCard } from "./HomeDeckCard";

/** A legendary creature for the command zone, with the colour identity under test. */
function makeCard(
  id: string,
  name: string,
  colorIdentity: readonly string[]
): DeckCard {
  return aDeckCard({
    id,
    name,
    typeLine: "Legendary Creature",
    colorIdentity: [...colorIdentity],
    category: "commander",
  });
}

/** A deck led by these commanders, with fixed dates so the card's text never depends on the clock. */
function makeDeck(options?: {
  readonly commander?: DeckCard | null;
  readonly partner?: DeckCard | null;
}): Deck {
  return aDeck({
    commander: options?.commander ?? null,
    partner: options?.partner ?? null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-02T00:00:00Z"),
  });
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

    renderWithIntl(
      <HomeDeckCard
        deck={deck}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        deletingId={null}
        duplicatingId={null}
      />
    );

    expect(screen.getByTestId("deck-identity")).toHaveTextContent("Test Deck");
    expect(screen.getByTestId("deck-status")).toHaveTextContent("0 cards");
  });

  it("uses French accessible labels for its mana symbols", () => {
    const deck = makeDeck({ commander: makeCard("cmd", "Atraxa", ["G"]) });

    renderWithIntl(
      <HomeDeckCard
        deck={deck}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        deletingId={null}
        duplicatingId={null}
      />,
      { locale: "fr" }
    );

    expect(screen.getByRole("img", { name: "Symbole de mana Vert" })).toBeDefined();
  });

  // The badge was the English literal "AI" under every locale.
  it("marks an AI-generated deck in French", () => {
    const deck: Deck = { ...makeDeck(), isAIGenerated: true };

    renderWithIntl(
      <HomeDeckCard
        deck={deck}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        deletingId={null}
        duplicatingId={null}
      />,
      { locale: "fr" }
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

    renderWithIntl(
      <HomeDeckCard
        deck={makeDeck({ commander })}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        deletingId={null}
        duplicatingId={null}
      />
    );

    expect(screen.getByTestId("deck-card").style.backgroundImage).toContain(
      "https://cards.scryfall.io/art/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.webp?1599707796"
    );
  });
});
