import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { apiDeckToStoreDeck } from "@/lib/deck/store-factories";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { emptyApiDeck } from "@/test/in-memory-deck-api";
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
    // CR 903.5a: the commander counts toward the deck, as the editor counts it.
    expect(screen.getByTestId("deck-status")).toHaveTextContent("1 / 100 cards");
  });

  it("shows a listed deck whose 30 Forests are one row as 100 cards", () => {
    const listed = apiDeckToStoreDeck({
      ...emptyApiDeck("deck-1", "Talrand Spells"),
      cards: [
        {
          ...makeCard("row-talrand", "Talrand, Sky Summoner", ["U"]),
          deckId: "deck-1",
          scryfallId: "sf-talrand",
          isCommander: true,
          isPartner: false,
          zone: "main",
        },
      ],
      // The commander, one row of 30 Forests and 69 single cards.
      _count: { cards: 71 },
      cardCopyCount: 100,
    });

    renderWithIntl(
      <HomeDeckCard
        deck={listed}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        deletingId={null}
        duplicatingId={null}
      />
    );

    expect(screen.getByTestId("deck-status")).toHaveTextContent("100 / 100 cards");
  });

  // CR 100.2a: a constructed deck holds at least 60 cards and has no maximum.
  it("a Modern deck of 63 cards reads 63 / 60+ on its grid card", () => {
    const deck = aDeck({
      format: "modern",
      cards: [
        aDeckCard({ id: "forest", name: "Forest", quantity: 23 }),
        aDeckCard({ id: "bolt", name: "Lightning Bolt", quantity: 40 }),
      ],
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

    expect(screen.getByTestId("deck-status")).toHaveTextContent(
      "63 / 60+ cards"
    );
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

/**
 * The deck card on `/decks` with no action in flight, and the two action
 * callbacks it was given.
 */
function renderDeckCard(deck: Deck = makeDeck()) {
  const onDelete = vi.fn();
  const onDuplicate = vi.fn();
  renderWithIntl(
    <HomeDeckCard
      deck={deck}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      deletingId={null}
      duplicatingId={null}
    />
  );
  return { onDelete, onDuplicate };
}

// WCAG 4.1.2: a button nested in a link has no reliable role, and the link's
// name ran the deck name together with "Duplicate" and "Delete".
describe("HomeDeckCard actions beside its link", () => {
  it("the deck card's link contains no button, and its accessible name is the deck name", () => {
    renderDeckCard();

    const link = screen.getByRole("link");
    expect(link).toHaveAccessibleName("Test Deck");
    expect(within(link).queryAllByRole("button")).toHaveLength(0);
  });

  // WCAG 2.5.8: a target is at least 24 by 24 CSS px. jsdom computes no
  // layout and loads no Tailwind, so this reads the size class: size-7 is
  // 28 px, around a 14 px icon.
  it("the Delete button is at least 24 px", () => {
    renderDeckCard();

    expect(
      screen.getByRole("button", { name: "Delete Test Deck" })
    ).toHaveClass("size-7");
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
