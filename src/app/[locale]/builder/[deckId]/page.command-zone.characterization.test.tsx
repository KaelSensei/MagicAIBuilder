/**
 * Characterization of choosing a commander and a partner from the builder page.
 *
 * The shell suite (`page.test.tsx`) shows the "set as commander" control and the
 * search modes, and `DeckEditor.test.tsx` removes a partner that is already
 * seated. Neither clicks through to a new command zone. These tests do.
 *
 * Sociable: the page, the editor and the deck store are real. MSW answers the
 * cache, meta history and the command-zone write. Next's app-router contexts
 * carry the route, so `next/navigation` stays the real module.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  PathnameContext,
  PathParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { THRASIOS, TYMNA } from "@/lib/deck/fixtures/partner-cards";
import { createGuestDeck } from "@/lib/deck/guest-deck";
import { useDeckStore } from "@/lib/deck/store";
import { EMPTY_SEARCH_RESPONSE, type ScryfallCard } from "@/lib/scryfall/types";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import BuilderPage from "./page";

const DECK_ID = "deck-1";

/** A printing the name search can return. */
function printing(
  name: string,
  card: Pick<ScryfallCard, "type_line" | "oracle_text" | "cmc" | "color_identity">
): ScryfallCard {
  return {
    id: name.toLowerCase().replaceAll(/[^a-z]+/g, "-"),
    name,
    mana_cost: "",
    ...card,
  };
}

const THRASIOS_PRINTING = printing(THRASIOS.name, {
  type_line: THRASIOS.typeLine,
  oracle_text: THRASIOS.oracleText,
  cmc: 2,
  color_identity: ["G", "U"],
});

/** A deck row. */
function deckCard(name: string, card: Partial<DeckCard>): DeckCard {
  return aDeckCard({
    id: `row-${name.toLowerCase().replaceAll(/[^a-z]+/g, "-")}`,
    scryfallId: name.toLowerCase().replaceAll(/[^a-z]+/g, "-"),
    name,
    imageUri: "https://cards.scryfall.io/normal/front/card.jpg",
    artCropUri: "https://cards.scryfall.io/art_crop/front/card.jpg",
    ...card,
  });
}

const BARAL = deckCard("Baral, Chief of Compliance", {
  manaCost: "{1}{U}",
  cmc: 2,
  typeLine: "Legendary Creature — Human Wizard",
  oracleText:
    "Instant and sorcery spells you cast cost {1} less to cast.\nWhenever a spell or ability you control counters a spell, you may draw a card. If you do, discard a card.",
  power: "1",
  toughness: "3",
  colorIdentity: ["U"],
  category: "creature",
});

const TYMNA_ROW = deckCard(TYMNA.name, {
  manaCost: "{1}{W}{B}",
  cmc: 3,
  typeLine: TYMNA.typeLine,
  oracleText: TYMNA.oracleText,
  colorIdentity: ["W", "B"],
  category: "commander",
});

/** Bodies of the command-zone writes this file's handlers served. */
const commandZoneBodies: unknown[] = [];

/**
 * Holds `deck` as the open deck and renders the builder on it.
 *
 * @param deck - a fully loaded deck, so opening the page does not refetch it
 */
function renderOpenDeck(deck: Deck): void {
  useDeckStore.setState({
    decks: { [deck.id]: deck },
    activeDeckId: deck.id,
    isSyncing: false,
    loadError: null,
    deckOpenError: null,
    searchViewMode: "list",
    deckViewMode: "list",
  });
  const router = {
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  };
  renderWithProviders(
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value={`/builder/${deck.id}`}>
        <PathParamsContext.Provider value={{ deckId: deck.id }}>
          <BuilderPage />
        </PathParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
    { session: null }
  );
}

/**
 * Clicks the search row for `name`. The draggable wrapper is also a button
 * with that name, so the click lands on the row itself.
 *
 * @param user - the pointer session
 * @param name - the card name
 */
async function clickSearchRow(
  user: ReturnType<typeof userEvent.setup>,
  name: string
): Promise<void> {
  const row = (
    await screen.findAllByRole(
      "button",
      { name: new RegExp(name) },
      { timeout: 10_000 }
    )
  ).find((element) => element.tagName === "BUTTON");
  if (!(row instanceof HTMLButtonElement)) {
    throw new Error(`No search row for ${name}`);
  }
  await user.click(row);
}

describe("characterization: choosing the command zone from the builder", () => {
  setupMsw(
    http.get("/api/cache/search", ({ request }) => {
      const query = new URL(request.url).searchParams.get("query") ?? "";
      const data = query.includes(THRASIOS.name)
        ? { ...EMPTY_SEARCH_RESPONSE, total_cards: 1, data: [THRASIOS_PRINTING] }
        : EMPTY_SEARCH_RESPONSE;
      return HttpResponse.json({ hit: true, data });
    }),
    http.get("/api/search/translate", () => HttpResponse.json({ available: false })),
    http.get("/api/meta/:slug/history", () =>
      HttpResponse.json({ report: null, snapshotCount: 0, windowDays: 90 })
    ),
    http.patch("/api/decks/:id/command-zone", async ({ request }) => {
      commandZoneBodies.push(await request.json());
      return HttpResponse.json({ cards: [], version: 1 });
    }),
    http.get("/api/decks", () =>
      HttpResponse.json({ decks: [], total: 0, page: 0, limit: 20 })
    ),
    http.get("/api/decks/:id", () =>
      HttpResponse.json({ error: "Deck not found" }, { status: 404 })
    )
  );

  beforeEach(() => {
    commandZoneBodies.length = 0;
    localStorage.clear();
    useDeckStore.setState(useDeckStore.getInitialState(), true);
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  it("characterization: promoting a legendary creature from the list seats it as commander", async () => {
    const user = userEvent.setup();
    const deck: Deck = {
      ...createGuestDeck(),
      id: DECK_ID,
      name: "Talrand Spells",
      commander: deckCard("Talrand, Sky Summoner", {
        typeLine: "Legendary Creature — Merfolk Wizard",
        category: "commander",
        colorIdentity: ["U"],
      }),
      cards: [BARAL],
      cardCount: 2,
    };
    renderOpenDeck(deck);

    await screen.findByRole("heading", { level: 1, name: "Talrand Spells" });
    await user.click(screen.getByRole("button", { name: "List view" }));
    await user.click(
      screen.getByRole("button", { name: "Set Baral, Chief of Compliance as commander" })
    );

    await waitFor(() => {
      expect(useDeckStore.getState().decks[DECK_ID]?.commander?.name).toBe(
        "Baral, Chief of Compliance"
      );
    });
    expect(
      useDeckStore.getState().decks[DECK_ID]?.cards.map((card) => card.name)
    ).not.toContain("Baral, Chief of Compliance");
    expect(commandZoneBodies).toEqual([
      expect.objectContaining({
        removeCardIds: [BARAL.id],
        commandZone: expect.objectContaining({
          commanderName: "Baral, Chief of Compliance",
        }),
      }),
    ]);
  });

  it("characterization: partner search seats a card the commander can pair with", async () => {
    const user = userEvent.setup({ delay: null });
    const deck: Deck = {
      ...createGuestDeck(),
      id: DECK_ID,
      name: "Tymna and Friends",
      commander: TYMNA_ROW,
      pairingType: "partner",
      cards: [],
      cardCount: 1,
    };
    renderOpenDeck(deck);

    await screen.findByRole("heading", { level: 1, name: "Tymna and Friends" });
    await user.click(screen.getByRole("button", { name: "Partner" }));
    const search = screen.getByPlaceholderText("Search cards…");
    await user.type(search, THRASIOS.name);
    await clickSearchRow(user, THRASIOS.name);

    await waitFor(() => {
      expect(useDeckStore.getState().decks[DECK_ID]?.partner?.name).toBe(THRASIOS.name);
    });
    expect(useDeckStore.getState().decks[DECK_ID]?.commander?.name).toBe(TYMNA.name);
    expect(commandZoneBodies).toEqual([
      expect.objectContaining({
        commandZone: expect.objectContaining({
          partnerId: THRASIOS_PRINTING.id,
          pairingType: "partner",
        }),
      }),
    ]);
  });
});
