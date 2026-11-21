/**
 * The deck summary bar under the builder's panels: the card count, the format and bracket, the
 * price and the counts by card type, read from the deck the store holds.
 *
 * Sociable: the real deck store, `useDeckPrice`, `DeckCardCount` and the English catalogues. The
 * price is read from the store's active deck, so each test seeds the store with the deck it
 * renders, as the builder page does when it opens one.
 */
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useBracketScore } from "@/hooks/useBracketScore";
import type { BracketLevel } from "@/lib/constants/brackets";
import type { BracketScore } from "@/lib/deck/analysis-types";
import { useDeckStore } from "@/lib/deck/store";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { aScryfallCard } from "@/test/builders/scryfall";
import { installFakeDeckClient } from "@/test/fake-deck-client";
import { renderWithProviders } from "@/test/render";
import { DeckSummaryBar } from "./DeckSummaryBar";

// The deck API behind the store's writes; a deck it does not hold accepts every write.
installFakeDeckClient();

/** A bracket estimate with neutral signals; only `overall` is read by the bar. */
function anEstimate(overall: BracketLevel): BracketScore {
  return {
    overall,
    dimensions: { ramp: 1, draw: 1, removal: 1, winSpeed: 1, avgCmc: 3 },
    gameChangers: 0,
    twoCardInfiniteCombos: 0,
    warnings: [],
  };
}

/** `count` distinct one-copy rows of one type line, priced at `price` each. */
function rows(
  count: number,
  typeLine: string,
  price: number | null = 0
): DeckCard[] {
  return Array.from({ length: count }, (_, n) =>
    aDeckCard({
      id: `${typeLine}-${n}`,
      name: `${typeLine} ${n}`,
      typeLine,
      price,
    })
  );
}

/** Talrand, Sky Summoner, the deck's commander: a creature worth $2.50. */
const TALRAND = aDeckCard({
  id: "talrand",
  name: "Talrand, Sky Summoner",
  typeLine: "Legendary Creature — Merfolk Wizard",
  price: 2.5,
});

/**
 * A complete Commander deck: Talrand and 30 creatures, 36 Islands, 9 instants, 8 sorceries,
 * 10 artifacts, 5 enchantments and a planeswalker, $412.50 in all.
 */
function aFullDeck(overrides: Partial<Deck> = {}): Deck {
  return aDeck({
    commander: TALRAND,
    cards: [
      ...rows(30, "Creature — Drake"),
      aDeckCard({
        id: "island",
        name: "Island",
        typeLine: "Basic Land — Island",
        quantity: 36,
        price: 0,
      }),
      ...rows(9, "Instant"),
      ...rows(8, "Sorcery"),
      ...rows(9, "Artifact"),
      aDeckCard({
        id: "sol-ring",
        name: "Sol Ring",
        typeLine: "Artifact",
        price: 410,
      }),
      ...rows(5, "Enchantment"),
      ...rows(1, "Legendary Planeswalker — Jace"),
    ],
    ...overrides,
  });
}

/** Holds `deck` as the store's active deck, as the builder page does once it opens it. */
function openInStore(deck: Deck): void {
  useDeckStore.setState({ decks: { [deck.id]: deck }, activeDeckId: deck.id });
}

/** Renders the bar for `deck`, held as the store's active deck. */
function renderBar(deck: Deck, score: BracketScore | null = anEstimate(3)) {
  openInStore(deck);
  return renderWithProviders(
    <DeckSummaryBar deck={deck} bracketScore={score} />
  );
}

/** The bar, found by its accessible name. */
function bar(): HTMLElement {
  return screen.getByRole("region", { name: "Deck summary" });
}

describe("DeckSummaryBar", () => {
  it("shows a deck of 31 creatures, 36 lands … by type, and the type counts add up to 100", () => {
    renderBar(aFullDeck());

    const types = within(bar()).getByRole("list", { name: "Cards by type" });
    const counts = within(types)
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(counts).toEqual([
      "31 creatures",
      "36 lands",
      "9 instants",
      "8 sorceries",
      "10 artifacts",
      "5 enchantments",
      "1 planeswalker",
    ]);
    const total = counts.reduce(
      (sum, text) => sum + Number.parseInt(text ?? "", 10),
      0
    );
    expect(total).toBe(100);
  });

  it("shows the count with its size state, then the format and bracket, then the price, then the types", () => {
    renderBar(aFullDeck());

    const count = within(bar()).getByText("100/100");
    const bracket = within(bar()).getByText("Commander · Bracket 3");
    // USD is written as its code, as the Deck Price panel writes it (I-96).
    const price = within(bar()).getByText(/^USD\s412\.50$/);
    const types = within(bar()).getByRole("list", { name: "Cards by type" });
    expect(count).toHaveTextContent("100/100 (complete)");
    const inOrder = [count, bracket, price, types].every(
      (node, n, all) =>
        n === 0 ||
        Boolean(
          all[n - 1].compareDocumentPosition(node) &
          Node.DOCUMENT_POSITION_FOLLOWING
        )
    );
    expect(inOrder).toBe(true);
  });

  it("shows a manual bracket instead of the estimate, and says the player set it", () => {
    renderBar(aFullDeck({ manualBracket: 4 }), anEstimate(2));

    expect(
      within(bar()).getByText("Commander · Bracket 4, set by you")
    ).toBeInTheDocument();
    expect(within(bar()).queryByText(/Bracket 2/)).not.toBeInTheDocument();
  });

  it("names a Standard deck's format and shows no bracket, which Standard does not score", () => {
    const standard = aDeck({
      format: "standard",
      cards: [
        aDeckCard({ typeLine: "Basic Land — Island", quantity: 60, price: 0 }),
      ],
    });
    renderBar(standard, anEstimate(2));

    expect(within(bar()).getByText("Standard")).toBeInTheDocument();
    expect(within(bar()).queryByText(/Bracket/)).not.toBeInTheDocument();
  });

  it("follows the price with the number of cards that have none, in the Deck Price panel's words", () => {
    renderBar(
      aFullDeck({
        cards: [
          aDeckCard({ id: "a", typeLine: "Instant", price: null }),
          aDeckCard({ id: "b", typeLine: "Instant", price: null }),
        ],
      })
    );

    expect(within(bar()).getByText(/^USD\s2\.50$/)).toBeInTheDocument();
    expect(
      within(bar()).getByText("2 cards without price data")
    ).toBeInTheDocument();
  });

  it("changes the count, the price and the type counts when the player adds a card", async () => {
    openInStore(aFullDeck({ cards: aFullDeck().cards.slice(0, 30) }));
    renderWithProviders(<StoreDeckSummaryBar deckId="deck-1" />);
    expect(within(bar()).getByText("31/100")).toBeInTheDocument();
    expect(within(bar()).queryByText(/instant/)).not.toBeInTheDocument();

    await act(() =>
      useDeckStore.getState().addCard(
        aScryfallCard({
          name: "Counterspell",
          type_line: "Instant",
          prices: { usd: "1.25" },
        }),
        { printing: "explicit" }
      )
    );

    expect(within(bar()).getByText("32/100")).toBeInTheDocument();
    expect(within(bar()).getByText(/^USD\s3\.75$/)).toBeInTheDocument();
    expect(within(bar()).getByText("1 instant")).toBeInTheDocument();
  });

  it("puts the type counts behind a Types button below the lg breakpoint", async () => {
    const user = userEvent.setup();
    renderBar(aFullDeck());
    const toggle = within(bar()).getByRole("button", { name: "Types" });
    const types = within(bar()).getByRole("list", { name: "Cards by type" });
    // jsdom applies no CSS: the Tailwind classes are the observable signal, as in the page test.
    expect(toggle).toHaveClass("lg:hidden");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", types.id);
    expect(types).toHaveClass("max-lg:hidden");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(types).not.toHaveClass("max-lg:hidden");
  });

  it("shows no bar while the deck is a listing stub or missing", () => {
    const stub = aDeck({ commander: TALRAND, cardRowCount: 99 });
    const { rerender } = renderBar(stub);
    expect(
      screen.queryByRole("region", { name: "Deck summary" })
    ).not.toBeInTheDocument();

    rerender(<DeckSummaryBar deck={null} bracketScore={null} />);

    expect(
      screen.queryByRole("region", { name: "Deck summary" })
    ).not.toBeInTheDocument();
  });

  it("shows an empty deck as 0/100 and USD 0.00, with no type", () => {
    renderBar(aDeck(), null);

    expect(within(bar()).getByText("0/100")).toBeInTheDocument();
    expect(within(bar()).getByText(/^USD\s0\.00$/)).toBeInTheDocument();
    expect(within(bar()).queryByRole("list")).not.toBeInTheDocument();
    expect(
      within(bar()).queryByRole("button", { name: "Types" })
    ).not.toBeInTheDocument();
  });

  it("reads in French, with each count in the singular or the plural", () => {
    openInStore(aFullDeck({ manualBracket: 3 }));
    renderWithProviders(
      <DeckSummaryBar
        deck={aFullDeck({ manualBracket: 3 })}
        bracketScore={anEstimate(3)}
      />,
      { locale: "fr" }
    );

    const summary = screen.getByRole("region", { name: "Résumé du deck" });
    expect(
      within(summary).getByText("Commander · Bracket 3, choisi par vous")
    ).toBeInTheDocument();
    expect(within(summary).getByText("31 créatures")).toBeInTheDocument();
    expect(within(summary).getByText("1 planeswalker")).toBeInTheDocument();
    expect(
      within(summary).getByRole("button", { name: "Types" })
    ).toBeInTheDocument();
  });
});

/** The bar as the builder page mounts it: the deck and its estimate read from the store. */
function StoreDeckSummaryBar({ deckId }: { readonly deckId: string }) {
  const deck = useDeckStore((state) => state.decks[deckId] ?? null);
  return <DeckSummaryBar deck={deck} bracketScore={useBracketScore(deck)} />;
}
