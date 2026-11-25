/**
 * Deleting a deck from the `/decks` page, driven as a player would.
 *
 * The real page, deck cards, deck store and deck API client run; MSW serves
 * `GET /api/decks` and `DELETE /api/decks/:id` and records each delete the
 * page sent (`setupMsw`). Only the framework's router is replaced; the
 * signed-in session comes from `renderWithProviders`. The browser's
 * confirmation dialog is stubbed: `true` confirms, `false` cancels.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import { useToastStore } from "@/hooks/useToast";
import { useDeckStore } from "@/lib/deck/store";
import { logger } from "@/lib/logger";
import { emptyApiDeck } from "@/test/in-memory-deck-api";
import { setupMsw } from "@/test/msw";
import { renderWithProviders, type TestLocale } from "@/test/render";

vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/decks",
  useSearchParams: () => new URLSearchParams(),
}));

import DecksPage from "./page";

const GOBLINS = emptyApiDeck("deck-goblins", "Goblins");

const PLAYER = {
  user: { id: "player-1", name: "Kael" },
  expires: "2099-01-01T00:00:00.000Z",
};

/** The deck ids `DELETE /api/decks/:id` received, in order. */
let deletions: string[] = [];

const server = setupMsw(
  http.get("/api/decks", () =>
    HttpResponse.json({ decks: [GOBLINS], total: 1, page: 0, limit: 20 })
  ),
  http.get("/api/deck-folders", () => HttpResponse.json({ folders: [] })),
  http.delete("/api/decks/:id", ({ params }) => {
    deletions.push(String(params.id));
    return HttpResponse.json({ success: true });
  })
);

// The store is reset before each test, not after: resetting it while the page
// is still mounted would re-render the page and send requests after the test.
beforeEach(() => {
  deletions = [];
  useToastStore.setState({ toasts: [] });
  useDeckStore.setState({ decks: {}, activeDeckId: null, undoStack: [] });
  vi.stubGlobal(
    "confirm",
    vi.fn(() => true)
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The text of every toast on screen, in order. */
function toastTexts(): readonly string[] {
  return useToastStore
    .getState()
    .toasts.map((toast) =>
      typeof toast.message === "string" ? toast.message : toast.message.key
    );
}

/** Answers the next `DELETE /api/decks/:id` with `status` and the route's `error` text. */
function refuseDeletion(status: number, error: string): void {
  server.use(
    http.delete("/api/decks/:id", ({ params }) => {
      deletions.push(String(params.id));
      return HttpResponse.json({ error }, { status });
    })
  );
}

/** Opens the library as the signed-in owner of {@link GOBLINS} and returns its delete button. */
async function openLibrary(locale: TestLocale = "en"): Promise<HTMLElement> {
  renderWithProviders(<DecksPage />, { locale, session: PLAYER });
  const name = locale === "fr" ? "Supprimer Goblins" : "Delete Goblins";
  return screen.findByRole("button", { name });
}

/*
 * A failed delete was an unhandled rejection: the spinner stopped, the deck
 * stayed, and the player was told nothing (I-01).
 */
describe("a deck delete that fails", () => {
  let logError: MockInstance<typeof logger.error>;

  beforeEach(() => {
    logError = vi.spyOn(logger, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    logError.mockRestore();
  });

  it("says so in French, keeps the deck listed and stops the spinner when the server fails", async () => {
    refuseDeletion(500, "Failed to delete deck");
    const user = userEvent.setup();
    const remove = await openLibrary("fr");

    await user.click(remove);

    await waitFor(() =>
      expect(toastTexts()).toEqual([
        "Impossible de supprimer le deck. Réessayez.",
      ])
    );
    expect(toastTexts().join(" ")).not.toContain("HTTP 500");
    // The toast is raised before the page clears its spinner, so wait for it.
    await waitFor(() => expect(remove).toBeEnabled());
    expect(remove).toBeInTheDocument();
    expect(useDeckStore.getState().decks[GOBLINS.id]).toBeDefined();
  });

  it("keeps the raw error, with its status, in the log once", async () => {
    refuseDeletion(500, "Failed to delete deck");
    const user = userEvent.setup();

    await user.click(await openLibrary());

    await waitFor(() => expect(toastTexts()).toHaveLength(1));
    expect(logError).toHaveBeenCalledOnce();
    expect(logError).toHaveBeenCalledWith(
      "Unexpected error",
      "deleteDeck",
      expect.objectContaining({
        message: "[deleteDeck] HTTP 500: Failed to delete deck",
      })
    );
  });

  it("says so in English, without the browser's text, when the network fails", async () => {
    server.use(http.delete("/api/decks/:id", () => HttpResponse.error()));
    const user = userEvent.setup();
    const remove = await openLibrary();

    await user.click(remove);

    await waitFor(() =>
      expect(toastTexts()).toEqual([
        "Could not delete the deck. Please try again.",
      ])
    );
    await waitFor(() => expect(remove).toBeEnabled());
    expect(useDeckStore.getState().decks[GOBLINS.id]).toBeDefined();
  });

  it("asks the player to sign in again when the session has ended", async () => {
    refuseDeletion(401, "Unauthorized");
    const user = userEvent.setup();
    const remove = await openLibrary("fr");

    await user.click(remove);

    await waitFor(() =>
      expect(toastTexts()).toEqual([
        "Votre session a expiré. Reconnectez-vous pour supprimer un deck.",
      ])
    );
    expect(remove).toBeInTheDocument();
  });

  it("reads as any other failure when the deck belongs to another account", async () => {
    refuseDeletion(403, "Forbidden");
    const user = userEvent.setup();
    const remove = await openLibrary();

    await user.click(remove);

    await waitFor(() =>
      expect(toastTexts()).toEqual([
        "Could not delete the deck. Please try again.",
      ])
    );
    expect(remove).toBeInTheDocument();
  });
});

describe("a deck delete that the player confirms", () => {
  it("takes the deck off the list and raises no toast", async () => {
    const user = userEvent.setup();
    const remove = await openLibrary();

    await user.click(remove);

    await waitFor(() => expect(remove).not.toBeInTheDocument());
    expect(deletions).toEqual([GOBLINS.id]);
    expect(useDeckStore.getState().decks[GOBLINS.id]).toBeUndefined();
    expect(toastTexts()).toEqual([]);
  });
});

/*
 * A deck deleted from another tab or device answered 404, which read as a
 * failure: the deck stayed listed though it no longer existed (I-01).
 */
describe("a deck already deleted elsewhere", () => {
  it("leaves the list, and the player is told it was already gone", async () => {
    refuseDeletion(404, "Deck not found");
    const user = userEvent.setup();
    const remove = await openLibrary("fr");

    await user.click(remove);

    await waitFor(() => expect(remove).not.toBeInTheDocument());
    expect(useDeckStore.getState().decks[GOBLINS.id]).toBeUndefined();
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({
        type: "info",
        message: "Ce deck avait déjà été supprimé.",
      }),
    ]);
  });
});

describe("a deck delete that the player cancels", () => {
  it("sends no request and keeps the deck listed", async () => {
    vi.stubGlobal(
      "confirm",
      vi.fn(() => false)
    );
    const user = userEvent.setup();
    const remove = await openLibrary();

    await user.click(remove);

    expect(deletions).toEqual([]);
    expect(remove).toBeInTheDocument();
    expect(toastTexts()).toEqual([]);
  });
});
