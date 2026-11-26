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
import { isRecord } from "@/lib/guards";
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

/**
 * The search tab named `name`. The deck editor's grouping has a "By Color" of its own, so
 * the match is taken from the row that holds "By Set".
 */
function searchTab(name: "Name" | "By Set" | "By Color"): HTMLElement {
  const tabRow = button("By Set").parentElement;
  const matches = Array.from(tabRow?.querySelectorAll("button") ?? []).filter(
    (candidate) => buttonName(candidate) === name
  );
  expect(matches, `one search tab named "${name}"`).toHaveLength(1);
  return matches[0];
}

/** The builder page at `/en/builder/<deckId>`, inside the router contexts Next gives it. */
function builderAt(deckId: string) {
  const router = {
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  };
  return (
    <AppRouterContext.Provider value={router}>
      <PathParamsContext.Provider value={{ locale: "en", deckId }}>
        <BuilderPage />
      </PathParamsContext.Provider>
    </AppRouterContext.Provider>
  );
}

/** Opens the saved deck at `/en/builder/deck-1` and waits for its title. */
async function openBuilder(deckName: string = DECK.name) {
  const view = renderWithProviders(builderAt(DECK_ID), { session: PLAYER });
  const user = userEvent.setup();
  await screen.findByRole("heading", { level: 1, name: deckName });
  return { user, view };
}

/** Opens the saved deck at `/en/builder/deck-1`, shows the filters and waits for the first search. */
async function openBuilderWithFilters() {
  const { user } = await openBuilder();
  await user.click(button("Show filters"));
  // Talrand leads the deck, so the name search stays inside blue (I-01, AC-01-160).
  await lastSearchIs("legal:commander id<=U");
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

// One server for the whole file: `setupMsw` is called once per file (its header says why).
const server = setupMsw(
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

describe("characterization: the builder's name search with a plain-language query", () => {
  it("runs the confirmed query exactly as shown, without the filters chosen before it", async () => {
    const user = await openBuilderWithFilters();
    await user.click(button("White"));
    await lastSearchIs("id<=W legal:commander id<=U");

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

    await user.click(button("Land"));
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

    await searchesSince(sent, ["name:/brain/ id<=WB legal:commander id<=U"]);
    expect(screen.queryByText(/^Query: /)).toBeNull();
  });

  it("sends the translation only the command zone's names: Seluma in the 99 widens nothing (CR 903.5e)", async () => {
    const seluma: ApiDeckCard = {
      ...TALRAND,
      id: "row-seluma",
      scryfallId: "scryfall-seluma",
      name: "Seluma, Light of Aysen",
      typeLine: "Legendary Creature — Angel",
      colorIdentity: ["W", "B"],
      isCommander: false,
    };
    const sentNames: unknown[] = [];
    server.use(
      http.get("/api/decks/:id", () =>
        HttpResponse.json({ ...DECK, cards: [TALRAND, seluma] })
      ),
      http.post("/api/search/translate", async ({ request }) => {
        const body: unknown = await request.json();
        sentNames.push(isRecord(body) ? body.commandZoneNames : undefined);
        return HttpResponse.json({
          query: TRANSLATED,
          context: { format: "commander", colorIdentity: ["U"] },
        });
      })
    );
    const user = await openBuilderWithFilters();

    await runPlainLanguageQuery(user);

    expect(sentNames).toEqual([["Talrand, Sky Summoner"]]);
  });
});

/** A command-zone row of the deck under test, built on Talrand's. */
function commandZoneCard(
  name: string,
  colorIdentity: readonly string[],
  slot: { readonly isPartner: boolean } = { isPartner: false }
): ApiDeckCard {
  return {
    ...TALRAND,
    id: `row-${name}`,
    scryfallId: `scryfall-${name}`,
    name,
    typeLine: "Legendary Creature",
    colorIdentity: [...colorIdentity],
    isCommander: !slot.isPartner,
    isPartner: slot.isPartner,
  };
}

/** Serves the deck under test led by `commander`, with `partner` beside it when given. */
function serveDeckLedBy(commander: ApiDeckCard, partner?: ApiDeckCard): void {
  server.use(
    http.get("/api/decks/:id", () =>
      HttpResponse.json({
        ...DECK,
        commanderId: commander.scryfallId,
        commanderName: commander.name,
        partnerId: partner?.scryfallId ?? null,
        pairingType: partner ? "partner" : "none",
        cards: partner ? [commander, partner] : [commander],
      })
    )
  );
}

/** Teysa Karlov: a white and black commander with no rulebreaker exception. */
const TEYSA = commandZoneCard("Teysa Karlov", ["W", "B"]);

describe("the builder's name search inside the commander's colour identity (I-01, AC-01-160 to AC-01-162)", () => {
  it("searches inside the commander's colour identity once a commander is set", async () => {
    serveDeckLedBy(TEYSA);
    const { user } = await openBuilder();

    await user.type(screen.getByPlaceholderText("Search cards…"), "Sol");

    await lastSearchIs("name:/Sol/ legal:commander id<=WB");
    expect(
      screen.getByText("Only cards in your commander's colors")
    ).toBeDefined();
  });

  it("widens to every colour on the chip's one action, keeps legal:commander, and offers to narrow again", async () => {
    serveDeckLedBy(TEYSA);
    const { user } = await openBuilder();
    await user.type(screen.getByPlaceholderText("Search cards…"), "Sol");
    await lastSearchIs("name:/Sol/ legal:commander id<=WB");

    await user.click(button("Show every color"));

    await lastSearchIs("name:/Sol/ legal:commander");
    expect(screen.getByText("Cards of every color")).toBeDefined();
    await user.click(button("Only my commander's colors"));
    expect(
      await screen.findByText("Only cards in your commander's colors")
    ).toBeDefined();
  });

  it("widens from the keyboard: the chip's action is a focusable native button", async () => {
    serveDeckLedBy(TEYSA);
    const { user } = await openBuilder();
    // A name makes the widened query new: an empty one was cached before the deck loaded.
    await user.type(screen.getByPlaceholderText("Search cards…"), "Sol");
    await lastSearchIs("name:/Sol/ legal:commander id<=WB");

    button("Show every color").focus();
    await user.keyboard("{Enter}");

    await lastSearchIs("name:/Sol/ legal:commander");
    expect(button("Only my commander's colors")).toHaveFocus();
  });

  it("scopes a rulebreaker commander with the clause the described search writes: Seluma admits Angels and basics (CR 903.5e)", async () => {
    serveDeckLedBy(commandZoneCard("Seluma, Light of Aysen", ["W", "B"]));

    await openBuilder();

    await lastSearchIs("legal:commander (id<=WB OR t:angel OR t:basic)");
  });

  it("scopes a partner pair to their combined identity, in WUBRG order (CR 702.124)", async () => {
    serveDeckLedBy(
      commandZoneCard("Thrasios, Triton Hero", ["G", "U"]),
      commandZoneCard("Tymna the Weaver", ["W", "B"], { isPartner: true })
    );

    await openBuilder();

    await lastSearchIs("legal:commander id<=WUBG");
  });

  it("scopes a colourless commander to colourless cards (CR 903.4)", async () => {
    serveDeckLedBy(commandZoneCard("Kozilek, the Great Distortion", []));

    await openBuilder();

    await lastSearchIs("legal:commander id<=c");
  });

  it("adds no scope and shows no chip before a commander is set", async () => {
    server.use(
      http.get("/api/decks/:id", () =>
        HttpResponse.json({
          ...DECK,
          commanderId: null,
          commanderName: null,
          cards: [],
        })
      )
    );
    const { user } = await openBuilder();

    await user.type(screen.getByPlaceholderText("Search cards…"), "Sol");

    await lastSearchIs("name:/Sol/ legal:commander");
    expect(
      screen.queryByText("Only cards in your commander's colors")
    ).toBeNull();
  });

  it("adds no scope and shows no chip in a format without colour identity", async () => {
    server.use(
      http.get("/api/decks/:id", () =>
        HttpResponse.json({
          ...DECK,
          format: "modern",
          commanderId: TEYSA.scryfallId,
          commanderName: TEYSA.name,
          cards: [TEYSA],
        })
      )
    );
    const { user } = await openBuilder();

    await user.type(screen.getByPlaceholderText("Search cards…"), "Sol");

    await lastSearchIs("name:/Sol/ legal:modern");
    expect(
      screen.queryByText("Only cards in your commander's colors")
    ).toBeNull();
  });

  it("keeps the player's own colour filter: it narrows inside the commander's scope", async () => {
    serveDeckLedBy(TEYSA);
    const { user } = await openBuilder();
    await user.click(button("Show filters"));

    await user.click(button("White"));

    await lastSearchIs("id<=W legal:commander id<=WB");
  });

  it("scopes the search again when the player opens another deck after widening it", async () => {
    const teysaDeck = {
      ...DECK,
      commanderId: TEYSA.scryfallId,
      commanderName: TEYSA.name,
      cards: [TEYSA],
    };
    const otherDeck = { ...DECK, id: "deck-2", name: "Talrand Tempo" };
    server.use(
      http.get("/api/decks/:id", ({ params }) =>
        HttpResponse.json(params.id === otherDeck.id ? otherDeck : teysaDeck)
      ),
      // Opening a deck missing from the store reloads the list, which must hold both decks.
      http.get("/api/decks", () =>
        HttpResponse.json({
          decks: [teysaDeck, otherDeck].map((listed) => ({
            ...listed,
            _count: { cards: listed.cards.length },
          })),
          total: 2,
          page: 0,
          limit: 20,
        })
      )
    );
    const { user, view } = await openBuilder();
    await user.type(screen.getByPlaceholderText("Search cards…"), "Sol");
    await user.click(await findButton("Show every color"));
    await lastSearchIs("name:/Sol/ legal:commander");

    view.rerender(builderAt(otherDeck.id));

    await screen.findByRole("heading", { level: 1, name: otherDeck.name });
    await lastSearchIs("name:/Sol/ legal:commander id<=U");
    expect(
      screen.getByText("Only cards in your commander's colors")
    ).toBeDefined();
  });
});

/*
 * A search with no result showed the query it ran and nothing else. It now
 * says what to do next: "Clear filters" while the filters narrow the search,
 * a syntax hint otherwise (I-13 AC-13-05, design audit S11). Every query but
 * the translated one finds nothing in this file.
 */
describe("the builder's search with no result", () => {
  const SYNTAX_HINT =
    "Tip: search by type or rules text, for example t:dragon o:flying.";

  /** How many accessible buttons are named `name`. */
  function buttonCount(name: string): number {
    return Array.from(document.querySelectorAll("button")).filter(
      (candidate) =>
        buttonName(candidate) === name && !isInaccessible(candidate)
    ).length;
  }

  /** Serves Opt for the unfiltered name search; every other query still finds nothing. */
  function serveOptUnfiltered(): void {
    server.use(
      http.get("/api/cache/search", ({ request }) => {
        const query = new URL(request.url).searchParams.get("query") ?? "";
        if (query !== "is:gamechanger" && query !== "banned:commander") {
          searched.push(query);
        }
        const data: ScryfallSearchResponse =
          query === "legal:commander id<=U"
            ? {
                object: "list",
                total_cards: 1,
                has_more: false,
                data: [card("opt-dmu", "Opt")],
              }
            : EMPTY_SEARCH_RESPONSE;
        return HttpResponse.json({ hit: true, data });
      })
    );
  }

  // The unfiltered search comes back from the page's search cache, so the
  // proof is what the player sees again, not a new request.
  it("offers Clear filters while a filter narrows it, and lists the unfiltered search again", async () => {
    serveOptUnfiltered();
    const user = await openBuilderWithFilters();
    expect(await screen.findByText("Opt")).toBeDefined();
    await user.click(button("White"));
    await lastSearchIs("id<=W legal:commander id<=U");

    await user.click(await findButton("Clear filters"));

    expect(await screen.findByText("Opt")).toBeDefined();
    expect(button("White")).toHaveAttribute("aria-pressed", "false");
    expect(buttonCount("Clear filters")).toBe(0);
  });

  // The button removes itself on the press; focus used to fall to <body>.
  it("gives focus to the search field once Clear filters has gone", async () => {
    const user = await openBuilderWithFilters();
    await user.click(button("White"));
    await lastSearchIs("id<=W legal:commander id<=U");

    await user.click(await findButton("Clear filters"));

    expect(buttonCount("Clear filters")).toBe(0);
    expect(screen.getByPlaceholderText("Search cards…")).toHaveFocus();
  });

  it("suggests the search syntax, and no Clear filters, when no filter narrows it", async () => {
    await openBuilderWithFilters();

    expect(await screen.findByText(SYNTAX_HINT)).toBeDefined();
    expect(buttonCount("Clear filters")).toBe(0);
  });

  it("suggests the search syntax under a confirmed plain-language query, which runs without the filters", async () => {
    const user = await openBuilderWithFilters();
    await user.click(button("White"));
    await runPlainLanguageQuery(user);
    await lastSearchIs(TRANSLATED);

    // The query line shows only once the search has come back empty.
    expect(await screen.findByText(`Query: ${TRANSLATED}`)).toBeDefined();
    expect(screen.getByText(SYNTAX_HINT)).toBeDefined();
    expect(buttonCount("Clear filters")).toBe(0);
  });

  /*
   * The syntax hint helps only where the player types a Scryfall query: the
   * plain name search. By Set has no text box, By Color and the pickers turn
   * the text into `name:/…/`, and the pickers read no filter but the colours
   * and "Collection only" (`lib/scryfall/search.ts`).
   */
  describe("outside the plain name search", () => {
    const NO_RESULT = "No cards found. Try a different search.";

    /** Waits for `query` to be sent and for the panel to say it found nothing. */
    async function settlesEmpty(query: string): Promise<void> {
      await lastSearchIs(query);
      expect(await screen.findByText(NO_RESULT)).toBeDefined();
    }

    it("suggests nothing on By Set, which has no text box for the syntax", async () => {
      const { user } = await openBuilder();

      await user.click(searchTab("By Set"));

      expect(
        screen.getByPlaceholderText("Search set (e.g. dsk, mh3…)")
      ).toBeDefined();
      expect(screen.getByText(NO_RESULT)).toBeDefined();
      expect(screen.queryByText(SYNTAX_HINT)).toBeNull();
      expect(buttonCount("Clear filters")).toBe(0);
    });

    it("suggests nothing on By Color when the colours match no card", async () => {
      const { user } = await openBuilder();
      await user.click(searchTab("By Color"));

      await user.click(button("White"));

      await settlesEmpty("legal:commander id<=W");
      expect(screen.queryByText(SYNTAX_HINT)).toBeNull();
      expect(buttonCount("Clear filters")).toBe(0);
    });

    it("offers neither Clear filters nor the hint in the commander picker when only a filter it ignores is set", async () => {
      const user = await openBuilderWithFilters();
      await user.click(button("Commander"));
      await settlesEmpty("is:commander");

      await user.click(button("Land"));

      expect(searched.at(-1)).toBe("is:commander");
      expect(buttonCount("Clear filters")).toBe(0);
      expect(screen.queryByText(SYNTAX_HINT)).toBeNull();
    });

    it("offers Clear filters in the commander picker while a colour narrows it, and clears the colours", async () => {
      const user = await openBuilderWithFilters();
      await user.click(button("Commander"));
      await user.click(button("White"));
      await settlesEmpty("is:commander id<=W");

      await user.click(await findButton("Clear filters"));

      expect(button("White")).toHaveAttribute("aria-pressed", "false");
      expect(buttonCount("Clear filters")).toBe(0);
      expect(screen.queryByText(SYNTAX_HINT)).toBeNull();
    });
  });
});

/*
 * The Name tab's commander, partner and companion toggles start a pick, whose query replaces the
 * tab's own (`buildSearchQueryFromMode` in `page.tsx`). Only one pick runs at a time.
 */
describe("the builder's commander, partner and companion picks", () => {
  // The name search's earlier queries come back from the page's search cache, so a new name
  // proves which search runs once the pick has ended.
  it("characterization: ends a pick when its toggle is pressed again: the name search runs again", async () => {
    const { user } = await openBuilder();
    const searchField = screen.getByPlaceholderText("Search cards…");
    await user.type(searchField, "Sol");
    await lastSearchIs("name:/Sol/ legal:commander id<=U");
    await user.click(button("Commander"));
    await lastSearchIs("is:commander name:/Sol/");

    await user.click(button("Commander"));
    await user.type(searchField, "e");

    await lastSearchIs("name:/Sole/ legal:commander id<=U");
  });

  /*
   * The picks are toggled only from the Name tab, yet a pick left on kept replacing By Set's and
   * By Color's query, and nothing on those tabs said a pick was still on. A tab switch now ends
   * the pick (I-37).
   */
  describe("on a search tab switch", () => {
    /** Thrasios has partner, so its deck shows the partner toggle beside the other two. */
    const THRASIOS: ApiDeckCard = {
      ...commandZoneCard("Thrasios, Triton Hero", ["G", "U"]),
      oracleText:
        "{4}: Scry 1. Then reveal the top card of your library. If it's a land card, put it onto the battlefield tapped. Otherwise, draw a card.\nPartner (You can have two commanders if both have partner.)",
    };

    /** The one set the set list serves. */
    const DUSKMOURN = {
      object: "set",
      code: "dsk",
      name: "Duskmourn: House of Horror",
      set_type: "expansion",
      released_at: "2024-09-27",
      card_count: 286,
    };

    interface Pick {
      /** The name of the pick's toggle in the Name tab. */
      readonly toggle: string;
      /** The query the pick runs with no name typed. */
      readonly query: string;
    }

    const PICKS: readonly Pick[] = [
      { toggle: "Commander", query: "is:commander" },
      // CR 702.124h: a card with partner pairs only with another card that has partner.
      {
        toggle: "Partner",
        query: 'is:commander o:"Partner" -o:"Partner with" -o:"Partner—"',
      },
      // CR 702.139a: a companion is a card with the companion keyword ability.
      { toggle: "Companion", query: "keyword:companion legal:commander" },
    ];

    beforeEach(() => {
      server.use(
        http.get("/api/decks/:id", () =>
          HttpResponse.json({
            ...DECK,
            commanderId: THRASIOS.scryfallId,
            commanderName: THRASIOS.name,
            pairingType: "partner",
            cards: [THRASIOS],
          })
        ),
        http.get("https://api.scryfall.com/sets", () =>
          HttpResponse.json({
            object: "list",
            has_more: false,
            data: [DUSKMOURN],
          })
        )
      );
    });

    /** Turns `pick` on and waits for its search. */
    async function startPick(
      user: ReturnType<typeof userEvent.setup>,
      pick: Pick
    ): Promise<void> {
      await user.click(await findButton(pick.toggle));
      await lastSearchIs(pick.query);
    }

    it.each(PICKS)(
      "ends the $toggle pick on By Set: choosing a set searches that set",
      async (pick) => {
        const { user } = await openBuilder();
        await startPick(user, pick);

        await user.click(searchTab("By Set"));
        await user.click(
          screen.getByPlaceholderText("Search set (e.g. dsk, mh3…)")
        );
        await user.click(await screen.findByText(DUSKMOURN.name));

        await lastSearchIs("set:dsk legal:commander");
      }
    );

    it.each(PICKS)(
      "ends the $toggle pick on By Color: choosing a colour searches that colour",
      async (pick) => {
        const { user } = await openBuilder();
        await startPick(user, pick);

        await user.click(searchTab("By Color"));
        await user.click(button("White"));

        await lastSearchIs("legal:commander id<=W");
      }
    );

    it("has no pick on when the player comes back to Name: a typed name runs the name search", async () => {
      const { user } = await openBuilder();
      await startPick(user, PICKS[0]);
      await user.click(searchTab("By Set"));

      await user.click(searchTab("Name"));
      await user.type(screen.getByPlaceholderText("Search cards…"), "Sol");

      // Thrasios's colour identity, in WUBRG order (CR 903.4).
      await lastSearchIs("name:/Sol/ legal:commander id<=UG");
    });

    // This PR's choice: pressing the tab that is already open starts it afresh too.
    it("ends the pick when the Name tab already open is pressed again", async () => {
      const { user } = await openBuilder();
      await startPick(user, PICKS[0]);

      await user.click(searchTab("Name"));
      await user.type(screen.getByPlaceholderText("Search cards…"), "Sol");

      await lastSearchIs("name:/Sol/ legal:commander id<=UG");
    });

    // By Set's query reads the colours too, so colours left from By Color would narrow it.
    it("clears the colours chosen on By Color when the player switches to By Set", async () => {
      const { user } = await openBuilder();
      await user.click(searchTab("By Color"));
      await user.click(button("White"));
      await lastSearchIs("legal:commander id<=W");

      await user.click(searchTab("By Set"));
      await user.click(
        screen.getByPlaceholderText("Search set (e.g. dsk, mh3…)")
      );
      await user.click(await screen.findByText(DUSKMOURN.name));

      await lastSearchIs("set:dsk legal:commander");
    });
  });
});
