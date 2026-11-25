/**
 * The "Collection" switch in the toolbar hides or shows the Owned and Buy
 * badges on the deck's rows and grid cards (I-37 requirement 6.5, the
 * ownership marker). The choice is kept in this browser and applies to every
 * zone and to both the List and Grid views, although the toolbar shows on the
 * Main zone only.
 *
 * Sociable: the editor, its toolbar, its rows, the deck store, the collection
 * store and the persisted row preferences are the real ones. MSW answers the
 * shared Scryfall cache the rows may read.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DndContext } from "@dnd-kit/core";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCollectionStore } from "@/lib/collection/store";
import type { CollectionCard } from "@/lib/collection/types";
import { useDeckStore } from "@/lib/deck/store";
import { EMPTY_SEARCH_RESPONSE } from "@/lib/scryfall/types";
import {
  DECK_ROW_PREFERENCES_STORAGE_KEY,
  useDeckRowPreferencesStore,
} from "@/lib/ui/deck-row-preferences";
import type { Deck } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { DeckEditor } from "./DeckEditor";

const SOL_RING = aDeckCard({
  id: "row-sol-ring",
  scryfallId: "sol-ring-c21",
  name: "Sol Ring",
  cmc: 1,
  typeLine: "Artifact",
  category: "ramp",
});

/** A row the collection does not hold in the tests below, so it shows Buy. */
const COUNTERSPELL = aDeckCard({
  id: "row-counterspell",
  scryfallId: "counterspell-mh2",
  name: "Counterspell",
  cmc: 2,
  typeLine: "Instant",
  category: "instant",
});

/** Writes a stored preference blob the way the persist middleware does. */
function storePreferences(state: unknown): void {
  localStorage.setItem(
    DECK_ROW_PREFERENCES_STORAGE_KEY,
    JSON.stringify({ state, version: 0 })
  );
}

/** One copy of a printing in the player's collection, as `loadCollection` stores it. */
function collectionCopy(scryfallId: string): CollectionCard {
  return {
    id: `collection-${scryfallId}`,
    scryfallId,
    name: scryfallId,
    quantity: 1,
    foil: false,
    condition: null,
    acquiredAt: null,
    price: null,
    imageUri: "",
    createdAt: new Date("2026-11-01T00:00:00Z"),
  };
}

/** Puts one copy of each printing in the player's collection. */
function ownPrintings(...scryfallIds: readonly string[]): void {
  useCollectionStore.setState({
    collectionCards: Object.fromEntries(
      scryfallIds.map((id) => [id, collectionCopy(id)])
    ),
    collectionCardsFoil: {},
  });
}

/** Opens `deck` in the store and renders the editor on it, in the list view. */
function renderList(deck: Deck) {
  renderInView(deck, "list");
}

/** Opens `deck` in the store and renders the editor on it, in `viewMode`. */
function renderInView(deck: Deck, viewMode: "grid" | "list") {
  useDeckStore.setState({
    decks: { [deck.id]: deck },
    activeDeckId: deck.id,
    isSyncing: false,
    deckViewMode: viewMode,
  });
  renderWithProviders(
    <DndContext>
      <DeckEditor deck={deck} onRemoveCard={vi.fn()} />
    </DndContext>
  );
}

beforeEach(() => {
  useDeckRowPreferencesStore.getState().setShowCollectionBadges(true);
  localStorage.clear();
  useDeckStore.setState(useDeckStore.getInitialState(), true);
  useCollectionStore.setState({ collectionCards: {}, collectionCardsFoil: {} });
});

describe("the Collection switch on the deck's rows", () => {
  setupMsw(
    http.get("/api/cache/search", () =>
      HttpResponse.json({ hit: true, data: EMPTY_SEARCH_RESPONSE })
    )
  );

  it("with the switch off, a row the collection owns shows no Owned badge", async () => {
    ownPrintings("sol-ring-c21");
    renderList(aDeck({ cards: [SOL_RING] }));
    expect(screen.getByText("Owned")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Collection" }));

    expect(screen.queryByText("Owned")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collection" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("brings the badges back when the switch is turned on again", async () => {
    ownPrintings("sol-ring-c21");
    renderList(aDeck({ cards: [SOL_RING, COUNTERSPELL] }));
    const toggle = screen.getByRole("button", { name: "Collection" });

    await userEvent.click(toggle);
    await userEvent.click(toggle);

    expect(screen.getByText("Owned")).toBeInTheDocument();
    expect(screen.getByText("Buy")).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the badges hidden after a reload", async () => {
    storePreferences({ showCollectionBadges: false });
    await useDeckRowPreferencesStore.persist.rehydrate();
    ownPrintings("sol-ring-c21");

    renderList(aDeck({ cards: [SOL_RING, COUNTERSPELL] }));

    expect(screen.queryByText("Owned")).not.toBeInTheDocument();
    expect(screen.queryByText("Buy")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collection" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it.each([
    // A falsy non-boolean, so an unguarded read would hide the badges.
    [
      "a number, not a boolean",
      JSON.stringify({ state: { showCollectionBadges: 0 }, version: 0 }),
    ],
    ["not JSON", "{not json"],
  ])("shows the badges when the stored choice is %s", async (_label, raw) => {
    localStorage.setItem(DECK_ROW_PREFERENCES_STORAGE_KEY, raw);
    await useDeckRowPreferencesStore.persist.rehydrate();
    ownPrintings("sol-ring-c21");

    renderList(aDeck({ cards: [SOL_RING] }));

    expect(screen.getByText("Owned")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collection" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("offers no switch while the collection holds no card", () => {
    renderList(aDeck({ cards: [SOL_RING] }));

    expect(screen.getByRole("button", { name: /^CMC/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Collection" })
    ).not.toBeInTheDocument();
  });

  it("hides the badge on a Considering row too, where the toolbar is not shown", async () => {
    ownPrintings("sol-ring-c21");
    renderList(
      aDeck({
        cards: [SOL_RING, { ...COUNTERSPELL, zone: "maybeboard" }],
      })
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Considering (1)" })
    );
    expect(screen.getByText("Buy")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Main (1)" }));
    await userEvent.click(screen.getByRole("button", { name: "Collection" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Considering (1)" })
    );

    expect(screen.queryByText("Buy")).not.toBeInTheDocument();
  });

  it("offers the switch in the Grid view too, now that grid cards carry the badges", () => {
    ownPrintings("sol-ring-c21");

    renderInView(aDeck({ cards: [SOL_RING] }), "grid");

    expect(screen.getByRole("button", { name: "Collection" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("keeps the sort and group buttons in the Grid view", () => {
    ownPrintings("sol-ring-c21");

    renderInView(aDeck({ cards: [SOL_RING] }), "grid");

    expect(screen.getByRole("button", { name: /^CMC/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "By Type" })).toBeInTheDocument();
  });

  it("keeps the badges hidden after a List, Grid, List round trip", async () => {
    ownPrintings("sol-ring-c21");
    renderList(aDeck({ cards: [SOL_RING, COUNTERSPELL] }));
    await userEvent.click(screen.getByRole("button", { name: "Collection" }));

    await userEvent.click(screen.getByRole("button", { name: "Grid view" }));
    expect(screen.getByRole("button", { name: "Collection" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.queryByText("Owned")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "List view" }));

    expect(screen.queryByText("Owned")).not.toBeInTheDocument();
    expect(screen.queryByText("Buy")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collection" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});

describe("the Owned and Buy badges on the Grid view's cards", () => {
  setupMsw(
    http.get("/api/cache/search", () =>
      HttpResponse.json({ hit: true, data: EMPTY_SEARCH_RESPONSE })
    )
  );

  it("marks a grid card the collection owns as Owned, named as on its list row", () => {
    ownPrintings("sol-ring-c21");

    renderInView(aDeck({ cards: [SOL_RING] }), "grid");

    expect(screen.getByText("Owned")).toBeInTheDocument();
    expect(
      screen.getByText("Owned: 1 copy of this printing in your collection")
    ).toBeInTheDocument();
  });

  it("asks to buy a grid card the collection does not hold, named as on its list row", () => {
    ownPrintings("sol-ring-c21");

    renderInView(aDeck({ cards: [SOL_RING, COUNTERSPELL] }), "grid");

    expect(screen.getByText("Buy")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Buy: 1 more copy of this printing needed, 0 in your collection"
      )
    ).toBeInTheDocument();
  });

  it("hides every grid badge when the switch is turned off in the Grid view", async () => {
    ownPrintings("sol-ring-c21");
    renderInView(aDeck({ cards: [SOL_RING, COUNTERSPELL] }), "grid");

    await userEvent.click(screen.getByRole("button", { name: "Collection" }));

    expect(screen.queryByText("Owned")).not.toBeInTheDocument();
    expect(screen.queryByText("Buy")).not.toBeInTheDocument();
  });

  it("carries a choice made in the Grid view over to the List view", async () => {
    ownPrintings("sol-ring-c21");
    renderInView(aDeck({ cards: [SOL_RING] }), "grid");
    await userEvent.click(screen.getByRole("button", { name: "Collection" }));

    await userEvent.click(screen.getByRole("button", { name: "List view" }));

    expect(screen.queryByText("Owned")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collection" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("shows no badge and no switch in the Grid view while the collection is empty, as for a guest", () => {
    renderInView(aDeck({ cards: [SOL_RING, COUNTERSPELL] }), "grid");

    expect(screen.getByRole("button", { name: /^CMC/ })).toBeInTheDocument();
    expect(screen.queryByText("Buy")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Collection" })
    ).not.toBeInTheDocument();
  });

  // CR 205.4c: a land with the basic supertype is basic; the deck never needs to buy one.
  it("never asks to buy a basic land shown as a grid card", () => {
    ownPrintings("sol-ring-c21");
    const forest = aDeckCard({
      id: "row-forest",
      scryfallId: "forest-printing",
      name: "Forest",
      typeLine: "Basic Land — Forest",
      category: "land",
      quantity: 30,
    });

    renderInView(aDeck({ cards: [SOL_RING, forest] }), "grid");

    expect(screen.getByText("Owned")).toBeInTheDocument();
    expect(screen.queryByText("Buy")).not.toBeInTheDocument();
  });
});
