/**
 * Deleting the open deck from the builder page (I-01): after a confirmed delete the page goes
 * to the library, and never shows "Deck not found" for the deck it just deleted.
 *
 * Sociable: the page, the delete button, the real deck store and the real deck client, answered
 * by the in-memory deck API through `deckApiHandlers`. MSW serves the page's other routes with
 * empty answers. Next's app-router contexts carry the route params and the router, so the real
 * `@/i18n/navigation` runs and the test reads the path the player is sent to. No module is mocked.
 */
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { Session } from "next-auth";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { useDeckStore } from "@/lib/deck/store";
import { EMPTY_SEARCH_RESPONSE } from "@/lib/scryfall/types";
import { useUIStore } from "@/lib/ui/store";
import { deckApiHandlers } from "@/test/fake-deck-client";
import {
  createInMemoryDeckApi,
  DeckApiRefusal,
  emptyApiDeck,
} from "@/test/in-memory-deck-api";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { recordToasts } from "@/test/toast-recorder";
import BuilderPage from "./page";

const DECK_ID = "atraxa";
const DECK_NAME = "Atraxa Superfriends";

/** A signed-in player who owns the deck under test. */
const PLAYER: Session = {
  user: { id: "player-1", name: "Kael" },
  expires: "2099-01-01T00:00:00.000Z",
};

const api = createInMemoryDeckApi();
const toasts = recordToasts();

setupMsw(
  ...deckApiHandlers(api),
  // Game Changers, banlist and the search panel read the shared Scryfall cache; empty lists will do.
  http.get("/api/cache/search", () =>
    HttpResponse.json({ hit: true, data: EMPTY_SEARCH_RESPONSE })
  ),
  http.get("/api/search/translate", () =>
    HttpResponse.json({ available: false })
  ),
  http.get("/api/meta/:slug/history", () =>
    HttpResponse.json({ report: null, snapshotCount: 0, windowDays: 90 })
  )
);

/**
 * Starts recording whether `text` is ever added to the page, so a state that shows for one render
 * only is still caught.
 *
 * @returns reads whether the text has appeared since the call
 */
function watchForText(text: string): () => boolean {
  let seen = false;
  const note = (records: readonly MutationRecord[]): void => {
    seen ||= records.some((record) =>
      Array.from(record.addedNodes).some((node) =>
        (node.textContent ?? "").includes(text)
      )
    );
  };
  const observer = new MutationObserver(note);
  observer.observe(document.body, { childList: true, subtree: true });
  onTestFinished(() => observer.disconnect());
  return () => {
    note(observer.takeRecords());
    return seen;
  };
}

/** Opens Atraxa Superfriends at `/builder/atraxa` and waits for its title bar. */
async function openAtraxa(): Promise<{
  readonly push: (href: string) => void;
}> {
  const push = vi.fn<(href: string) => void>();
  const router = {
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push,
    replace: vi.fn(),
    prefetch: vi.fn(),
  };
  renderWithProviders(
    <AppRouterContext.Provider value={router}>
      <PathParamsContext.Provider value={{ locale: "en", deckId: DECK_ID }}>
        <BuilderPage />
      </PathParamsContext.Provider>
    </AppRouterContext.Provider>,
    { session: PLAYER }
  );
  await screen.findByRole("heading", { level: 1, name: DECK_NAME });
  return { push };
}

/** Presses the title bar's "Delete deck" and confirms in the dialog it opens. */
async function confirmDelete(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Delete deck" }));
  const dialog = await screen.findByRole("dialog", {
    name: `Delete ${DECK_NAME}?`,
  });
  await user.click(within(dialog).getByRole("button", { name: "Delete deck" }));
  return dialog;
}

beforeEach(() => {
  api.reset();
  api.seedDeck(emptyApiDeck(DECK_ID, DECK_NAME));
  toasts.mockClear();
  localStorage.clear();
  useDeckStore.setState(useDeckStore.getInitialState(), true);
  useUIStore.setState(useUIStore.getInitialState(), true);
  // jsdom does not implement scrollTo; framer-motion calls it while measuring the panels' entry.
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  onTestFinished(() => {
    vi.restoreAllMocks();
  });
});

describe("builder page: deleting the open deck", () => {
  it("goes to the library with the 'was deleted' message and never shows 'Deck not found'", async () => {
    const user = userEvent.setup();
    const { push } = await openAtraxa();
    const deckNotFoundShown = watchForText("Deck not found");

    await confirmDelete(user);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/decks"));
    expect(deckNotFoundShown()).toBe(false);
    expect(
      screen.getByText("Deck deleted. Opening your decks…")
    ).toHaveAttribute("aria-busy", "true");
    expect(api.savedDeck(DECK_ID)).toBeUndefined();
    expect(toasts).toHaveBeenCalledWith("success", `${DECK_NAME} was deleted`);
    // The deck was fetched once, to open it; nothing asks for it after the delete.
    expect(api.fetchDeck).toHaveBeenCalledTimes(1);
  });

  it("keeps the deck open with the dialog's message when the server refuses the delete", async () => {
    api.deleteDeck.mockRejectedValueOnce(new DeckApiRefusal(403, "Forbidden"));
    const user = userEvent.setup();
    const { push } = await openAtraxa();

    const dialog = await confirmDelete(user);

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "The deck could not be deleted. Try again."
    );
    // The open dialog hides the page from the accessibility tree; closing it shows the deck again.
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(
      screen.getByRole("heading", { level: 1, name: DECK_NAME })
    ).toBeInTheDocument();
    expect(api.savedDeck(DECK_ID)?.name).toBe(DECK_NAME);
    expect(push).not.toHaveBeenCalled();
  });

  it("still says 'Deck not found' when the deck goes away after a refused delete, as another tab's delete does", async () => {
    api.deleteDeck.mockRejectedValueOnce(new DeckApiRefusal(403, "Forbidden"));
    const user = userEvent.setup();
    await openAtraxa();
    const dialog = await confirmDelete(user);
    await within(dialog).findByRole("alert");

    act(() => {
      useDeckStore.setState({ decks: {}, activeDeckId: null });
    });

    expect(await screen.findByText("Deck not found")).toBeInTheDocument();
  });
});
