/**
 * Characterization of how the builder page chooses the Scryfall query its name search runs when a
 * plain-language query (#1369) meets the search filters and "Collection only" (#1360) (P1-21, audit
 * catalog A2). The choice lives in private functions of `page.tsx` (`searchQueryOrPinned`,
 * `handleSearch`, `handleNaturalQuery`, :153-157 and :511-544), so only a render of the page can
 * pin it. `src/components/search/SearchFilters.query.test.tsx` pins the query of each filter
 * combination; this file pins what happens to those filters once a plain-language query runs.
 *
 * Sociable: the page and everything it mounts are real. MSW stands in for the deck API, the shared
 * Scryfall search cache, the translation route and meta history; Next's app-router contexts carry
 * the route params. One seam is left, `@/i18n/navigation`, for the reason the header of the
 * builder page shell test (P1-11) gives: next-intl's ESM build imports `next/navigation` without a
 * file extension, which Node cannot resolve unless Vitest inlines next-intl.
 *
 * Tests named "currently … (pinned)" record odd behaviour on purpose; a `fix/` pull request that
 * changes it flips the test with its own Red.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider, useLocale, useMessages } from "next-intl";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCollectionStore } from "@/lib/collection/store";
import type { ApiDeck, ApiDeckCard } from "@/lib/db/deck-api";
import { useDeckStore } from "@/lib/deck/store";
import {
  EMPTY_SEARCH_RESPONSE,
  type ScryfallCard,
  type ScryfallSearchResponse,
} from "@/lib/scryfall/types";
import { useUIStore } from "@/lib/ui/store";
import auth from "@/messages/en/auth.json";
import { useMsw } from "@/test/msw";
import { renderWithIntl } from "@/test/render-with-intl";
import BuilderPage from "./page";

// eslint-disable-next-line no-restricted-syntax -- the one seam left; the header says why and what removes it
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

const DECK_ID = "deck-1";

/** A signed-in player who owns the deck under test. */
const PLAYER: Session = {
  user: { id: "player-1", name: "Kael" },
  expires: "2099-01-01T00:00:00.000Z",
};

/** Talrand, Sky Summoner leads the deck, so its colour identity is blue. */
const TALRAND: ApiDeckCard = {
  id: "row-talrand",
  deckId: DECK_ID,
  scryfallId: "scryfall-talrand",
  name: "Talrand, Sky Summoner",
  manaCost: "{2}{U}{U}",
  cmc: 4,
  typeLine: "Legendary Creature — Merfolk Wizard",
  oracleText:
    "Whenever you cast an instant or sorcery spell, create a 2/2 blue Drake creature token with flying.",
  power: "2",
  toughness: "2",
  colorIdentity: ["U"],
  isGameChanger: false,
  isBanned: false,
  price: null,
  imageUri: "https://cards.scryfall.io/normal/front/talrand.jpg",
  artCropUri: "https://cards.scryfall.io/art_crop/front/talrand.jpg",
  category: "creature",
  quantity: 1,
  notes: null,
  zone: "main",
  isCommander: true,
  isPartner: false,
};

const DECK: ApiDeck = {
  id: DECK_ID,
  name: "Talrand Spells",
  format: "commander",
  folderId: null,
  budget: null,
  description: "",
  tags: [],
  shareToken: null,
  shareEnabled: false,
  isPublic: false,
  isAIGenerated: false,
  companion: null,
  maybeboard: [],
  pairingType: "none",
  createdAt: "2026-11-01T09:00:00.000Z",
  updatedAt: "2026-11-01T09:00:00.000Z",
  commanderId: TALRAND.scryfallId,
  commanderName: TALRAND.name,
  partnerId: null,
  companionId: null,
  targetBracket: 2,
  manualBracket: null,
  cards: [TALRAND],
};

/** The query the translation route writes for the description the tests type. */
const TRANSLATED = 't:instant o:"draw a card" id<=U legal:commander';

/** The `query` of every search-cache read the page sent, in order. */
let searched: string[] = [];
/** What the shared search cache answers for `TRANSLATED`; every other query finds nothing. */
let translatedPage: ScryfallSearchResponse = EMPTY_SEARCH_RESPONSE;

function card(id: string, name: string): ScryfallCard {
  return { id, name, cmc: 1, type_line: "Instant", color_identity: ["U"] };
}

/**
 * `renderWithIntl` loads the namespaces most components read, but not `auth`, which the header's
 * user menu reads.
 */
function WithAuthMessages({ children }: { readonly children: ReactNode }) {
  const locale = useLocale();
  const messages = useMessages();
  return (
    <NextIntlClientProvider locale={locale} messages={{ ...messages, auth }}>
      {children}
    </NextIntlClientProvider>
  );
}

/** Opens the saved deck at `/en/builder/deck-1`, shows the filters and waits for the first search. */
async function openBuilderWithFilters() {
  const router = {
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  renderWithIntl(
    <AppRouterContext.Provider value={router}>
      <PathParamsContext.Provider value={{ locale: "en", deckId: DECK_ID }}>
        <SessionProvider session={PLAYER}>
          <QueryClientProvider client={queryClient}>
            <WithAuthMessages>
              <BuilderPage />
            </WithAuthMessages>
          </QueryClientProvider>
        </SessionProvider>
      </PathParamsContext.Provider>
    </AppRouterContext.Provider>
  );
  const user = userEvent.setup();
  await screen.findByRole("heading", { level: 1, name: "Talrand Spells" });
  await user.click(screen.getByRole("button", { name: "Show filters" }));
  await lastSearchIs("legal:commander");
  return user;
}

/** Describes a card, shows the query the route writes, and runs it unedited. */
async function runPlainLanguageQuery(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole("button", {
      name: "Describe a card in plain language",
    })
  );
  await user.type(
    screen.getByRole("textbox", { name: "Card description" }),
    "a cheap instant that draws a card"
  );
  await user.click(screen.getByRole("button", { name: "Show Scryfall query" }));
  expect(
    await screen.findByRole("textbox", { name: "Scryfall query" })
  ).toHaveValue(TRANSLATED);
  await user.click(screen.getByRole("button", { name: "Search this query" }));
}

async function lastSearchIs(query: string): Promise<void> {
  await waitFor(() => expect(searched.at(-1)).toBe(query));
}

/**
 * Waits long enough for a search the last action caused to reach the cache (a changed query is
 * sent on the next render), and checks that none did.
 */
async function expectNoSearchAfter(sent: number): Promise<void> {
  await expect(
    waitFor(() => expect(searched.length).toBeGreaterThan(sent), {
      timeout: 300,
    })
  ).rejects.toThrow();
}

beforeEach(() => {
  searched = [];
  translatedPage = EMPTY_SEARCH_RESPONSE;
  localStorage.clear();
  useDeckStore.setState(useDeckStore.getInitialState(), true);
  useUIStore.setState(useUIStore.getInitialState(), true);
  useCollectionStore.setState({
    collectionCards: {},
    collectionCardsFoil: {},
    isLoading: false,
    loadError: false,
  });
  // jsdom does not implement scrollTo; framer-motion calls it while measuring the panels' entry.
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("characterization: the builder's name search with a plain-language query", () => {
  useMsw(
    http.get("/api/decks/:id", () => HttpResponse.json(DECK)),
    http.get("/api/decks", () =>
      HttpResponse.json({
        decks: [{ ...DECK, _count: { cards: DECK.cards.length } }],
        total: 1,
        page: 0,
        limit: 20,
      })
    ),
    // Game Changers and the banlist read the same cache; their queries never match `TRANSLATED`.
    http.get("/api/cache/search", ({ request }) => {
      const query = new URL(request.url).searchParams.get("query") ?? "";
      if (query !== "is:gamechanger" && query !== "banned:commander") {
        searched.push(query);
      }
      return HttpResponse.json({
        hit: true,
        data: query === TRANSLATED ? translatedPage : EMPTY_SEARCH_RESPONSE,
      });
    }),
    http.get("/api/search/translate", () =>
      HttpResponse.json({ available: true })
    ),
    http.post("/api/search/translate", () =>
      HttpResponse.json({
        query: TRANSLATED,
        context: { format: "commander", colorIdentity: ["U"] },
      })
    ),
    http.get("/api/meta/:slug/history", () =>
      HttpResponse.json({ report: null, snapshotCount: 0, windowDays: 90 })
    )
  );

  it("runs the confirmed query exactly as shown, without the filters chosen before it", async () => {
    const user = await openBuilderWithFilters();
    await user.click(screen.getByRole("button", { name: "White" }));
    await lastSearchIs("id<=W legal:commander");

    await runPlainLanguageQuery(user);

    await lastSearchIs(TRANSLATED);
    expect(screen.getByText(`Query: ${TRANSLATED}`)).toBeDefined();
  });

  it("currently ignores the filters changed while a confirmed query runs: no new search is sent (pinned)", async () => {
    const user = await openBuilderWithFilters();
    await runPlainLanguageQuery(user);
    await lastSearchIs(TRANSLATED);
    const sent = searched.length;

    await user.click(screen.getByRole("button", { name: "🏔 Land" }));
    await user.click(screen.getByRole("button", { name: "Green" }));

    await expectNoSearchAfter(sent);
    expect(screen.getByText(`Query: ${TRANSLATED}`)).toBeDefined();
  });

  it("keeps Collection only on a confirmed query, which then lists only the cards the player owns", async () => {
    translatedPage = {
      object: "list",
      total_cards: 2,
      has_more: false,
      data: [card("brainstorm-cmm", "Brainstorm"), card("opt-dmu", "Opt")],
    };
    useCollectionStore.getState().hydrateCollection([
      {
        id: "row-1",
        scryfallId: "opt-eld",
        name: "Opt",
        quantity: 2,
        foil: false,
        createdAt: "2026-11-01T00:00:00.000Z",
      },
    ]);
    const user = await openBuilderWithFilters();
    await runPlainLanguageQuery(user);
    expect(await screen.findByText("Brainstorm")).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Only cards I own" }));

    expect(await screen.findByText("1 card you own")).toBeDefined();
    expect(screen.queryByText("Brainstorm")).toBeNull();
    expect(searched.slice(-2)).toEqual([TRANSLATED, TRANSLATED]);
  });

  it("currently keeps running the confirmed query after Back to syntax search, until a name is typed (pinned)", async () => {
    const user = await openBuilderWithFilters();
    await user.click(screen.getByRole("button", { name: "White" }));
    await runPlainLanguageQuery(user);
    await lastSearchIs(TRANSLATED);

    await user.click(
      screen.getByRole("button", { name: "Back to syntax search" })
    );
    expect(screen.getByText(`Query: ${TRANSLATED}`)).toBeDefined();
    const sent = searched.length;
    await user.click(screen.getByRole("button", { name: "Black" }));
    await expectNoSearchAfter(sent);

    await user.type(screen.getByPlaceholderText("Search cards…"), "brain");

    await lastSearchIs("name:/brain/ id<=WB legal:commander");
    expect(screen.queryByText(/^Query: /)).toBeNull();
  });
});
