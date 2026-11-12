/**
 * Characterization of the commands `DeckEditor` sends to the deck store (P1-11). The editor is the
 * builder page's middle panel and had no unit test; these tests pin which store action each of its
 * controls calls, observed through the store's state and the deck API requests the store sends, so
 * the Phase 6 split of the builder cannot rewire a control unnoticed (ADR 0005, rule 6).
 *
 * Sociable: the editor, its zone contents, its rows and the deck store are the real ones. MSW stands
 * in for the deck API and records each request. The editor is mounted as the builder page mounts
 * it: inside a `DndContext`, with the active zone held by its parent, and with `onRemoveCard`
 * passed in rather than read from the store.
 *
 * Tests named "currently … (pinned)" record odd behaviour on purpose. A `fix/` pull request that
 * changes it flips the test with its own Red.
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DndContext } from "@dnd-kit/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse, type JsonBodyType } from "msw";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { THRASIOS, TYMNA } from "@/lib/deck/fixtures/partner-cards";
import { createGuestDeck } from "@/lib/deck/guest-deck";
import { useDeckStore } from "@/lib/deck/store";
import { EMPTY_SEARCH_RESPONSE } from "@/lib/scryfall/types";
import type { Deck, DeckCard, DeckZone } from "@/lib/deck/types";
import { useMsw } from "@/test/msw";
import { renderWithIntl, type TestLocale } from "@/test/render-with-intl";
import { DeckEditor } from "./DeckEditor";

const DECK_ID = "deck-1";

/** A deck row as the store holds it; card data follows Scryfall's Oracle text. */
function deckCard(name: string, card: Partial<DeckCard>): DeckCard {
  const slug = name.toLowerCase().replaceAll(/[^a-z]+/g, "-");
  return {
    id: `row-${slug}`,
    scryfallId: `scryfall-${slug}`,
    name,
    manaCost: "",
    cmc: 0,
    typeLine: "",
    oracleText: "",
    colorIdentity: ["U"],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: `https://cards.scryfall.io/normal/front/${slug}.jpg`,
    artCropUri: `https://cards.scryfall.io/art_crop/front/${slug}.jpg`,
    category: "other",
    quantity: 1,
    notes: null,
    zone: "main",
    ...card,
  };
}

const TALRAND = deckCard("Talrand, Sky Summoner", {
  manaCost: "{2}{U}{U}",
  cmc: 4,
  typeLine: "Legendary Creature — Merfolk Wizard",
  oracleText:
    "Whenever you cast an instant or sorcery spell, create a 2/2 blue Drake creature token with flying.",
  category: "commander",
});
const COUNTERSPELL = deckCard("Counterspell", {
  manaCost: "{U}{U}",
  cmc: 2,
  typeLine: "Instant",
  oracleText: "Counter target spell.",
  category: "instant",
});
const SOL_RING = deckCard("Sol Ring", {
  manaCost: "{1}",
  cmc: 1,
  typeLine: "Artifact",
  oracleText: "{T}: Add {C}{C}.",
  colorIdentity: [],
  category: "ramp",
});
const ISLANDS = deckCard("Island", {
  typeLine: "Basic Land — Island",
  oracleText: "({T}: Add {U}.)",
  category: "land",
  quantity: 8,
});
const NEGATE = deckCard("Negate", {
  manaCost: "{1}{U}",
  cmc: 2,
  typeLine: "Instant",
  oracleText: "Counter target noncreature spell.",
  category: "instant",
  zone: "sideboard",
});
const PONDER = deckCard("Ponder", {
  manaCost: "{U}",
  cmc: 1,
  typeLine: "Sorcery",
  oracleText:
    "Look at the top three cards of your library, then put them back in any order. You may shuffle.\nDraw a card.",
  category: "draw",
  quantity: 1,
  zone: "maybeboard",
});

/** Talrand with ten main-deck cards, one sideboard card and one card under consideration. */
function talrandDeck(deck: Partial<Deck> = {}): Deck {
  return {
    ...createGuestDeck(),
    id: DECK_ID,
    name: "Talrand Spells",
    commander: TALRAND,
    cards: [COUNTERSPELL, SOL_RING, ISLANDS, NEGATE, PONDER],
    maybeboard: [PONDER],
    cardCount: 6,
    ...deck,
  };
}

/** A request the store sent, as `METHOD path` plus its JSON body when it has one. */
interface SentRequest {
  readonly line: string;
  readonly body?: JsonBodyType;
}

let sent: SentRequest[] = [];

async function record(request: Request): Promise<void> {
  const line = `${request.method} ${new URL(request.url).pathname}`;
  const text = await request.text();
  sent.push(text === "" ? { line } : { line, body: JSON.parse(text) });
}

/** Mounts the editor on the store's copy of the deck, as the builder page does. */
function EditorOnStoreDeck({
  onRemoveCard,
  onActiveZoneChange,
}: {
  readonly onRemoveCard: (id: string) => void;
  readonly onActiveZoneChange: (zone: DeckZone) => void;
}) {
  const deck = useDeckStore((state) => state.decks[DECK_ID]);
  const [activeZone, setActiveZone] = useState<DeckZone>("main");
  if (!deck) return null;
  return (
    <DeckEditor
      deck={deck}
      onRemoveCard={onRemoveCard}
      activeZone={activeZone}
      onActiveZoneChange={(zone) => {
        setActiveZone(zone);
        onActiveZoneChange(zone);
      }}
    />
  );
}

/** Opens `deck` as the store's active deck and renders the editor on it. */
function renderEditor(deck: Deck, locale: TestLocale = "en") {
  useDeckStore.setState({
    decks: { [DECK_ID]: deck },
    activeDeckId: DECK_ID,
    isSyncing: false,
  });
  const onRemoveCard = vi.fn<(id: string) => void>();
  const onActiveZoneChange = vi.fn<(zone: DeckZone) => void>();
  renderWithIntl(
    <QueryClientProvider client={new QueryClient()}>
      <DndContext>
        <EditorOnStoreDeck
          onRemoveCard={onRemoveCard}
          onActiveZoneChange={onActiveZoneChange}
        />
      </DndContext>
    </QueryClientProvider>,
    { locale }
  );
  return { onRemoveCard, onActiveZoneChange };
}

/** The store's copy of the deck under test. */
function storedDeck(): Deck | undefined {
  return useDeckStore.getState().decks[DECK_ID];
}

beforeEach(() => {
  sent = [];
  localStorage.clear();
  useDeckStore.setState(useDeckStore.getInitialState(), true);
});

describe("characterization: DeckEditor commands", () => {
  useMsw(
    http.patch("/api/decks/:id/cards/:cardId", async ({ request, params }) => {
      await record(request);
      return HttpResponse.json({ id: params.cardId });
    }),
    http.delete("/api/decks/:id/cards/:cardId", async ({ request }) => {
      await record(request);
      return new HttpResponse(null, { status: 204 });
    }),
    http.patch("/api/decks/:id", async ({ request, params }) => {
      await record(request);
      return HttpResponse.json({ id: params.id });
    }),
    // Outside English the rows look up printings in the player's language through the shared
    // Scryfall cache. None is found here, so the rows keep their English names.
    http.get("/api/cache/search", () =>
      HttpResponse.json({ hit: true, data: EMPTY_SEARCH_RESPONSE })
    )
  );

  describe("view", () => {
    it("starts in the grid view and switches the store's deck view to the list and back", async () => {
      renderEditor(talrandDeck());
      expect(useDeckStore.getState().deckViewMode).toBe("grid");

      await userEvent.click(screen.getByRole("button", { name: "List view" }));
      expect(useDeckStore.getState().deckViewMode).toBe("list");
      expect(
        screen.queryByRole("button", { name: "4" })
      ).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Grid view" }));
      expect(useDeckStore.getState().deckViewMode).toBe("grid");
      expect(sent).toEqual([]);
    });

    it("sets the store's grid density; currently each density button is named by its bare number (pinned)", async () => {
      renderEditor(talrandDeck());
      expect(useDeckStore.getState().deckGridCols).toBe(6);

      await userEvent.click(
        screen.getByRole("button", {
          name: "4",
          description: "4 cards per row",
        })
      );

      expect(useDeckStore.getState().deckGridCols).toBe(4);
    });

    // The search panel has a "List view" button too, so without a named toolbar a
    // screen reader hears the same button twice with nothing to tell them apart,
    // and the E2E specs had to pick the editor's by position (audit TT-11).
    it("names the view toolbar, so its buttons can be told from the search panel's", () => {
      renderEditor(talrandDeck());

      const toolbar = screen.getByRole("toolbar", { name: "Deck view" });
      expect(
        within(toolbar).getByRole("button", { name: "List view" })
      ).toHaveAttribute("aria-pressed", "false");
      expect(
        within(toolbar).getByRole("button", { name: "Grid view" })
      ).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("zones", () => {
    it("counts the main zone with the commander out of 100, and the other zones by quantity", () => {
      renderEditor(talrandDeck());

      expect(screen.getByRole("button", { name: "Main (11)" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(
        screen.getByRole("button", { name: "Sideboard (1)" })
      ).toHaveAttribute("aria-pressed", "false");
      expect(
        screen.getByRole("button", { name: "Considering (1)" })
      ).toBeInTheDocument();
      expect(screen.getByText("11/100")).toBeInTheDocument();
    });

    it("shows the chosen zone's cards, tells its parent, and keeps the view and sort controls to the main zone", async () => {
      const { onActiveZoneChange } = renderEditor(talrandDeck());

      await userEvent.click(
        screen.getByRole("button", { name: "Sideboard (1)" })
      );

      expect(onActiveZoneChange).toHaveBeenCalledWith("sideboard");
      expect(
        screen.getByRole("button", { name: "Sideboard (1)" })
      ).toHaveAttribute("aria-pressed", "true");
      expect(
        screen.getByRole("button", { name: "Remove Negate" })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Remove Counterspell" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "List view" })
      ).not.toBeInTheDocument();
      expect(screen.queryByText("11/100")).not.toBeInTheDocument();
    });

    it("moves a main-deck card to the sideboard through the store", async () => {
      renderEditor(talrandDeck());

      await userEvent.click(
        screen.getByRole("button", { name: "Move Counterspell to Sideboard" })
      );

      await waitFor(() =>
        expect(sent).toEqual([
          {
            line: `PATCH /api/decks/${DECK_ID}/cards/${COUNTERSPELL.id}`,
            body: { zone: "sideboard" },
          },
        ])
      );
      expect(
        screen.getByRole("button", { name: "Sideboard (2)" })
      ).toBeInTheDocument();
    });

    it("moves a main-deck card to Considering from the list view through the store", async () => {
      renderEditor(talrandDeck());
      await userEvent.click(screen.getByRole("button", { name: "List view" }));

      await userEvent.click(
        screen.getByRole("button", { name: "Move Counterspell to Considering" })
      );

      await waitFor(() =>
        expect(sent).toEqual([
          {
            line: `PATCH /api/decks/${DECK_ID}/cards/${COUNTERSPELL.id}`,
            body: { zone: "maybeboard" },
          },
        ])
      );
      expect(
        screen.getByRole("button", { name: "Considering (2)" })
      ).toBeInTheDocument();
    });

    it("currently names the grid view's Considering move without its card, unlike its Sideboard move (pinned)", () => {
      renderEditor(talrandDeck());

      // One per main-deck card in the grid: Counterspell, Sol Ring and the Islands.
      expect(
        screen.getAllByRole("button", { name: "Move to Considering" })
      ).toHaveLength(3);
      expect(
        screen.getByRole("button", { name: "Move Sol Ring to Sideboard" })
      ).toBeInTheDocument();
    });

    it("moves a sideboard card back to the main deck through the store", async () => {
      renderEditor(talrandDeck());
      await userEvent.click(
        screen.getByRole("button", { name: "Sideboard (1)" })
      );

      await userEvent.click(
        screen.getByRole("button", { name: "Move to Main Deck" })
      );

      await waitFor(() =>
        expect(sent).toEqual([
          {
            line: `PATCH /api/decks/${DECK_ID}/cards/${NEGATE.id}`,
            body: { zone: "main" },
          },
        ])
      );
      expect(
        screen.getByRole("button", { name: "Main (12)" })
      ).toBeInTheDocument();
    });

    it("currently names the sideboard's selection boxes in English in every locale (pinned)", async () => {
      renderEditor(talrandDeck(), "fr");

      await userEvent.click(
        screen.getByRole("button", { name: "Réserve (1)" })
      );

      expect(
        screen.getByRole("button", { name: "Select Negate" })
      ).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("rows", () => {
    it("changes a card's category through the store", async () => {
      renderEditor(talrandDeck());

      await userEvent.selectOptions(
        screen.getByRole("combobox", {
          name: "Change category for Counterspell",
        }),
        "Removal"
      );

      await waitFor(() =>
        expect(sent).toEqual([
          {
            line: `PATCH /api/decks/${DECK_ID}/cards/${COUNTERSPELL.id}`,
            body: { category: "removal" },
          },
        ])
      );
      expect(
        storedDeck()?.cards.find((card) => card.id === COUNTERSPELL.id)
          ?.category
      ).toBe("removal");
    });

    it("hands a removed card's row id to onRemoveCard and sends nothing itself", async () => {
      const { onRemoveCard } = renderEditor(talrandDeck());

      await userEvent.click(
        screen.getByRole("button", { name: "Remove Counterspell" })
      );

      expect(onRemoveCard).toHaveBeenCalledWith(COUNTERSPELL.id);
      expect(sent).toEqual([]);
      expect(storedDeck()?.cards).toContainEqual(COUNTERSPELL);
    });
  });

  describe("command zone", () => {
    it("clears the commander through the store: the deck's command zone first, then the commander's row", async () => {
      renderEditor(talrandDeck());

      await userEvent.click(
        screen.getByRole("button", { name: "Remove Talrand, Sky Summoner" })
      );

      await waitFor(() =>
        expect(sent).toEqual([
          {
            line: `PATCH /api/decks/${DECK_ID}`,
            body: {
              commanderId: null,
              commanderName: null,
              partnerId: null,
              pairingType: "none",
            },
          },
          { line: `DELETE /api/decks/${DECK_ID}/cards/${TALRAND.id}` },
        ])
      );
      expect(storedDeck()?.commander).toBeNull();
      expect(
        screen.getByText("Search for a commander above")
      ).toBeInTheDocument();
    });

    // The banner's button is named after its commander since TT-11. The row's
    // own remove button, in MainZoneContent, still reads as its "×" content.
    it("names the banner's remove button after its commander; currently the row's is still '×' (pinned)", () => {
      renderEditor(talrandDeck());

      expect(
        screen.getByRole("button", { name: "Remove Talrand, Sky Summoner" })
      ).toHaveAttribute("title", "Remove Talrand, Sky Summoner");
      const unnamed = screen.getAllByRole("button", { name: "×" });
      expect(unnamed.map((button) => button.getAttribute("title"))).toEqual([
        "Remove commander",
      ]);
    });

    it("removes the partner through the store from its banner", async () => {
      const thrasios = deckCard(THRASIOS.name, {
        ...THRASIOS,
        colorIdentity: ["G", "U"],
        category: "commander",
      });
      const tymna = deckCard(TYMNA.name, {
        ...TYMNA,
        colorIdentity: ["W", "B"],
        category: "commander",
      });
      renderEditor(
        talrandDeck({
          commander: thrasios,
          partner: tymna,
          pairingType: "partner",
        })
      );

      await userEvent.click(
        screen.getByRole("button", { name: `Remove ${TYMNA.name}` })
      );

      await waitFor(() =>
        expect(sent).toEqual([
          {
            line: `PATCH /api/decks/${DECK_ID}`,
            body: { partnerId: null, pairingType: "partner" },
          },
          { line: `DELETE /api/decks/${DECK_ID}/cards/${tymna.id}` },
        ])
      );
      expect(storedDeck()?.partner).toBeNull();
      expect(storedDeck()?.commander).toEqual(thrasios);
    });

    it("clears the companion through the store: its row first, then the deck's companion id", async () => {
      const keruga = deckCard("Keruga, the Macrosage", {
        manaCost: "{5}{G/U}{G/U}",
        cmc: 7,
        typeLine: "Legendary Creature — Dinosaur Hippo",
        oracleText:
          "Companion — Your starting deck contains only cards with mana value 3 or greater and land cards.",
        colorIdentity: ["G", "U"],
        category: "companion",
        zone: "sideboard",
      });
      const thrasios = deckCard(THRASIOS.name, {
        ...THRASIOS,
        colorIdentity: ["G", "U"],
        category: "commander",
      });
      renderEditor(talrandDeck({ commander: thrasios, companion: keruga }));

      await userEvent.click(screen.getByRole("button", { name: "Clear" }));

      await waitFor(() =>
        expect(sent).toEqual([
          { line: `DELETE /api/decks/${DECK_ID}/cards/${keruga.id}` },
          { line: `PATCH /api/decks/${DECK_ID}`, body: { companionId: null } },
        ])
      );
      expect(storedDeck()?.companion).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Clear" })
      ).not.toBeInTheDocument();
    });
  });
});
