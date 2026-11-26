/**
 * Creating a deck from the `/decks` page, empty or as a copy of a deck,
 * driven as a player would.
 *
 * The real deck store and deck API client run; MSW serves `POST /api/decks`
 * and `POST /api/decks/:id/duplicate` and records what the page sent
 * (`setupMsw`). The page's chrome (header, footer, deck views, wizard) is
 * replaced, as it was before this file moved off its deck store mock; the
 * deck card's stand-in keeps only its duplicate button, wired as the real
 * card wires it.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useToastStore } from "@/hooks/useToast";
import { useDeckStore } from "@/lib/deck/store";
import { logger } from "@/lib/logger";
import { emptyApiDeck } from "@/test/in-memory-deck-api";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";

const push = vi.hoisted(() => vi.fn());
// What `useSession` answers: a guest creates decks, a signed-in player sees theirs.
const session = vi.hoisted(() => {
  const state: { status: "authenticated" | "unauthenticated" } = {
    status: "unauthenticated",
  };
  return state;
});

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: session.status }),
}));
vi.mock(import("next/navigation"), () => ({
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));
vi.mock(import("@/components/layout/Header"), () => ({ Header: () => <></> }));
vi.mock(import("@/components/layout/Footer"), () => ({ Footer: () => <></> }));
vi.mock(import("@/components/deck/DeckWizard"), () => ({
  DeckWizard: () => <></>,
}));
vi.mock(import("@/components/deck/DecksHomeControls"), () => ({
  DecksHomeControls: () => <></>,
}));
vi.mock(import("@/components/deck/DeckFolderControls"), () => ({
  DeckFolderControls: () => <></>,
}));
vi.mock(import("@/components/deck/DeckComparisonPanel"), () => ({
  DeckComparisonPanel: () => null,
}));
vi.mock(import("@/components/deck/HomeDeckCard"), () => ({
  HomeDeckCard: ({ deck, onDuplicate, duplicatingId }) => (
    <button
      type="button"
      disabled={duplicatingId === deck.id}
      onClick={(event) => onDuplicate(event, deck.id)}
    >
      {`Duplicate ${deck.name}`}
    </button>
  ),
}));
vi.mock(import("@/components/deck/DeckListTable"), () => ({
  DeckListTable: () => <></>,
}));
vi.mock(import("@/components/deck/DeckListRefreshNotice"), () => ({
  DeckListRefreshNotice: () => <></>,
}));
vi.mock(import("@/components/deck/GuestDeckClaimOffer"), () => ({
  GuestDeckClaimOffer: () => null,
}));

import DecksPage from "./page";

const NEW_DECK_ID = "deck-1";

/** The JSON bodies `POST /api/decks` received, in order. */
let creations: unknown[] = [];

/** The format a creation asked for; the route stores Commander when none is sent. */
function requestedFormat(body: unknown): string {
  if (typeof body !== "object" || body === null || !("format" in body)) {
    return "commander";
  }
  return typeof body.format === "string" ? body.format : "commander";
}

const server = setupMsw(
  http.post("/api/decks", async ({ request }) => {
    const body: unknown = await request.json();
    creations.push(body);
    return HttpResponse.json(
      { ...emptyApiDeck(NEW_DECK_ID), format: requestedFormat(body) },
      { status: 201 }
    );
  })
);

beforeEach(() => {
  creations = [];
  useToastStore.setState({ toasts: [] });
});

afterEach(() => {
  push.mockClear();
  session.status = "unauthenticated";
  useDeckStore.setState({ decks: {}, activeDeckId: null });
});

/** The text of every toast on screen, in order. */
function toastTexts(): readonly string[] {
  return useToastStore
    .getState()
    .toasts.map((toast) =>
      typeof toast.message === "string" ? toast.message : toast.message.key
    );
}

/** Answers the next `POST /api/decks` with `status` and the route's `error` text. */
function refuseCreation(status: number, error: string): void {
  server.use(
    http.post("/api/decks", () => HttpResponse.json({ error }, { status }))
  );
}

// The numbered default name was the English template `New Deck ${n}`, stored
// as the deck's name whatever language its creator used.
it("names a new deck in the creator's locale", async () => {
  renderWithProviders(<DecksPage />, { locale: "fr" });

  fireEvent.click(screen.getByRole("button", { name: "Créer un deck" }));

  await waitFor(() =>
    expect(creations).toEqual([
      expect.objectContaining({ name: "Nouveau deck 1" }),
    ])
  );
});

it("creates a Commander deck when the player keeps the default format", async () => {
  const user = userEvent.setup();
  renderWithProviders(<DecksPage />);

  expect(
    screen.getByRole("combobox", { name: "New deck format" })
  ).toHaveDisplayValue("Commander");
  await user.click(screen.getByRole("button", { name: "Create Deck" }));

  await waitFor(() =>
    expect(creations).toEqual([{ name: "New Deck 1", format: "commander" }])
  );
});

it("creates a Brawl deck when the player picks Brawl", async () => {
  const user = userEvent.setup();
  renderWithProviders(<DecksPage />);

  await user.selectOptions(
    screen.getByRole("combobox", { name: "New deck format" }),
    "Brawl"
  );
  await user.click(screen.getByRole("button", { name: "Create Deck" }));

  await waitFor(() =>
    expect(push).toHaveBeenCalledWith(`/builder/${NEW_DECK_ID}`)
  );
  expect(creations).toEqual([{ name: "New Deck 1", format: "brawl" }]);
  expect(useDeckStore.getState().decks[NEW_DECK_ID]?.format).toBe("brawl");
});

/*
 * A failed creation used to put the client's diagnostic text in the toast:
 * "Impossible de créer le deck — [createDeck] HTTP 500: Failed to create
 * deck". The player now reads a sentence in their language; the raw error
 * stays in the log (I-01).
 */
describe("a deck creation that fails", () => {
  it("says so in French, with no HTTP status, when the server fails", async () => {
    refuseCreation(500, "Failed to create deck");
    renderWithProviders(<DecksPage />, { locale: "fr" });

    fireEvent.click(screen.getByRole("button", { name: "Créer un deck" }));

    await waitFor(() =>
      expect(toastTexts()).toEqual(["Impossible de créer le deck. Réessayez."])
    );
    expect(toastTexts().join(" ")).not.toContain("HTTP 500");
    expect(push).not.toHaveBeenCalled();
  });

  it("keeps the raw error in the log for diagnostics", async () => {
    const logError = vi
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);
    refuseCreation(500, "Failed to create deck");
    renderWithProviders(<DecksPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create Deck" }));

    await waitFor(() =>
      expect(logError).toHaveBeenCalledWith(
        "Unexpected error",
        "handleNewDeck",
        expect.objectContaining({
          message: "[createDeck] HTTP 500: Failed to create deck",
        })
      )
    );
    logError.mockRestore();
  });

  it("says so in English, without the browser's text, when the network fails", async () => {
    server.use(http.post("/api/decks", () => HttpResponse.error()));
    renderWithProviders(<DecksPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create Deck" }));

    await waitFor(() =>
      expect(toastTexts()).toEqual([
        "Could not create the deck. Please try again.",
      ])
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("asks the player to sign in again when the session has ended", async () => {
    refuseCreation(401, "Unauthorized");
    renderWithProviders(<DecksPage />, { locale: "fr" });

    fireEvent.click(screen.getByRole("button", { name: "Créer un deck" }));

    await waitFor(() =>
      expect(toastTexts()).toEqual([
        "Votre session a expiré. Reconnectez-vous pour créer un deck.",
      ])
    );
  });

  it("lets the player try again once the server answers", async () => {
    refuseCreation(500, "Failed to create deck");
    const user = userEvent.setup();
    renderWithProviders(<DecksPage />);
    const create = screen.getByRole("button", { name: "Create Deck" });

    await user.click(create);
    await waitFor(() => expect(toastTexts()).toHaveLength(1));
    server.resetHandlers();
    await user.click(create);

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(`/builder/${NEW_DECK_ID}`)
    );
  });
});

/*
 * A failed duplicate only reached `logger.error`: the spinner stopped and the
 * player was told nothing. The store's own `fetch` also threw a bare "Failed
 * to duplicate deck", so a 401 read like a 500 (I-01).
 */
describe("duplicating a deck", () => {
  const ORIGINAL = emptyApiDeck("deck-goblins", "Goblins");

  /** Answers the next `POST /api/decks/:id/duplicate` with `status` and the route's `error` text. */
  function refuseDuplication(status: number, error: string): void {
    server.use(
      http.post("/api/decks/:id/duplicate", () =>
        HttpResponse.json({ error }, { status })
      )
    );
  }

  /** Opens the page as the signed-in owner of {@link ORIGINAL} and returns its duplicate button. */
  async function openLibrary(locale: "en" | "fr" = "en"): Promise<HTMLElement> {
    renderWithProviders(<DecksPage />, { locale });
    return screen.findByRole("button", { name: `Duplicate ${ORIGINAL.name}` });
  }

  /** How many times the page read the deck list. */
  let listings = 0;

  beforeEach(() => {
    session.status = "authenticated";
    listings = 0;
    server.use(
      http.get("/api/decks", () => {
        listings += 1;
        return HttpResponse.json({
          decks: [ORIGINAL],
          total: 1,
          page: 0,
          limit: 20,
        });
      })
    );
  });

  it("says so in French, with no HTTP status, and stops the spinner when the server fails", async () => {
    refuseDuplication(500, "Failed to duplicate deck");
    const duplicate = await openLibrary("fr");

    fireEvent.click(duplicate);

    await waitFor(() =>
      expect(toastTexts()).toEqual([
        "Impossible de dupliquer le deck. Réessayez.",
      ])
    );
    expect(toastTexts().join(" ")).not.toContain("HTTP 500");
    // The toast is raised before the page clears its spinner, so wait for it.
    await waitFor(() => expect(duplicate).toBeEnabled());
    expect(push).not.toHaveBeenCalled();
  });

  it("keeps the raw error, with its status, in the log for diagnostics", async () => {
    const logError = vi
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);
    refuseDuplication(500, "Failed to duplicate deck");
    fireEvent.click(await openLibrary());

    await waitFor(() =>
      expect(logError).toHaveBeenCalledWith(
        "Unexpected error",
        "duplicateDeck",
        expect.objectContaining({
          message: "[duplicateDeck] HTTP 500: Failed to duplicate deck",
        })
      )
    );
    logError.mockRestore();
  });

  it("says so in English, without the browser's text, when the network fails", async () => {
    server.use(
      http.post("/api/decks/:id/duplicate", () => HttpResponse.error())
    );
    const duplicate = await openLibrary();

    fireEvent.click(duplicate);

    await waitFor(() =>
      expect(toastTexts()).toEqual([
        "Could not duplicate the deck. Please try again.",
      ])
    );
    // The toast is raised before the page clears its spinner, so wait for it.
    await waitFor(() => expect(duplicate).toBeEnabled());
    expect(push).not.toHaveBeenCalled();
  });

  it("asks the player to sign in again when the session has ended", async () => {
    refuseDuplication(401, "Unauthorized");
    fireEvent.click(await openLibrary("fr"));

    await waitFor(() =>
      expect(toastTexts()).toEqual([
        "Votre session a expiré. Reconnectez-vous pour dupliquer un deck.",
      ])
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("says the deck no longer exists when the server has no such deck", async () => {
    refuseDuplication(404, "Deck not found");
    fireEvent.click(await openLibrary("fr"));

    await waitFor(() =>
      expect(toastTexts()).toEqual([
        "Ce deck n’existe plus : impossible de le dupliquer.",
      ])
    );
    expect(push).not.toHaveBeenCalled();
  });

  // The toast said the deck was gone while the list still offered it, with
  // its Duplicate, Open and Delete (I-01).
  it("takes the deck off the list when the server says it no longer exists", async () => {
    refuseDuplication(404, "Deck not found");
    const duplicate = await openLibrary();
    server.use(
      http.get("/api/decks", () =>
        HttpResponse.json({ decks: [], total: 0, page: 0, limit: 20 })
      )
    );

    fireEvent.click(duplicate);

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: `Duplicate ${ORIGINAL.name}` })
      ).not.toBeInTheDocument()
    );
    expect(toastTexts()).toEqual([
      "This deck no longer exists, so it cannot be duplicated.",
    ]);
    expect(push).not.toHaveBeenCalled();
  });

  it("keeps the list as it is, without reading it again, when the server fails", async () => {
    refuseDuplication(500, "Failed to duplicate deck");
    const duplicate = await openLibrary();
    const listingsBefore = listings;

    fireEvent.click(duplicate);

    await waitFor(() =>
      expect(toastTexts()).toEqual([
        "Could not duplicate the deck. Please try again.",
      ])
    );
    // The toast is raised before the page clears its spinner, so wait for it.
    await waitFor(() => expect(duplicate).toBeEnabled());
    expect(listings).toBe(listingsBefore);
    expect(duplicate).toBeInTheDocument();
  });

  it("announces the copy by name in French and opens it in the builder", async () => {
    const copy = emptyApiDeck("deck-goblins-copy", "Goblins (Copy)");
    server.use(
      http.post("/api/decks/:id/duplicate", () =>
        HttpResponse.json(copy, { status: 201 })
      )
    );
    fireEvent.click(await openLibrary("fr"));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(`/builder/${copy.id}`)
    );
    expect(toastTexts()).toEqual(["Deck dupliqué : « Goblins (Copy) »"]);
  });
});

/*
 * The server named every copy `${name} (Copy)`, so a French player's library
 * listed « Atraxa (Copy) ». The page now names the copy in the player's
 * language and sends that name; the route keeps it (I-04).
 */
describe("naming the copy of a deck", () => {
  const ATRAXA = emptyApiDeck("deck-atraxa", "Atraxa");

  /** The JSON bodies `POST /api/decks/:id/duplicate` received, in order; `null` for none. */
  let duplications: unknown[] = [];

  /**
   * Lists `original` as the player's one deck, and answers its duplicate as
   * the route names a copy: the name the request sent, or the original's name
   * followed by " (Copy)" when it sent none.
   */
  function serveLibraryOf(original: typeof ATRAXA): void {
    server.use(
      http.get("/api/decks", () =>
        HttpResponse.json({ decks: [original], total: 1, page: 0, limit: 20 })
      ),
      http.post("/api/decks/:id/duplicate", async ({ request }) => {
        const text = await request.text();
        const body: unknown = text === "" ? null : JSON.parse(text);
        duplications.push(body);
        const name = sentName(body) ?? `${original.name} (Copy)`;
        return HttpResponse.json(emptyApiDeck("deck-copy", name), {
          status: 201,
        });
      })
    );
  }

  /** The `name` a duplicate request sent, if it sent one. */
  function sentName(body: unknown): string | undefined {
    if (typeof body !== "object" || body === null || !("name" in body)) {
      return undefined;
    }
    return typeof body.name === "string" ? body.name : undefined;
  }

  /** Opens the library under `locale` and duplicates the one deck it lists. */
  async function duplicateTheDeck(
    original: typeof ATRAXA,
    locale: "en" | "fr"
  ): Promise<void> {
    renderWithProviders(<DecksPage />, { locale });
    fireEvent.click(
      await screen.findByRole("button", { name: `Duplicate ${original.name}` })
    );
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/builder/deck-copy")
    );
  }

  beforeEach(() => {
    session.status = "authenticated";
    duplications = [];
  });

  it("names the copy « Atraxa (copie) » for a player using French", async () => {
    serveLibraryOf(ATRAXA);

    await duplicateTheDeck(ATRAXA, "fr");

    expect(duplications).toEqual([{ name: "Atraxa (copie)" }]);
    expect(toastTexts()).toEqual(["Deck dupliqué : « Atraxa (copie) »"]);
  });

  it("names the copy « Atraxa (Copy) » for a player using English", async () => {
    serveLibraryOf(ATRAXA);

    await duplicateTheDeck(ATRAXA, "en");

    expect(duplications).toEqual([{ name: "Atraxa (Copy)" }]);
    expect(toastTexts()).toEqual(["Deck duplicated: “Atraxa (Copy)”"]);
  });

  // A rename accepts 200 characters at most, and so does the copy's name.
  it("shortens a long deck name so the copy's name fits the deck-name limit", async () => {
    const longest = emptyApiDeck("deck-long", "a".repeat(200));
    serveLibraryOf(longest);

    await duplicateTheDeck(longest, "fr");

    expect(duplications).toEqual([{ name: `${"a".repeat(192)} (copie)` }]);
  });
});
