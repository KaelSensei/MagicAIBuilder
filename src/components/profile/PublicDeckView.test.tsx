import React from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import type { PublicDeck } from "@/lib/deck/public-deck";
import { PublicDeckView } from "./PublicDeckView";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));
vi.mock("@/components/community/DeckRatingPanel", () => ({
  DeckRatingPanel: () => null,
}));
vi.mock("@/components/community/DeckCommentPanel", () => ({
  DeckCommentPanel: () => null,
}));
vi.mock("@/components/community/FocusedFeedbackPanel", () => ({
  FocusedFeedbackPanel: () => null,
}));
vi.mock("@/components/community/DeckReportButton", () => ({
  DeckReportButton: () => null,
}));
vi.mock("@/components/community/SavePublicDeckButton", () => ({
  SavePublicDeckButton: () => null,
}));
vi.mock("./PublicDeckActions", () => ({ PublicDeckActions: () => null }));

const deck: PublicDeck = {
  id: "deck-1",
  name: "Test deck",
  description: null,
  format: "commander",
  targetBracket: 2,
  isAIGenerated: false,
  seekingFeedback: false,
  feedbackQuestion: null,
  forkedFromDeckId: null,
  forkedFromDeckName: null,
  forkedFromUserName: null,
  isOwner: false,
  cards: [
    {
      id: "card-1",
      scryfallId: "scry-sol-ring",
      name: "Sol Ring",
      cmc: 1,
      colorIdentity: [],
      price: null,
      imageUri: "",
      artCropUri: "",
      category: "artifact",
      quantity: 1,
      isCommander: false,
      isPartner: false,
      isGameChanger: false,
    },
  ],
  user: null,
};

describe("PublicDeckView card count", () => {
  it("shows the singular French card count", () => {
    renderWithIntl(<PublicDeckView deck={deck} isSignedIn={false} />, {
      locale: "fr",
    });

    expect(screen.getByText("1 carte")).toBeInTheDocument();
  });

  it("counts card quantities in the French plural", () => {
    const twoCopies: PublicDeck = {
      ...deck,
      cards: deck.cards.map((card) => ({ ...card, quantity: 2 })),
    };
    renderWithIntl(<PublicDeckView deck={twoCopies} isSignedIn={false} />, {
      locale: "fr",
    });

    expect(screen.getByText("2 cartes")).toBeInTheDocument();
  });
});

describe("PublicDeckView images", () => {
  // Decks saved before Scryfall's 2026-10-14 WebP change store its JPEG URLs.
  it("draws cards stored with Scryfall's JPEG from the WebP grid", () => {
    const stored = (id: string) =>
      `https://cards.scryfall.io/normal/front/${id[0]}/${id[1]}/${id}.jpg?1599707796`;
    const withCommander: PublicDeck = {
      ...deck,
      cards: [
        {
          ...deck.cards[0],
          id: "card-cmd",
          name: "Atraxa",
          isCommander: true,
          imageUri: stored("d0d33d52-3d28-4635-b985-51e126289259"),
        },
        {
          ...deck.cards[0],
          imageUri: stored("fc817e07-c1f3-469f-9cf7-0945dea7400f"),
        },
      ],
    };

    const { container } = renderWithIntl(
      <PublicDeckView deck={withCommander} isSignedIn={false} />,
      { locale: "en" }
    );

    expect(screen.getByRole("img", { name: "Atraxa" })).toHaveAttribute(
      "src",
      "https://cards.scryfall.io/grid/front/d/0/d0d33d52-3d28-4635-b985-51e126289259.webp?1599707796"
    );
    expect(container.innerHTML).toContain(
      "https://cards.scryfall.io/grid/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.webp?1599707796"
    );
    expect(container.innerHTML).not.toContain("cards.scryfall.io/normal/");
  });
});

// The bracket pill, the AI badge and the author fallback were English literals.
describe("PublicDeckView header in French", () => {
  it("labels the bracket, the AI badge and an anonymous author", () => {
    renderWithIntl(
      <PublicDeckView
        deck={{ ...deck, isAIGenerated: true }}
        isSignedIn={false}
      />,
      { locale: "fr" }
    );

    expect(screen.getByText("Bracket 2")).toBeInTheDocument();
    expect(screen.getByText("Généré par IA")).toBeInTheDocument();
    expect(screen.getByText("Anonyme")).toBeInTheDocument();
  });
});
