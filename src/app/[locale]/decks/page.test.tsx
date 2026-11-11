import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyDeck } from "@/lib/deck/store-factories";
import type { Deck } from "@/lib/deck/types";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

const loadDecks = vi.hoisted(() => vi.fn(async () => undefined));
const createDeck = vi.hoisted(() => vi.fn(async (_name: string) => "deck-new"));
const push = vi.hoisted(() => vi.fn());
// What `useSession` and `useDeckStore` answer; each test sets its own.
const session = vi.hoisted(() => {
  const state: { status: SessionStatus; update: () => Promise<null> } = {
    status: "unauthenticated",
    update: async () => null,
  };
  return state;
});
const deckStore = vi.hoisted(() => {
  const state: { decks: Record<string, Deck>; loadError: string | null } = {
    decks: {},
    loadError: null,
  };
  return state;
});

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: null,
    status: session.status,
    update: session.update,
  }),
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
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/lib/deck/store", () => ({
  useDeckStore: () => ({
    decks: deckStore.decks,
    createDeck,
    loadDecks,
    isSyncing: false,
    deleteDeck: vi.fn(),
    duplicateDeck: vi.fn(),
    loadError: deckStore.loadError,
  }),
}));
vi.mock("@/hooks/useToast", () => ({
  useToastStore: () => vi.fn(),
}));
vi.mock(import("@/components/layout/Header"), () => ({ Header: () => <></> }));
vi.mock(import("@/components/layout/Footer"), () => ({ Footer: () => <></> }));
vi.mock(import("@/components/deck/DeckWizard"), () => ({ DeckWizard: () => <></> }));
vi.mock(import("@/components/deck/DecksHomeControls"), () => ({ DecksHomeControls: () => <></> }));
vi.mock(import("@/components/deck/DeckFolderControls"), () => ({ DeckFolderControls: () => <></> }));
vi.mock(import("@/components/deck/DeckComparisonPanel"), () => ({ DeckComparisonPanel: () => null }));
// The deck views and the refresh notice print markers, so a test can tell the page's states apart.
vi.mock(import("@/components/deck/HomeDeckCard"), () => ({
  HomeDeckCard: ({ deck }) => <article>{deck.name}</article>,
}));
vi.mock(import("@/components/deck/DeckListTable"), () => ({
  DeckListTable: ({ decks }) => (
    <table aria-label="deck table">
      <tbody>
        {decks.map((deck) => (
          <tr key={deck.id}>
            <td>{deck.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));
vi.mock(import("@/components/deck/DeckListRefreshNotice"), () => ({
  DeckListRefreshNotice: ({ onRetry }) => (
    <button type="button" onClick={onRetry}>
      refresh notice
    </button>
  ),
}));
vi.mock(import("@/components/deck/GuestDeckClaimOffer"), () => ({
  GuestDeckClaimOffer: () => null,
}));

import DecksPage from "./page";

it("shows the empty deck state instead of loading forever for a signed-out visitor", () => {
  render(<DecksPage />);

  expect(screen.getByText("home.startBuilding")).toBeInTheDocument();
  expect(screen.queryByText("home.loading")).not.toBeInTheDocument();
  expect(loadDecks).not.toHaveBeenCalled();
});

/*
 * Characterization of the page's states for its split (DB-51) and the S-2
 * safety net of audit_community_pages: loading, session timeout, load
 * failure with and without decks, empty, search with no match, and the grid
 * and list views. Text renders as message keys (next-intl is stubbed).
 */
describe("DecksPage states (characterization)", () => {
  const ATRAXA = deck("deck-1", "Atraxa Superfriends", "2026-11-02T00:00:00Z");
  const KRENKO = deck("deck-2", "Krenko Goblins", "2026-11-01T00:00:00Z");

  function deck(id: string, name: string, updatedAt: string): Deck {
    return { ...createEmptyDeck(id, name), updatedAt: new Date(updatedAt) };
  }

  function signedInWith(
    decks: readonly Deck[],
    loadError: string | null = null
  ): void {
    session.status = "authenticated";
    deckStore.decks = Object.fromEntries(
      decks.map((entry) => [entry.id, entry])
    );
    deckStore.loadError = loadError;
  }

  /** The subtitle under the page title. */
  function subtitle(): string {
    return (
      screen.getByRole("heading", { level: 1, name: "home.title" })
        .nextElementSibling?.textContent ?? ""
    );
  }

  beforeEach(() => {
    session.status = "unauthenticated";
    session.update = vi.fn(async () => null);
    deckStore.decks = {};
    deckStore.loadError = null;
    loadDecks.mockReset();
    loadDecks.mockImplementation(async () => undefined);
    createDeck.mockClear();
    push.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the loading state while a signed-in player's decks load", () => {
    session.status = "authenticated";
    loadDecks.mockImplementation(() => new Promise<undefined>(() => {}));

    render(<DecksPage />);

    expect(loadDecks).toHaveBeenCalledTimes(1);
    expect(subtitle()).toBe("home.loading");
    expect(screen.queryByText("home.startBuilding")).toBeNull();
  });

  it("currently shows the session timeout after 8 s of a pending session, under an 'empty' subtitle (pinned; new follow-up, see the P1-20 PR)", () => {
    vi.useFakeTimers();
    session.status = "loading";

    render(<DecksPage />);
    expect(subtitle()).toBe("home.loading");
    act(() => {
      vi.advanceTimersByTime(8_000);
    });

    expect(
      screen.getByRole("heading", { name: "home.sessionTimeoutTitle" })
    ).toBeInTheDocument();
    expect(subtitle()).toBe("home.empty");
    expect(screen.queryByText("home.startBuilding")).toBeNull();
    expect(loadDecks).not.toHaveBeenCalled();
  });

  it("asks next-auth for the session again from the timeout's retry button", () => {
    vi.useFakeTimers();
    session.status = "loading";
    render(<DecksPage />);
    act(() => {
      vi.advanceTimersByTime(8_000);
    });

    fireEvent.click(screen.getByRole("button", { name: "home.retry" }));

    expect(session.update).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("heading", { name: "home.sessionTimeoutTitle" })
    ).toBeNull();
    expect(subtitle()).toBe("home.loading");
  });

  it("currently never times out again after a retry while the session stays pending (pinned; new follow-up, see the P1-20 PR)", () => {
    vi.useFakeTimers();
    session.status = "loading";
    render(<DecksPage />);
    act(() => {
      vi.advanceTimersByTime(8_000);
    });
    fireEvent.click(screen.getByRole("button", { name: "home.retry" }));

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(
      screen.queryByRole("heading", { name: "home.sessionTimeoutTitle" })
    ).toBeNull();
    expect(subtitle()).toBe("home.loading");
  });

  it("currently shows the raw load error under the failure message, and reloads from Retry (pinned; new follow-up, see the P1-20 PR)", async () => {
    signedInWith([], "[fetchDecks] HTTP 500: Internal server error");

    render(<DecksPage />);

    expect(
      await screen.findByRole("heading", { name: "home.loadFailedTitle" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("[fetchDecks] HTTP 500: Internal server error")
    ).toBeInTheDocument();
    expect(subtitle()).toBe("home.loadFailedSubtitle");
    expect(screen.queryByText("home.startBuilding")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "home.retry" }));
    expect(loadDecks).toHaveBeenCalledTimes(2);
  });

  it("keeps the decks on screen with a refresh notice when a reload fails", async () => {
    signedInWith([ATRAXA], "[fetchDecks] HTTP 500");

    render(<DecksPage />);

    expect(
      await screen.findByRole("button", { name: "refresh notice" })
    ).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveTextContent(
      "Atraxa Superfriends"
    );
    expect(
      screen.queryByRole("heading", { name: "home.loadFailedTitle" })
    ).toBeNull();
  });

  it("shows the empty state to a signed-in player with no deck", async () => {
    signedInWith([]);

    render(<DecksPage />);

    expect(
      await screen.findByRole("heading", { name: "home.startBuilding" })
    ).toBeInTheDocument();
    expect(subtitle()).toBe("home.empty");
  });

  it("shows the decks as cards, newest first, followed by a New Deck tile", async () => {
    signedInWith([KRENKO, ATRAXA]);

    render(<DecksPage />);

    await waitFor(() =>
      expect(
        screen.getAllByRole("article").map((card) => card.textContent)
      ).toEqual(["Atraxa Superfriends", "Krenko Goblins"])
    );
    expect(
      screen.getByRole("button", { name: "home.newDeck" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
    expect(subtitle()).toBe("home.deckCount");
  });

  it("shows the list view the player chose last time, with no New Deck tile", async () => {
    localStorage.setItem("mab-decks-view-mode", "list");
    signedInWith([KRENKO, ATRAXA]);

    render(<DecksPage />);

    const table = await screen.findByRole("table", { name: "deck table" });
    expect(table).toHaveTextContent("Atraxa SuperfriendsKrenko Goblins");
    expect(screen.queryByRole("article")).toBeNull();
    expect(screen.queryByRole("button", { name: "home.newDeck" })).toBeNull();
  });

  it("says no deck matches when the search finds none, and keeps the search box", async () => {
    signedInWith([ATRAXA, KRENKO]);
    render(<DecksPage />);

    fireEvent.change(
      screen.getByRole("searchbox", { name: "home.searchPlaceholder" }),
      {
        target: { value: "Edgar" },
      }
    );

    expect(await screen.findByText("home.searchEmpty")).toBeInTheDocument();
    expect(screen.queryByRole("article")).toBeNull();
    expect(
      screen.getByRole("searchbox", { name: "home.searchPlaceholder" })
    ).toHaveValue("Edgar");
  });

  it("currently opens a new deck through next/navigation's router, so the path carries no locale (pinned; see B2-18)", async () => {
    signedInWith([ATRAXA]);
    render(<DecksPage />);

    fireEvent.click(screen.getByRole("button", { name: "home.newDeck" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/builder/deck-new"));
    expect(createDeck).toHaveBeenCalledWith("home.newDeckName");
  });
});
