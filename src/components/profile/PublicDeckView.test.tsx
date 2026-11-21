import React from "react";
import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import type { PublicDeck } from "@/lib/deck/public-deck";
import { PublicDeckView } from "./PublicDeckView";

vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);
vi.mock(import("@/components/community/DeckRatingPanel"), () => ({
  DeckRatingPanel: () => <></>,
}));
vi.mock(import("@/components/community/DeckCommentPanel"), () => ({
  DeckCommentPanel: () => <></>,
}));
vi.mock(import("@/components/community/FocusedFeedbackPanel"), () => ({
  FocusedFeedbackPanel: () => null,
}));
vi.mock(import("@/components/community/DeckReportButton"), () => ({
  DeckReportButton: () => null,
}));
vi.mock(import("@/components/community/SavePublicDeckButton"), () => ({
  SavePublicDeckButton: () => null,
}));
vi.mock(import("./PublicDeckActions"), () => ({
  PublicDeckActions: () => <></>,
}));

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
  createdAt: "2026-03-03T09:00:00.000Z",
  updatedAt: "2026-11-19T12:00:00.000Z",
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

// I-92: a visitor sees how current a public list is, from the stored dates only.
describe("PublicDeckView dates", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-21T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a public deck updated on 2026-11-19 as 'Updated 2 days ago' in a time element dated 2026-11-19", () => {
    renderWithIntl(
      <PublicDeckView
        deck={{ ...deck, updatedAt: "2026-11-19T12:00:00.000Z" }}
        isSignedIn={false}
      />
    );

    const updated = screen.getByText("2 days ago");
    expect(updated.tagName).toBe("TIME");
    expect(updated).toHaveAttribute("datetime", "2026-11-19T12:00:00.000Z");
    expect(updated.parentElement).toHaveTextContent("Updated 2 days ago");
  });
});
