/**
 * The app providers as a composition root: signing in runs the bootstrap
 * request once, and its collection lands in the collection store so no
 * signed-in page fetches it again (master plan P1-38, audit arch 1.11).
 *
 * Sociable: the real Auth.js `SessionProvider` reads the session from MSW.
 * The one module replaced is `@/i18n/navigation`: next-intl's navigation
 * imports `next/navigation` without an extension, which Vitest cannot load
 * outside a bundler, so every component test uses the shared typed stub
 * (`src/test/i18n-navigation-stub.tsx`). Inlining next-intl in the Vitest
 * config would remove this seam. `next/navigation`'s `usePathname` gets the
 * page address Next's app router would give it, since no router runs in jsdom;
 * the onboarding provider reads it.
 */
import { afterEach, describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupMsw } from "@/test/msw";
import { renderWithIntl } from "@/test/render-with-intl";
import { emptyApiDeck } from "@/test/in-memory-deck-api";
import { useCollectionStore } from "@/lib/collection/store";
import { useDeckStore } from "@/lib/deck/store";
import { OPEN_DECK_STORAGE_KEY } from "@/lib/deck/open-deck-memory";
import { Providers } from "./providers";

// eslint-disable-next-line no-restricted-syntax -- the one seam left; the header says why and what removes it
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: () => "/decks",
}));

const SOL_RING_ID = "scry-sol-ring";

/** What GET /api/auth/session answers for a signed-in player. */
const SIGNED_IN_SESSION = {
  user: { id: "user-1" },
  expires: "2099-01-01T00:00:00.000Z",
};

/** What GET /api/user/init answers for a player who owns two Sol Rings. */
const BOOTSTRAP_PAYLOAD = {
  onboardingDone: true,
  collection: [
    {
      id: "row-1",
      scryfallId: SOL_RING_ID,
      name: "Sol Ring",
      quantity: 2,
      foil: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
};

const REMEMBERED_DECK_ID = "deck-remembered";

/** Puts in browser storage what an earlier page load remembered. */
function rememberOpenDeck(accountId: string, deckId: string): void {
  localStorage.setItem(
    OPEN_DECK_STORAGE_KEY,
    JSON.stringify({ accountId, deckId })
  );
}

describe("Providers", () => {
  const server = setupMsw(
    http.get("/api/auth/session", () => HttpResponse.json(SIGNED_IN_SESSION)),
    http.get("/api/user/init", () => HttpResponse.json(BOOTSTRAP_PAYLOAD))
  );

  beforeEach(() => {
    useCollectionStore.setState({
      collectionCards: {},
      collectionCardsFoil: {},
    });
  });

  it("fills the collection store from the sign-in bootstrap payload", async () => {
    renderWithIntl(
      <Providers>
        <p>page</p>
      </Providers>
    );

    await waitFor(() => {
      expect(useCollectionStore.getState().getTotalOwned(SOL_RING_ID)).toBe(2);
    });
  });

  describe("the open deck across a full page load (I-37, #1851)", () => {
    beforeEach(() => {
      localStorage.clear();
      useDeckStore.setState({ decks: {}, activeDeckId: null });
    });

    afterEach(() => {
      localStorage.clear();
    });

    it("opens again the deck the signed-in player had open", async () => {
      rememberOpenDeck(SIGNED_IN_SESSION.user.id, REMEMBERED_DECK_ID);
      server.use(
        http.get(`/api/decks/${REMEMBERED_DECK_ID}`, () =>
          HttpResponse.json(emptyApiDeck(REMEMBERED_DECK_ID, "Remembered"))
        )
      );

      renderWithIntl(
        <Providers>
          <p>page</p>
        </Providers>
      );

      await waitFor(() => {
        expect(useDeckStore.getState().activeDeckId).toBe(REMEMBERED_DECK_ID);
      });
    });

    it("forgets the open deck once the session says nobody is signed in", async () => {
      rememberOpenDeck(SIGNED_IN_SESSION.user.id, REMEMBERED_DECK_ID);
      server.use(http.get("/api/auth/session", () => HttpResponse.json({})));

      renderWithIntl(
        <Providers>
          <p>page</p>
        </Providers>
      );

      await waitFor(() => {
        expect(localStorage.getItem(OPEN_DECK_STORAGE_KEY)).toBeNull();
      });
      expect(useDeckStore.getState().activeDeckId).toBeNull();
    });
  });
});
