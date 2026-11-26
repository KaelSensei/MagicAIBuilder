/**
 * The `/decks` page of a signed-in player who has no deck yet, driven as a
 * player would.
 *
 * The empty library offered one button, "Create Deck". It now offers the
 * three ways to start a deck that the toolbar and the header already offer: a
 * new deck, an import and the deck wizard (I-13 AC-13-05, design audit S11).
 *
 * The real page, header, deck wizard, import dialog, deck store and deck API
 * client run; MSW serves the deck list, the folders and `POST /api/decks`, and
 * records each creation. Only the framework's router is replaced, as in
 * `page.delete-deck.test.tsx`.
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useToastStore } from "@/hooks/useToast";
import { useDeckStore } from "@/lib/deck/store";
import { emptyApiDeck } from "@/test/in-memory-deck-api";
import { setupMsw } from "@/test/msw";
import { renderWithProviders, type TestLocale } from "@/test/render";

// next-intl's router builds on these exports; only the router itself is replaced.
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
}));

import DecksPage from "./page";

const PLAYER = {
  user: { id: "player-1", name: "Kael" },
  expires: "2099-01-01T00:00:00.000Z",
};

const NEW_DECK_ID = "deck-imported";

/** The JSON bodies `POST /api/decks` received, in order. */
let creations: unknown[] = [];

const server = setupMsw(
  http.get("/api/decks", () =>
    HttpResponse.json({ decks: [], total: 0, page: 0, limit: 20 })
  ),
  http.get("/api/deck-folders", () => HttpResponse.json({ folders: [] })),
  http.post("/api/decks", async ({ request }) => {
    const body: unknown = await request.json();
    creations.push(body);
    return HttpResponse.json(emptyApiDeck(NEW_DECK_ID), { status: 201 });
  })
);

// The store is reset before each test, not after: resetting it while the page
// is still mounted would re-render the page and send requests after the test.
beforeEach(() => {
  creations = [];
  useToastStore.setState({ toasts: [] });
  useDeckStore.setState({ decks: {}, activeDeckId: null, undoStack: [] });
});

/** Opens the library of a signed-in player who has no deck yet. */
function openEmptyLibrary(locale: TestLocale = "en"): void {
  renderWithProviders(<DecksPage />, { locale, session: PLAYER });
}

/** The text of every toast on screen, in order. */
function toastTexts(): readonly string[] {
  return useToastStore
    .getState()
    .toasts.map((toast) =>
      typeof toast.message === "string" ? toast.message : toast.message.key
    );
}

/** The empty library's panel, named by its heading. */
function emptyLibrary(name = "Start building"): Promise<HTMLElement> {
  return screen.findByRole("region", { name });
}

/** The names of the panel's actions, in order. */
function actionsOf(panel: HTMLElement): readonly (string | null)[] {
  return within(panel)
    .getAllByRole("button")
    .map((action) => action.textContent);
}

it("offers a new deck, an import and the deck wizard", async () => {
  openEmptyLibrary();

  await screen.findByRole("heading", { name: "Start building" });
  expect(
    screen.getByRole("button", { name: "Import a decklist" })
  ).toBeEnabled();
  expect(actionsOf(await emptyLibrary())).toEqual([
    "Create Deck",
    "Import a decklist",
    "Build with AI",
  ]);
});

it("names its actions in French, as the toolbar and the import dialog do", async () => {
  openEmptyLibrary("fr");

  expect(actionsOf(await emptyLibrary("Commencez à construire"))).toEqual([
    "Créer un deck",
    "Importer une liste de deck",
    "Construire avec l’IA",
  ]);
});

it("opens the deck wizard from Build with AI", async () => {
  const user = userEvent.setup();
  openEmptyLibrary();

  await user.click(
    within(await emptyLibrary()).getByRole("button", { name: "Build with AI" })
  );

  expect(
    await screen.findByRole("dialog", { name: "AI Deck Builder" })
  ).toBeInTheDocument();
});

describe("Import a decklist", () => {
  it("creates a dated deck, opens it, and shows the header's import dialog on it", async () => {
    const user = userEvent.setup();
    openEmptyLibrary();

    await user.click(
      within(await emptyLibrary()).getByRole("button", {
        name: "Import a decklist",
      })
    );

    expect(
      await screen.findByRole("dialog", { name: "Import Decklist" })
    ).toBeInTheDocument();
    expect(creations).toEqual([
      expect.objectContaining({
        name: expect.stringMatching(/^Imported Deck — /),
      }),
    ]);
    expect(useDeckStore.getState().activeDeckId).toBe(NEW_DECK_ID);
  });

  // The panel leaves once the library holds the new deck, so focus goes back
  // to the header's "Import", the dialog's own trigger (I-13 AC-13-08). jsdom
  // applies no CSS, so this holds from `md` up only: below it that button is
  // hidden and focus falls to <body> (a follow-up).
  it("gives focus to the header's Import when the dialog closes", async () => {
    const user = userEvent.setup();
    openEmptyLibrary();
    await user.click(
      within(await emptyLibrary()).getByRole("button", {
        name: "Import a decklist",
      })
    );
    await screen.findByRole("dialog", { name: "Import Decklist" });

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Import" })).toHaveFocus()
    );
  });

  it("says so, opens no dialog, and can be pressed again when the deck cannot be created", async () => {
    server.use(
      http.post("/api/decks", () =>
        HttpResponse.json({ error: "Failed to create deck" }, { status: 500 })
      )
    );
    const user = userEvent.setup();
    openEmptyLibrary();
    const importDeck = within(await emptyLibrary()).getByRole("button", {
      name: "Import a decklist",
    });

    await user.click(importDeck);

    await waitFor(() =>
      expect(toastTexts()).toEqual([
        "Could not create the deck. Please try again.",
      ])
    );
    await waitFor(() => expect(importDeck).toBeEnabled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
