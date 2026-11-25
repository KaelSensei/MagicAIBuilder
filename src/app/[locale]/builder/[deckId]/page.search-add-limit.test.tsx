/**
 * An add from the search panel at the card's copy limit (I-37): the player clicks a result's
 * add button or drags the result onto the deck, and the editor says why nothing was added,
 * with the message and the toast a dropped or pasted card at its limit already shows (#1871).
 *
 * Sociable: the page, the search panel, the deck store and the UI store are real. The guest
 * deck lives in the browser only, so the deck API is never called; MSW serves the shared
 * Scryfall search cache. The toast store's `add` is recorded, not mocked
 * (`@/test/toast-recorder`). The one module seam is `@/i18n/navigation`, for the reason
 * `page.test.tsx`'s header gives.
 *
 * jsdom lays nothing out, so every element measures 0 × 0 and dnd-kit finds no drop target.
 * The drag test gives the dragged result and the Main zone tab the same square, so the drop
 * lands on that tab and nowhere else.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import { GUEST_DECK_ID, saveGuestDeck } from "@/lib/deck/guest-deck";
import { useDeckStore } from "@/lib/deck/store";
import { EMPTY_SEARCH_RESPONSE } from "@/lib/scryfall/types";
import { useUIStore } from "@/lib/ui/store";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import { aScryfallCard } from "@/test/builders/scryfall";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { recordToasts } from "@/test/toast-recorder";
import BuilderPage from "./page";

// eslint-disable-next-line no-restricted-syntax -- the one seam left; page.test.tsx's header says why and what removes it
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

/** How long the debounced search may take to list its first result under a loaded run. */
const SEARCH_ROW_WAIT_MS = 10_000;

/** Vitest's 5-second default is shorter than one {@link SEARCH_ROW_WAIT_MS} wait. */
const SEARCH_TEST_TIMEOUT_MS = 30_000;

const ARCANE_SIGNET_TEXT =
  "{T}: Add one mana of any color in your commander's color identity.";

/** Not a Game Changer, so a successful add raises no bracket warning of its own. */
const ARCANE_SIGNET = aScryfallCard({
  name: "Arcane Signet",
  mana_cost: "{2}",
  cmc: 2,
  type_line: "Artifact",
  oracle_text: ARCANE_SIGNET_TEXT,
  color_identity: [],
});

/** The message #1871 shows for a dropped card at its limit, for Arcane Signet in Commander. */
const ARCANE_SIGNET_AT_LIMIT =
  "Arcane Signet is already at its copy limit for Commander. Nothing was added.";

/** The one Arcane Signet a Commander deck may hold (CR 903.5b), already in the main deck. */
const ARCANE_SIGNET_ROW: DeckCard = aDeckCard({
  id: "arcane-signet-row",
  name: "Arcane Signet",
  manaCost: "{2}",
  cmc: 2,
  typeLine: "Artifact",
  oracleText: ARCANE_SIGNET_TEXT,
  category: "ramp",
});

const toasts = recordToasts();

setupMsw(
  // The card search lists Arcane Signet, so the panel shows it before anything is typed. The
  // page's Game Changer list (`is:gamechanger`) stays empty.
  http.get("/api/cache/search", ({ request }) => {
    const query = new URL(request.url).searchParams.get("query") ?? "";
    const data = query.includes("is:gamechanger")
      ? EMPTY_SEARCH_RESPONSE
      : { ...EMPTY_SEARCH_RESPONSE, total_cards: 1, data: [ARCANE_SIGNET] };
    return HttpResponse.json({ hit: true, data });
  }),
  http.get("/api/search/translate", () =>
    HttpResponse.json({ available: false })
  ),
  http.get("/api/meta/:slug/history", () =>
    HttpResponse.json({ report: null, snapshotCount: 0, windowDays: 90 })
  )
);

/** Stores a Commander guest deck in this browser with the given main-deck rows. */
function storeGuestDeck(cards: readonly DeckCard[]): void {
  saveGuestDeck(
    aDeck({ id: GUEST_DECK_ID, name: "Guest Deck", cards: [...cards] })
  );
}

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

/** Arcane Signet's copies in the guest deck's main deck. */
function arcaneSignetCopies(): number {
  const deck = useDeckStore.getState().decks[GUEST_DECK_ID];
  return (deck?.cards ?? [])
    .filter((card) => card.name === "Arcane Signet" && card.zone === "main")
    .reduce((total, card) => total + card.quantity, 0);
}

/** The square the dragged result and its drop target share in the drag test. */
const SHARED_SQUARE = {
  x: 0,
  y: 0,
  top: 0,
  left: 0,
  right: 100,
  bottom: 100,
  width: 100,
  height: 100,
  toJSON: () => ({}),
};

/** What jsdom measures for every other element. */
const NOTHING = { ...SHARED_SQUARE, right: 0, bottom: 0, width: 0, height: 0 };

/**
 * Whether the element is the Arcane Signet result's drag handle, the drag overlay that follows
 * it (dnd-kit collides with the overlay's rectangle), or the Main zone tab.
 */
function isOnTheSharedSquare(element: Element): boolean {
  const name = element.getAttribute("aria-label") ?? "";
  return (
    name === "Arcane Signet" ||
    element.textContent === "Arcane Signet" ||
    name.startsWith("Main (")
  );
}

/**
 * Lays the dragged Arcane Signet and the Main zone tab out on one square; everything else stays
 * 0 × 0. Call it before the page renders: the page measures its drop targets before a drag
 * starts (`MeasuringStrategy.BeforeDragging`), not during it.
 */
function layOutDragAndDropTarget(): void {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function measure(this: Element) {
      return isOnTheSharedSquare(this) ? SHARED_SQUARE : NOTHING;
    }
  );
}

/**
 * Drags the Arcane Signet result onto the Main zone tab with the keyboard, as dnd-kit allows,
 * and drops it once dnd-kit announces the tab under it.
 */
async function dragArcaneSignetOntoMain(
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  const handle = (
    await screen.findAllByRole(
      "button",
      { name: "Arcane Signet" },
      { timeout: SEARCH_ROW_WAIT_MS }
    )
  ).find((element) => element.tagName !== "BUTTON");
  if (!(handle instanceof HTMLElement)) {
    throw new Error("No drag handle for Arcane Signet");
  }
  handle.focus();
  await user.keyboard("[Space]");
  expect(
    await screen.findByText(/was moved over droppable area deck-zone-tab-main/)
  ).toBeInTheDocument();
  await user.keyboard("[Space]");
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  useDeckStore.setState(useDeckStore.getInitialState(), true);
  useUIStore.setState(useUIStore.getInitialState(), true);
  // jsdom does not implement scrollTo; framer-motion calls it while measuring the panels' entry.
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("adding a search result at its copy limit", () => {
  it(
    "says the card is at its copy limit when its add button adds nothing",
    async () => {
      storeGuestDeck([ARCANE_SIGNET_ROW]);
      const user = await openGuestDeck();

      await user.click(
        await screen.findByRole(
          "button",
          { name: "Add Arcane Signet to the main deck" },
          { timeout: SEARCH_ROW_WAIT_MS }
        )
      );

      await waitFor(() =>
        expect(toasts).toHaveBeenCalledWith("info", ARCANE_SIGNET_AT_LIMIT)
      );
      expect(arcaneSignetCopies()).toBe(1);
    },
    SEARCH_TEST_TIMEOUT_MS
  );

  it(
    "says the card is at its copy limit when it is dragged onto the deck",
    async () => {
      storeGuestDeck([ARCANE_SIGNET_ROW]);
      layOutDragAndDropTarget();
      const user = await openGuestDeck();

      await dragArcaneSignetOntoMain(user);

      await waitFor(() =>
        expect(toasts).toHaveBeenCalledWith("info", ARCANE_SIGNET_AT_LIMIT)
      );
      expect(arcaneSignetCopies()).toBe(1);
    },
    SEARCH_TEST_TIMEOUT_MS
  );

  it(
    "adds a card below its limit and shows no message",
    async () => {
      storeGuestDeck([]);
      const user = await openGuestDeck();

      await user.click(
        await screen.findByRole(
          "button",
          { name: "Add Arcane Signet to the main deck" },
          { timeout: SEARCH_ROW_WAIT_MS }
        )
      );

      await waitFor(() => expect(arcaneSignetCopies()).toBe(1));
      expect(toasts).not.toHaveBeenCalled();
    },
    SEARCH_TEST_TIMEOUT_MS
  );

  it(
    "adds a card dragged onto the deck below its limit and shows no message",
    async () => {
      storeGuestDeck([]);
      layOutDragAndDropTarget();
      const user = await openGuestDeck();

      await dragArcaneSignetOntoMain(user);

      await waitFor(() => expect(arcaneSignetCopies()).toBe(1));
      expect(toasts).not.toHaveBeenCalled();
    },
    SEARCH_TEST_TIMEOUT_MS
  );
});
