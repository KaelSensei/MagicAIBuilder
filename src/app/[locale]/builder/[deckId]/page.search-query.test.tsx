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
 *
 * Each test renders the whole page, so it runs for seconds against Vitest's budget of 5 s. The
 * helpers below keep it well under: `button` matches a name before it checks accessibility, and a
 * "no search was sent" claim is proven by the order of the requests, never by a timed wait.
 */
import { isInaccessible, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { Session } from "next-auth";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
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
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
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

/** Two copies of Opt in the player's collection, in a printing other than the one searched. */
const OWNED_OPT = {
  id: "row-1",
  scryfallId: "opt-eld",
  name: "Opt",
  quantity: 2,
  foil: false,
  createdAt: "2026-11-01T00:00:00.000Z",
};

/**
 * The accessible name of one of this page's buttons, as `getByRole` computes it: `aria-label`,
 * else the text outside `aria-hidden` children, else `title`. None of them uses `aria-labelledby`
 * or nested labelled content, so this is the whole algorithm for them.
 */
function buttonName(candidate: HTMLElement): string {
  const label = candidate.getAttribute("aria-label");
  if (label !== null) return label;
  const text = Array.from(candidate.childNodes)
    .filter(
      (node) =>
        !(
          node instanceof Element && node.getAttribute("aria-hidden") === "true"
        )
    )
    .map((node) => node.textContent ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0 ? text : candidate.title;
}

/**
 * The accessible button named `name`.
 *
 * `screen.getByRole("button", { name })` classifies every one of the page's 780 elements by role,
 * then checks accessibility and computes the name of all 110 buttons, on each call: about 190 ms,
 * against 50 ms for the click and re-render it serves, and the page has no landmark to scope it
 * to. Six to eight such calls per test, plus coverage instrumentation and a shared CPU, timed one
 * test out on CI (PR #1413, run 43139765594). Reading the buttons' names directly and running the
 * accessibility check `getByRole` applies on the match alone takes a few milliseconds and gives
 * the same guarantee.
 */
function button(name: string): HTMLElement {
  const matches = Array.from(document.querySelectorAll("button")).filter(
    (candidate) => buttonName(candidate) === name && !isInaccessible(candidate)
  );
  expect(matches, `one accessible button named "${name}"`).toHaveLength(1);
  return matches[0];
}

/** `button`, once the controls that hold it have rendered. */
function findButton(name: string): Promise<HTMLElement> {
  return waitFor(() => button(name));
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
  renderWithProviders(
    <AppRouterContext.Provider value={router}>
      <PathParamsContext.Provider value={{ locale: "en", deckId: DECK_ID }}>
        <BuilderPage />
      </PathParamsContext.Provider>
    </AppRouterContext.Provider>,
    { session: PLAYER }
  );
  const user = userEvent.setup();
  await screen.findByRole("heading", { level: 1, name: "Talrand Spells" });
  await user.click(button("Show filters"));
  await lastSearchIs("legal:commander");
  return user;
}

/** Describes a card, shows the query the route writes, and runs it unedited. */
async function runPlainLanguageQuery(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await findButton("Describe a card in plain language"));
  await user.type(
    screen.getByRole("textbox", { name: "Card description" }),
    "a cheap instant that draws a card"
  );
  await user.click(button("Show Scryfall query"));
  expect(
    await screen.findByRole("textbox", { name: "Scryfall query" })
  ).toHaveValue(TRANSLATED);
  await user.click(button("Search this query"));
}

async function lastSearchIs(query: string): Promise<void> {
  await waitFor(() => expect(searched.at(-1)).toBe(query));
}

/**
 * Waits for the last of `queries` and checks that the searches sent since `sent` are exactly
 * `queries`, in order.
 *
 * This is how a test proves that an action sent no search. A search an action causes leaves in
 * the render that action commits, and the cache handler records it as soon as it leaves; a later
 * action's search comes after both. So when the queries since `sent` hold only the later action's
 * search, the earlier action sent none. A timed wait for "nothing arrived" proved less (a slow
 * machine could still be sending) and cost 300 ms a test.
 */
async function searchesSince(
  sent: number,
  queries: readonly [string, ...string[]]
): Promise<void> {
  await lastSearchIs(queries[queries.length - 1]);
  expect(searched.slice(sent)).toEqual(queries);
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
  setupMsw(
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
    await user.click(button("White"));
    await lastSearchIs("id<=W legal:commander");

    await runPlainLanguageQuery(user);

    await lastSearchIs(TRANSLATED);
    expect(screen.getByText(`Query: ${TRANSLATED}`)).toBeDefined();
  });

  it("currently ignores the filters changed while a confirmed query runs: the next search is still that query (pinned)", async () => {
    // Owning a card makes "Only cards I own" search again (the test below), which shows which
    // query the panel still runs after the filter clicks.
    useCollectionStore.getState().hydrateCollection([OWNED_OPT]);
    const user = await openBuilderWithFilters();
    await runPlainLanguageQuery(user);
    await lastSearchIs(TRANSLATED);
    const sent = searched.length;

    await user.click(button("🏔 Land"));
    await user.click(button("Green"));
    expect(screen.getByText(`Query: ${TRANSLATED}`)).toBeDefined();

    await user.click(button("Only cards I own"));

    await searchesSince(sent, [TRANSLATED]);
    expect(screen.getByText(`Query: ${TRANSLATED}`)).toBeDefined();
  });

  it("keeps Collection only on a confirmed query, which then lists only the cards the player owns", async () => {
    translatedPage = {
      object: "list",
      total_cards: 2,
      has_more: false,
      data: [card("brainstorm-cmm", "Brainstorm"), card("opt-dmu", "Opt")],
    };
    useCollectionStore.getState().hydrateCollection([OWNED_OPT]);
    const user = await openBuilderWithFilters();
    await runPlainLanguageQuery(user);
    expect(await screen.findByText("Brainstorm")).toBeDefined();

    await user.click(button("Only cards I own"));

    expect(await screen.findByText("1 card you own")).toBeDefined();
    expect(screen.queryByText("Brainstorm")).toBeNull();
    expect(searched.slice(-2)).toEqual([TRANSLATED, TRANSLATED]);
  });

  it("currently keeps running the confirmed query after Back to syntax search, until a name is typed (pinned)", async () => {
    const user = await openBuilderWithFilters();
    await user.click(button("White"));
    await runPlainLanguageQuery(user);
    await lastSearchIs(TRANSLATED);

    await user.click(button("Back to syntax search"));
    expect(screen.getByText(`Query: ${TRANSLATED}`)).toBeDefined();
    const sent = searched.length;
    await user.click(button("Black"));
    expect(screen.getByText(`Query: ${TRANSLATED}`)).toBeDefined();

    await user.type(screen.getByPlaceholderText("Search cards…"), "brain");

    await searchesSince(sent, ["name:/brain/ id<=WB legal:commander"]);
    expect(screen.queryByText(/^Query: /)).toBeNull();
  });
});
