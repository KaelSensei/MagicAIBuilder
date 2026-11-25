/**
 * Creating a deck from the `/decks` page, driven as a player would.
 *
 * The real deck store and deck API client run; MSW serves `POST /api/decks`
 * and records what the page sent (`setupMsw`). The page's chrome (header,
 * footer, deck views, wizard) is replaced, as it was before this file moved
 * off its deck store mock.
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

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "unauthenticated" }),
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
  HomeDeckCard: () => <></>,
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
