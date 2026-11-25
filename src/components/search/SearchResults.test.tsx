import type { ComponentProps } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionProvider } from "next-auth/react";
import { SearchResults } from "./SearchResults";
import { renderWithIntl } from "@/test/render-with-intl";
import { renderWithProviders } from "@/test/render";
import { aScryfallCard } from "@/test/builders/scryfall";
import { ScryfallApiError } from "@/lib/scryfall/api-error";
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

/** The props of a search in flight or settled; each test overrides what its state needs. */
function searchProps(
  overrides: Partial<ComponentProps<typeof SearchResults>> = {}
): ComponentProps<typeof SearchResults> {
  return { cards: [], isLoading: false, error: null, ...overrides };
}

/** Renders the results as a guest: a listed card's quick add reads the session. */
function renderSearch(props: ComponentProps<typeof SearchResults>) {
  return renderWithProviders(<SearchResults {...props} />, { session: null });
}

describe("SearchResults announces the search to a screen-reader player", () => {
  it("says it is searching, then how many cards came back", () => {
    const { rerender } = renderSearch(searchProps({ isLoading: true }));
    expect(screen.getByRole("status").textContent).toBe("Searching…");

    rerender(
      <SearchResults
        {...searchProps({
          cards: [aScryfallCard({ name: "Sol Ring" })],
          totalCards: 42,
        })}
      />
    );

    expect(screen.getByRole("status").textContent).toBe("42 results");
  });

  it("keeps the same status region mounted from searching to the results, so the change is announced", () => {
    const { rerender } = renderSearch(searchProps({ isLoading: true }));
    const whileSearching = screen.getByRole("status");

    rerender(
      <SearchResults
        {...searchProps({ cards: [aScryfallCard()], totalCards: 1 })}
      />
    );

    expect(screen.getByRole("status")).toBe(whileSearching);
    expect(whileSearching).toBeInstanceOf(HTMLOutputElement);
    expect(whileSearching).toHaveAttribute("aria-live", "polite");
    expect(whileSearching).toHaveAttribute("aria-atomic", "true");
  });

  it("says that nothing matched, politely", () => {
    renderSearch(searchProps({ totalCards: 0 }));

    expect(screen.getByRole("status").textContent).toBe(
      "No cards found. Try a different search."
    );
  });

  it("announces a failed search as one alert and leaves the polite region mounted and silent", () => {
    renderSearch(searchProps({ error: new Error("Scryfall is unavailable.") }));

    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert").textContent).toBe(
      "Card search is unavailable right now. Try again in a moment."
    );
    const status = screen.getByRole("status");
    expect(status).toBeInstanceOf(HTMLOutputElement);
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status.textContent).toBe("");
  });

  it("tells the player Scryfall could not read a query it rejected with 400", () => {
    renderSearch(
      searchProps({
        error: new ScryfallApiError(400, 'Invalid expression "zz:"'),
      })
    );

    expect(screen.getByRole("alert").textContent).toBe(
      "Scryfall could not read this search. Check its syntax."
    );
    expect(screen.queryByText(/Invalid expression/)).toBeNull();
  });

  it("says card search is unavailable when the player is offline", () => {
    renderSearch(searchProps({ error: new TypeError("Failed to fetch") }));

    expect(screen.getByRole("alert").textContent).toBe(
      "Card search is unavailable right now. Try again in a moment."
    );
    expect(screen.queryByText("Failed to fetch")).toBeNull();
  });

  it("tells a French player that card search is unavailable when Scryfall answers 503, without the raw error", () => {
    renderWithProviders(
      <SearchResults
        {...searchProps({
          error: new Error("Scryfall API error 503: Service Unavailable"),
        })}
      />,
      { session: null, locale: "fr" }
    );

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toBe(
      "La recherche de cartes est indisponible pour le moment. Réessayez dans un instant."
    );
    expect(screen.queryByText(/Scryfall API error/)).toBeNull();
  });

  it("says how many owned cards a Collection only search kept", () => {
    renderSearch(
      searchProps({
        cards: [
          aScryfallCard({ name: "Sol Ring" }),
          aScryfallCard({
            id: "00000000-0000-4000-8000-000000000002",
            name: "Command Tower",
          }),
        ],
        totalCards: 3214,
        collectionOnly: {
          kind: "scanned",
          scannedCards: 3214,
          totalMatches: 3214,
          complete: true,
        },
      })
    );

    expect(screen.getByRole("status").textContent).toBe("2 cards you own");
  });

  it("announces in French to a French player", () => {
    renderWithProviders(
      <SearchResults
        {...searchProps({ cards: [aScryfallCard()], totalCards: 42 })}
      />,
      { session: null, locale: "fr" }
    );

    expect(screen.getByRole("status").textContent).toBe("42 résultats");
  });
});
