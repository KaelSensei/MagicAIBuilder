import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionProvider } from "next-auth/react";
import { SearchResults } from "./SearchResults";
import { renderWithIntl } from "@/test/render-with-intl";
import type { CollectionOnlyState } from "@/hooks/useCardSearchResults";
import type { ScryfallCard } from "@/lib/scryfall/types";

function card(id: string, name: string): ScryfallCard {
  return { id, name, cmc: 1, type_line: "Artifact", color_identity: [] };
}

function renderOwned(
  cards: readonly ScryfallCard[],
  collectionOnly: CollectionOnlyState,
  locale: "en" | "fr" = "en"
) {
  // A listed card offers a quick add to the collection, which reads the session.
  return renderWithIntl(
    <SessionProvider session={null}>
      <SearchResults
        cards={cards}
        isLoading={false}
        error={null}
        totalCards={cards.length}
        collectionOnly={collectionOnly}
      />
    </SessionProvider>,
    { locale }
  );
}

describe("SearchResults with Collection only on", () => {
  it("tells a guest that the filter needs an account instead of showing no results", () => {
    renderOwned([], { kind: "signedOut" });

    expect(screen.getByRole("status").textContent).toBe(
      "Sign in and add cards to your collection to see only the cards you own."
    );
    expect(
      screen.queryByText("No cards found. Try a different search.")
    ).toBeNull();
  });

  it("tells a player that their collection is empty", () => {
    renderOwned([], { kind: "emptyCollection" });

    expect(screen.getByRole("status").textContent).toBe(
      "Your collection is empty. Add cards to it, and this filter will show only the cards you own."
    );
  });

  it("says the collection could not be loaded", () => {
    renderOwned([], { kind: "collectionUnavailable" });

    expect(screen.getByRole("status").textContent).toBe(
      "Your collection could not be loaded, so the cards you own cannot be shown. Reload the page to try again."
    );
  });

  it("counts the owned cards and says how much of the search was checked when it stopped early", () => {
    renderOwned(
      [card("sol-ring", "Sol Ring"), card("command-tower", "Command Tower")],
      {
        kind: "scanned",
        scannedCards: 700,
        totalMatches: 3214,
        complete: false,
      }
    );

    expect(screen.getByText("2 cards you own")).toBeDefined();
    expect(
      screen.getByText(
        "Checked the 700 most-played of 3,214 matching cards. Narrow your search to check the rest."
      )
    ).toBeDefined();
    expect(screen.getByText("Sol Ring")).toBeDefined();
  });

  it("says nothing about coverage when every match was checked", () => {
    renderOwned([card("sol-ring", "Sol Ring")], {
      kind: "scanned",
      scannedCards: 3,
      totalMatches: 3,
      complete: true,
    });

    expect(screen.getByText("1 card you own")).toBeDefined();
    expect(screen.queryByText(/Checked the/)).toBeNull();
  });

  it("says that none of the owned cards match, and how much was checked", () => {
    renderOwned([], {
      kind: "scanned",
      scannedCards: 700,
      totalMatches: 900,
      complete: false,
    });

    expect(
      screen.getByText("None of the cards you own match this search.")
    ).toBeDefined();
    expect(
      screen.getByText(/Checked the 700 most-played of 900/)
    ).toBeDefined();
  });

  // Sonar S6819: the native <output> carries the status role, and the polite,
  // atomic announcement that role="status" implied stays explicit.
  it("says why nothing was searched in a polite, native status output", () => {
    renderOwned([], { kind: "signedOut" });

    const notice = screen.getByRole("status");
    expect(notice).toBeInstanceOf(HTMLOutputElement);
    expect(notice).not.toHaveAttribute("role");
    expect(notice).toHaveAttribute("aria-live", "polite");
    expect(notice).toHaveAttribute("aria-atomic", "true");
  });

  it("speaks French to a French player", () => {
    renderOwned([], { kind: "emptyCollection" }, "fr");

    expect(screen.getByRole("status").textContent).toBe(
      "Ta collection est vide. Ajoutes-y des cartes : ce filtre n'affichera alors que les cartes que tu possèdes."
    );
  });
});
