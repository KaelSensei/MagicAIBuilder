/**
 * The "Collection" switch on its own: how it names and announces its state.
 * What it does to the deck's rows is pinned at the editor's boundary, in
 * `DeckEditor.collection-toggle.test.tsx`.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useCollectionStore } from "@/lib/collection/store";
import { useDeckRowPreferencesStore } from "@/lib/ui/deck-row-preferences";
import { renderWithProviders } from "@/test/render";
import { CollectionBadgesToggle } from "./CollectionBadgesToggle";

/** Gives the player one recorded card, so the switch has something to hide. */
function ownOneCard(): void {
  useCollectionStore.setState({
    collectionCards: {
      "sol-ring-c21": {
        id: "collection-sol-ring",
        scryfallId: "sol-ring-c21",
        name: "Sol Ring",
        quantity: 1,
        foil: false,
        condition: null,
        acquiredAt: null,
        price: null,
        imageUri: "",
        createdAt: new Date("2026-11-01T00:00:00Z"),
      },
    },
    collectionCardsFoil: {},
  });
}

beforeEach(() => {
  useDeckRowPreferencesStore.getState().setShowCollectionBadges(true);
  localStorage.clear();
  ownOneCard();
});

describe("CollectionBadgesToggle", () => {
  it("is a pressed toggle button that says what pressing it does", async () => {
    renderWithProviders(<CollectionBadgesToggle />);
    const toggle = screen.getByRole("button", { name: "Collection" });

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAccessibleDescription(
      "Hide the Owned and Buy badges on the deck's rows"
    );

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAccessibleDescription(
      "Show the Owned and Buy badges on the deck's rows"
    );
  });

  it("keeps a target at least 24 px high", () => {
    renderWithProviders(<CollectionBadgesToggle />);

    expect(screen.getByRole("button", { name: "Collection" })).toHaveClass(
      "min-h-6"
    );
  });

  it("reads in French for a French player", () => {
    renderWithProviders(<CollectionBadgesToggle />, { locale: "fr" });

    expect(
      screen.getByRole("button", { name: "Collection" })
    ).toHaveAccessibleDescription(
      "Masquer les badges Possédée et Acheter sur les lignes du deck"
    );
  });
});
