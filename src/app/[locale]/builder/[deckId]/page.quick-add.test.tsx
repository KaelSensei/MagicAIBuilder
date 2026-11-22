/**
 * Smoke of quick add (I-37) on the real builder page: Ctrl+K or the toolbar's Quick add button
 * opens the palette, a card name runs its Scryfall query, and Enter adds the card to the main deck
 * through the page's own add action, so the deck's copy limit and zone rules apply.
 *
 * The palette's own behaviour is pinned in `src/components/search/QuickAddPalette*.test.tsx`;
 * this file proves the page mounts it and wires it to the deck store. No E2E covers it.
 *
 * Sociable: the page, the palette, the deck store and the UI store are real. The guest deck lives
 * in the browser only, so the deck API is never called; MSW serves the shared Scryfall search
 * cache. The one seam is `@/i18n/navigation`, for the reason `page.test.tsx`'s header gives.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GUEST_DECK_ID } from "@/lib/deck/guest-deck";
import { useDeckStore } from "@/lib/deck/store";
import { EMPTY_SEARCH_RESPONSE } from "@/lib/scryfall/types";
import { useUIStore } from "@/lib/ui/store";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { aScryfallCard } from "@/test/builders/scryfall";
import BuilderPage from "./page";

// eslint-disable-next-line no-restricted-syntax -- the one seam left; page.test.tsx's header says why and what removes it
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

/** The query quick add runs for "Sol Ring" on the guest deck: Commander, no commander yet. */
const SOL_RING_QUERY = "name:/Sol Ring/ legal:commander";

const SOL_RING = aScryfallCard({
  name: "Sol Ring",
  mana_cost: "{1}",
  cmc: 1,
  type_line: "Artifact",
  oracle_text: "{T}: Add {C}{C}.",
  color_identity: [],
});

setupMsw(
  http.get("/api/cache/search", ({ request }) => {
    const query = new URL(request.url).searchParams.get("query") ?? "";
    const data =
      query === SOL_RING_QUERY
        ? { object: "list", total_cards: 1, has_more: false, data: [SOL_RING] }
        : EMPTY_SEARCH_RESPONSE;
    return HttpResponse.json({ hit: true, data });
  }),
  // The name search asks whether plain-language search is on; quick add does not need it.
  http.get("/api/search/translate", () =>
    HttpResponse.json({ available: false })
  )
);

/** Opens the browser-only guest deck the way the app router mounts it. */
async function openGuestDeck() {
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
      <PathParamsContext.Provider
        value={{ locale: "en", deckId: GUEST_DECK_ID }}
      >
        <BuilderPage />
      </PathParamsContext.Provider>
    </AppRouterContext.Provider>,
    { session: null }
  );
  await screen.findByRole("heading", { level: 1, name: "Guest Deck" });
  return userEvent.setup();
}

/** Types "Sol Ring" in the open palette, waits for its row, and adds it with Enter. */
async function addSolRing(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole("combobox", { name: "Quick add" }),
    "Sol Ring"
  );
  expect(
    await screen.findByText(`Query: ${SOL_RING_QUERY}`)
  ).toBeInTheDocument();
  await screen.findByRole("button", { name: /Sol Ring/ });
  await user.keyboard("{Enter}");
}

/** The main-deck rows of the guest deck, as name and quantity. */
function mainDeck(): readonly (readonly [string, number])[] {
  const deck = useDeckStore.getState().decks[GUEST_DECK_ID];
  return (deck?.cards ?? [])
    .filter((card) => card.zone === "main")
    .map((card) => [card.name, card.quantity]);
}

beforeEach(() => {
  localStorage.clear();
  useDeckStore.setState(useDeckStore.getInitialState(), true);
  useUIStore.setState(useUIStore.getInitialState(), true);
  // jsdom does not implement scrollTo; framer-motion calls it while measuring the panels' entry.
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("quick add on the builder page", () => {
  it("opens with Ctrl+K and adds Sol Ring to the main deck, staying open", async () => {
    const user = await openGuestDeck();

    await user.keyboard("{Control>}k{/Control}");
    await addSolRing(user);

    await waitFor(() => expect(mainDeck()).toEqual([["Sol Ring", 1]]));
    expect(
      screen.getByRole("dialog", { name: "Quick add" })
    ).toBeInTheDocument();
  });

  it("opens from the toolbar's Quick add button and adds Sol Ring to the main deck", async () => {
    const user = await openGuestDeck();

    await user.click(screen.getByRole("button", { name: "Quick add" }));
    await addSolRing(user);

    await waitFor(() => expect(mainDeck()).toEqual([["Sol Ring", 1]]));
  });
});
