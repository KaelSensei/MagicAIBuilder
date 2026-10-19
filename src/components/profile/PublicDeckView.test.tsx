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
  isOwner: false,
  cards: [
    {
      id: "card-1",
      name: "Sol Ring",
      manaCost: "{1}",
      cmc: 1,
      typeLine: "Artifact",
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
  createdAt: "2026-10-15T00:00:00Z",
  updatedAt: "2026-10-15T00:00:00Z",
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
