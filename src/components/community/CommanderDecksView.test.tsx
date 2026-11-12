import React from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CommanderDeckSummary } from "@/lib/community/discovery-types";
import { CARD_BACK_URL } from "@/lib/scryfall/images";
import { renderWithIntl } from "@/test/render-with-intl";
import { CommanderDecksView } from "./CommanderDecksView";

vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);
vi.mock(import("./PublicDeckComparison"), () => ({
  PublicDeckComparison: () => null,
}));

function makeDeck(
  overrides: Partial<CommanderDeckSummary> = {}
): CommanderDeckSummary {
  return {
    id: "deck-1",
    name: "Atraxa counters",
    format: "commander",
    updatedAt: "2026-11-01T00:00:00Z",
    cardCount: 100,
    commander: { name: "Atraxa", imageUri: "", artCropUri: "" },
    author: null,
    score: 3,
    upvotes: 3,
    downvotes: 0,
    viewerVote: null,
    averageRating: 4.5,
    ratingCount: 2,
    badge: null,
    ...overrides,
  };
}

/** @returns the text of the star-rating line of the only deck row */
function ratingText(): string | null {
  return (
    screen.getByText(/2 notes|2 ratings/).previousElementSibling?.textContent ??
    null
  );
}

// The average was printed with `toFixed(1)`, which always uses a dot, so a
// French visitor read "4.5" instead of "4,5".
describe("CommanderDecksView average rating", () => {
  it("uses a decimal comma in French", () => {
    renderWithIntl(
      <CommanderDecksView
        commanderName="Atraxa"
        decks={[makeDeck()]}
        canVote={false}
      />,
      { locale: "fr" }
    );

    expect(ratingText()).toBe("4,5");
  });

  it("keeps one decimal for a whole-number average", () => {
    renderWithIntl(
      <CommanderDecksView
        commanderName="Atraxa"
        decks={[makeDeck({ averageRating: 4 })]}
        canVote={false}
      />,
      { locale: "fr" }
    );

    expect(ratingText()).toBe("4,0");
  });

  it("uses a decimal point in English", () => {
    renderWithIntl(
      <CommanderDecksView
        commanderName="Atraxa"
        decks={[makeDeck()]}
        canVote={false}
      />,
      { locale: "en" }
    );

    expect(ratingText()).toBe("4.5");
  });
});

// A deck saved with a `commanderName` and no commander row reaches the view as
// a commander named after that `commanderName`, with no image
// (`commander-decks-lookup.ts`). Pinned: the row shows the card back under
// that name instead of failing the page.
describe("CommanderDecksView commander image", () => {
  it("shows the card back, named after the commander, when the commander has no image", () => {
    renderWithIntl(
      <CommanderDecksView
        commanderName="Atraxa"
        decks={[
          makeDeck({
            commander: {
              name: "Atraxa, Praetors' Voice",
              imageUri: "",
              artCropUri: "",
            },
          }),
        ]}
        canVote={false}
      />
    );

    expect(
      screen.getByRole("img", { name: "Atraxa, Praetors' Voice" })
    ).toHaveAttribute("src", CARD_BACK_URL);
  });
});
