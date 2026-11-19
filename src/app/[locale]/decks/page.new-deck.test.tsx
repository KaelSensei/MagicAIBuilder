/**
 * Creating a deck from the `/decks` page, driven as a player would.
 *
 * The real deck store and deck API client run; MSW serves `POST /api/decks`
 * and records what the page sent (`setupMsw`). The page's chrome (header,
 * footer, deck views, wizard) is replaced, as it was before this file moved
 * off its deck store mock.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useDeckStore } from "@/lib/deck/store";
import { emptyApiDeck } from "@/test/in-memory-deck-api";
import { setupMsw } from "@/test/msw";
import { renderWithIntl } from "@/test/render-with-intl";

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
vi.mock("@/hooks/useToast", () => ({
  useToastStore: () => vi.fn(),
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

setupMsw(
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
});

afterEach(() => {
  push.mockClear();
  useDeckStore.setState({ decks: {}, activeDeckId: null });
});

// The numbered default name was the English template `New Deck ${n}`, stored
// as the deck's name whatever language its creator used.
it("names a new deck in the creator's locale", async () => {
  renderWithIntl(<DecksPage />, { locale: "fr" });

  fireEvent.click(screen.getByRole("button", { name: "Créer un deck" }));

  await waitFor(() =>
    expect(creations).toEqual([
      expect.objectContaining({ name: "Nouveau deck 1" }),
    ])
  );
});
