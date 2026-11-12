/**
 * Characterization of the Game Changers and banlist page (master plan RR-01, audit catalog A3):
 * the safety net for RR-04 and RR-05, which split `GameChangersPageClient` into a card tile, a
 * paged-and-filtered list hook, a zoom modal and a tabs component. Every test here describes what
 * a visitor sees and does, never how the file is cut, so the split cannot change behaviour
 * unnoticed (ADR 0005, rule 6).
 *
 * Sociable: the real page, the real `useLocalizedGameChangersList` and `useLocalizedBanlistQuery`
 * hooks, the Scryfall client and the printing selector run. MSW answers the shared search cache
 * (`/api/cache/search`, always a miss here) and api.scryfall.com; any other request fails the
 * test. Next's router is replaced, since the page writes the page number to the URL through it.
 * One seam is left, `@/i18n/navigation`, for the reason the header of the builder page shell test
 * (P1-11) gives: next-intl's ESM build imports `next/navigation` without a file extension, which
 * Node cannot resolve unless Vitest inlines next-intl.
 *
 * Tests named "pins …" record today's behaviour where it looks wrong on purpose. A `fix/` pull
 * request that changes it flips the test with its own Red; the follow-ups are listed in the PR
 * body of RR-01.
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse, type JsonBodyType } from "msw";
import { ReadonlyURLSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameChangersPageClient } from "./GameChangersPageClient";
import { useCollectionStore } from "@/lib/collection/store";
import type {
  ScryfallCard,
  ScryfallSearchResponse,
} from "@/lib/scryfall/types";
import { aScryfallCard } from "@/test/builders/scryfall";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";

const { router, searchParams } = vi.hoisted(() => ({
  router: {
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  },
  searchParams: { current: new URLSearchParams() },
}));

vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => router,
  useSearchParams: () => new ReadonlyURLSearchParams(searchParams.current),
}));

// eslint-disable-next-line no-restricted-syntax -- the one seam left; the header says why and what removes it
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

const SCRYFALL_SEARCH = "https://api.scryfall.com/cards/search";

/** The page size the component ships with (`PAGE_SIZE`). */
const PAGE_SIZE = 25;

/** One well-formed UUID per card: the shared card cache rejects any other id. */
function cardId(index: number): string {
  return `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

/** `count` Game Changers named "Game Changer 1" … "Game Changer N", in list order. */
function gameChangers(count: number): readonly ScryfallCard[] {
  return Array.from({ length: count }, (_, index) =>
    aScryfallCard({
      id: cardId(index + 1),
      name: `Game Changer ${index + 1}`,
      type_line: "Artifact",
    })
  );
}

function aPage(cards: readonly ScryfallCard[]): ScryfallSearchResponse {
  return {
    object: "list",
    total_cards: cards.length,
    has_more: false,
    data: [...cards],
  };
}

const SOL_RING = aScryfallCard({
  id: cardId(901),
  name: "Sol Ring",
  type_line: "Artifact",
  image_uris: {
    grid: "https://cards.scryfall.io/normal/front/sol-ring.webp",
    display: "https://cards.scryfall.io/large/front/sol-ring.webp",
  },
});
/** A second printing of Sol Ring, as the printings search lists it. */
const SOL_RING_COMMANDER_2021 = aScryfallCard({
  id: cardId(905),
  name: "Sol Ring",
  type_line: "Artifact",
  set: "c21",
});
const SOL_RING_PRINTINGS_QUERY = '!"Sol Ring" game:paper';
const RHYSTIC_STUDY = aScryfallCard({
  id: cardId(902),
  name: "Rhystic Study",
  type_line: "Enchantment",
});
const BLACK_LOTUS = aScryfallCard({
  id: cardId(903),
  name: "Black Lotus",
  type_line: "Artifact",
});

/** What each Scryfall list query answers; a test overrides the ones it cares about. */
let answers: Map<string, ScryfallSearchResponse | number> = new Map();
/** Every `q` sent to api.scryfall.com's search, in order. */
let sentQueries: string[] = [];
/** Every `query` the browser asked the shared search cache for, in order. */
let cacheLookups: string[] = [];

function answerScryfall(request: Request): HttpResponse<JsonBodyType> {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  sentQueries.push(query);
  const answer = answers.get(query);
  if (answer === undefined) return HttpResponse.json(aPage([]));
  if (typeof answer === "number") {
    return HttpResponse.json(
      { object: "error", code: "failed", status: answer, details: "boom" },
      { status: answer }
    );
  }
  return HttpResponse.json(answer);
}

const server = setupMsw(
  http.get("/api/cache/search", ({ request }) => {
    cacheLookups.push(new URL(request.url).searchParams.get("query") ?? "");
    return HttpResponse.json({ hit: false, data: null });
  }),
  http.get(SCRYFALL_SEARCH, ({ request }) => answerScryfall(request))
);

beforeEach(() => {
  answers = new Map([
    ["is:gamechanger", aPage([SOL_RING, RHYSTIC_STUDY])],
    ["banned:commander", aPage([BLACK_LOTUS])],
    [SOL_RING_PRINTINGS_QUERY, aPage([SOL_RING, SOL_RING_COMMANDER_2021])],
  ]);
  sentQueries = [];
  cacheLookups = [];
  searchParams.current = new URLSearchParams();
  router.replace.mockClear();
  // jsdom lays nothing out, so it has no scrollIntoView; the page calls it on every page change.
  Element.prototype.scrollIntoView = vi.fn();
  useCollectionStore.setState({ collectionCards: {}, collectionCardsFoil: {} });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Mounts the page with `query` in the URL and waits until the Game Changers list is on screen. */
async function openPage(query = "") {
  searchParams.current = new URLSearchParams(query);
  const user = userEvent.setup();
  const view = renderWithProviders(<GameChangersPageClient />);
  await screen.findByText(/cards?$/);
  return { user, ...view };
}

/** The visible card tiles, in grid order, by the name each one offers to zoom. */
function visibleCardNames(): string[] {
  return screen
    .getAllByRole("button", { name: /^View / })
    .map(
      (tile) => tile.getAttribute("aria-label")?.replace(/^View /, "") ?? ""
    );
}

function pageIndicator(): HTMLElement {
  return screen.getByText(/^Page/, { selector: "span" });
}

const tab = (name: RegExp) => screen.getByRole("button", { name });
const GAME_CHANGERS_TAB = /^Game Changers/;
const BANLIST_TAB = /^Banlist/;

describe("the two lists", () => {
  it("lists the Game Changers Scryfall's is:gamechanger search returns, with a GC badge on each", async () => {
    await openPage();

    expect(visibleCardNames()).toEqual(["Sol Ring", "Rhystic Study"]);
    expect(screen.getByText("2 cards")).toBeInTheDocument();
    expect(screen.getAllByText("GC")).toHaveLength(2);
    expect(screen.queryByText("Banned")).not.toBeInTheDocument();
  });

  it("asks the shared search cache first, then Scryfall, for both lists as soon as the page opens", async () => {
    await openPage();

    await waitFor(() =>
      expect(cacheLookups).toEqual(["is:gamechanger", "banned:commander"])
    );
    expect(sentQueries).toEqual(["is:gamechanger", "banned:commander"]);
  });

  it("shows each tab's card count once its list has loaded", async () => {
    await openPage();

    expect(tab(GAME_CHANGERS_TAB)).toHaveTextContent("Game Changers(2)");
    expect(tab(BANLIST_TAB)).toHaveTextContent("Banlist(1)");
  });

  it("switches to the banned:commander list on the banlist tab, with a Banned badge on each card", async () => {
    const { user } = await openPage();

    await user.click(tab(BANLIST_TAB));

    expect(visibleCardNames()).toEqual(["Black Lotus"]);
    expect(screen.getByText("1 card")).toBeInTheDocument();
    expect(screen.getByText("Banned")).toBeInTheDocument();
    expect(screen.queryByText("GC")).not.toBeInTheDocument();
  });

  it("links to the Comprehensive Rules from the tab bar", async () => {
    await openPage();

    expect(
      screen.getByRole("link", { name: "Comprehensive Rules" })
    ).toHaveAttribute("href", expect.stringContaining("/rules/comprehensive"));
  });

  it("also asks Scryfall for French printings when the viewer reads the page in French", async () => {
    searchParams.current = new URLSearchParams();
    renderWithProviders(<GameChangersPageClient />, { locale: "fr" });

    await waitFor(() =>
      expect(sentQueries).toEqual(
        expect.arrayContaining([
          "is:gamechanger",
          "is:gamechanger lang:fr",
          "banned:commander",
          "banned:commander lang:fr",
        ])
      )
    );
    await screen.findByText(/cartes?$/);
  });
});

describe("searching", () => {
  it("keeps only the cards whose name contains the typed text, case-insensitively, and says what was searched", async () => {
    const { user } = await openPage();

    await user.type(screen.getByPlaceholderText("Search for a card…"), "rhys");

    expect(visibleCardNames()).toEqual(["Rhystic Study"]);
    expect(screen.getByText('1 card for "rhys"')).toBeInTheDocument();
  });

  it("matches the printed name too, so a French viewer can type the name shown on the card", async () => {
    answers.set(
      "is:gamechanger",
      aPage([
        SOL_RING,
        aScryfallCard({
          id: cardId(904),
          name: "Rhystic Study",
          printed_name: "Étude rhystique",
          lang: "fr",
        }),
      ])
    );
    const { user } = await openPage();

    await user.type(screen.getByPlaceholderText("Search for a card…"), "étude");

    expect(visibleCardNames()).toEqual(["Étude rhystique"]);
  });

  it("shows the empty message when no card matches", async () => {
    const { user } = await openPage();

    await user.type(
      screen.getByPlaceholderText("Search for a card…"),
      "nothing here"
    );

    expect(screen.getByText("No cards found.")).toBeInTheDocument();
    expect(screen.getByText('0 cards for "nothing here"')).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^View / })).toBeNull();
  });
});

describe("pagination", () => {
  beforeEach(() => {
    answers.set("is:gamechanger", aPage(gameChangers(PAGE_SIZE + 5)));
  });

  it("shows 25 cards per page and no pager when a list fits on one page", async () => {
    answers.set("is:gamechanger", aPage(gameChangers(PAGE_SIZE)));
    await openPage();

    expect(visibleCardNames()).toHaveLength(PAGE_SIZE);
    expect(screen.queryByRole("navigation", { name: "Pagination" })).toBeNull();
  });

  it("pages a longer list, 25 cards then the rest, and tells the visitor which page they are on", async () => {
    await openPage();

    expect(visibleCardNames()).toHaveLength(PAGE_SIZE);
    expect(visibleCardNames()[0]).toBe("Game Changer 1");
    expect(pageIndicator()).toHaveTextContent("Page 1 / 2");
    expect(screen.getByText("30 cards")).toBeInTheDocument();
  });

  it("moves to the next page and back with the pager, writing the page number to the URL without scrolling the window", async () => {
    const { user } = await openPage();
    router.replace.mockClear();

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(visibleCardNames()).toEqual([
      "Game Changer 26",
      "Game Changer 27",
      "Game Changer 28",
      "Game Changer 29",
      "Game Changer 30",
    ]);
    expect(pageIndicator()).toHaveTextContent("Page 2 / 2");
    expect(router.replace).toHaveBeenLastCalledWith("?page=2", {
      scroll: false,
    });
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Previous page" }));

    expect(visibleCardNames()[0]).toBe("Game Changer 1");
    expect(router.replace).toHaveBeenLastCalledWith("?page=1", {
      scroll: false,
    });
    expect(
      screen.getByRole("button", { name: "Previous page" })
    ).toBeDisabled();
  });

  it("scrolls the page title back into view on every page change", async () => {
    const { user } = await openPage();
    const scrollIntoView = vi.mocked(Element.prototype.scrollIntoView);
    scrollIntoView.mockClear();

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("keeps the other query parameters when it writes the page number", async () => {
    const { user } = await openPage("utm=newsletter");

    await user.click(screen.getByRole("button", { name: "Next page" }));

    expect(router.replace).toHaveBeenLastCalledWith("?utm=newsletter&page=2", {
      scroll: false,
    });
  });

  it("opens the page a ?page=2 link names once the list has loaded", async () => {
    await openPage("page=2");

    expect(visibleCardNames()).toEqual([
      "Game Changer 26",
      "Game Changer 27",
      "Game Changer 28",
      "Game Changer 29",
      "Game Changer 30",
    ]);
    expect(pageIndicator()).toHaveTextContent("Page 2 / 2");
  });

  it("keeps page=2 in the URL of a link that names a page the list has", async () => {
    await openPage("page=2");

    expect(router.replace).not.toHaveBeenCalled();
  });

  it("does not scroll on the first load of a ?page=2 link", async () => {
    await openPage("page=2");

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("still returns to page 1 when the visitor changes tab after opening a ?page=2 link", async () => {
    const { user } = await openPage("page=2");

    await user.click(tab(BANLIST_TAB));
    await user.click(tab(GAME_CHANGERS_TAB));

    expect(visibleCardNames()[0]).toBe("Game Changer 1");
    expect(pageIndicator()).toHaveTextContent("Page 1 / 2");
    expect(router.replace).toHaveBeenCalledWith("?page=1", { scroll: false });
  });

  it("pins: a page beyond the last one, or no page at all, lands on page 1 and the URL is rewritten to page=1", async () => {
    await openPage("page=99");

    expect(pageIndicator()).toHaveTextContent("Page 1 / 2");
    expect(router.replace).toHaveBeenCalledWith("?page=1", { scroll: false });
  });

  it("pins: the URL is rewritten to page=1 on first load even without a page in it", async () => {
    await openPage();

    expect(router.replace).toHaveBeenCalledWith("?page=1", { scroll: false });
  });

  it("returns to page 1 when the visitor changes tab", async () => {
    const { user } = await openPage();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    router.replace.mockClear();

    await user.click(tab(BANLIST_TAB));
    await user.click(tab(GAME_CHANGERS_TAB));

    expect(visibleCardNames()[0]).toBe("Game Changer 1");
    expect(pageIndicator()).toHaveTextContent("Page 1 / 2");
    expect(router.replace).toHaveBeenCalledWith("?page=1", { scroll: false });
  });

  it("returns to page 1 when the visitor types a search", async () => {
    const { user } = await openPage();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    router.replace.mockClear();

    await user.type(screen.getByPlaceholderText("Search for a card…"), "Game");

    expect(visibleCardNames()[0]).toBe("Game Changer 1");
    expect(pageIndicator()).toHaveTextContent("Page 1 / 2");
    expect(router.replace).toHaveBeenCalledWith("?page=1", { scroll: false });
  });
});

describe("the card zoom", () => {
  it("opens a zoom of the clicked card, with its display-size image, name, type and position in the page", async () => {
    const { user } = await openPage();
    const tile = screen.getByRole("button", { name: "View Sol Ring" });
    expect(within(tile).getByRole("img", { name: "Sol Ring" })).toHaveAttribute(
      "src",
      "https://cards.scryfall.io/normal/front/sol-ring.webp"
    );

    await user.click(tile);

    const zoom = screen.getByRole("dialog", { name: "Sol Ring — zoom" });
    expect(within(zoom).getByRole("img", { name: "Sol Ring" })).toHaveAttribute(
      "src",
      "https://cards.scryfall.io/large/front/sol-ring.webp"
    );
    expect(within(zoom).getByText("Artifact")).toBeInTheDocument();
    expect(within(zoom).getByText("1 / 2")).toBeInTheDocument();
  });

  it("steps through the page's cards with the arrow keys and the side buttons, stopping at both ends", async () => {
    const { user } = await openPage();
    await user.click(screen.getByRole("button", { name: "View Sol Ring" }));

    expect(screen.queryByRole("button", { name: "Previous card" })).toBeNull();
    await user.keyboard("{ArrowRight}");
    expect(
      screen.getByRole("dialog", { name: "Rhystic Study — zoom" })
    ).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next card" })).toBeNull();

    await user.keyboard("{ArrowRight}");
    expect(
      screen.getByRole("dialog", { name: "Rhystic Study — zoom" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous card" }));
    expect(
      screen.getByRole("dialog", { name: "Sol Ring — zoom" })
    ).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(
      screen.getByRole("dialog", { name: "Sol Ring — zoom" })
    ).toBeInTheDocument();
  });

  it("closes on Escape and leaves focus on the tile that opened it", async () => {
    const { user } = await openPage();
    const tile = screen.getByRole("button", { name: "View Sol Ring" });
    await user.click(tile);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(tile).toHaveFocus();
  });

  it("pins: closing with the close button drops focus to the document body (see RR-05)", async () => {
    const { user } = await openPage();
    await user.click(screen.getByRole("button", { name: "View Sol Ring" }));

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body).toHaveFocus();
  });

  it("closes when the visitor clicks the backdrop around the card", async () => {
    const { user } = await openPage();
    await user.click(screen.getByRole("button", { name: "View Sol Ring" }));

    await user.click(screen.getByRole("button", { name: "Close preview" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("says when a card has no image instead of drawing a broken one", async () => {
    const { user } = await openPage();

    await user.click(
      screen.getByRole("button", { name: "View Rhystic Study" })
    );

    const zoom = screen.getByRole("dialog", { name: "Rhystic Study — zoom" });
    expect(within(zoom).queryByRole("img")).toBeNull();
    expect(screen.getAllByText("No image").length).toBeGreaterThan(0);
  });
});

describe("the printings modal", () => {
  it("opens from the zoom's 'View all arts', closes the zoom, and asks Scryfall for every paper printing of the card", async () => {
    const { user } = await openPage();
    await user.click(screen.getByRole("button", { name: "View Sol Ring" }));

    await user.click(screen.getByRole("button", { name: "View all arts" }));

    expect(
      screen.queryByRole("dialog", { name: "Sol Ring — zoom" })
    ).toBeNull();
    const printings = await screen.findByRole("dialog", { name: "Sol Ring" });
    await waitFor(() =>
      expect(sentQueries).toContain(SOL_RING_PRINTINGS_QUERY)
    );
    expect(
      await within(printings).findByText("2 printings available")
    ).toBeInTheDocument();
  });

  it("closes with its close button and brings the visitor back to the list with no dialog open", async () => {
    const { user } = await openPage();
    await user.click(screen.getByRole("button", { name: "View Sol Ring" }));
    await user.click(screen.getByRole("button", { name: "View all arts" }));
    const printings = await screen.findByRole("dialog", { name: "Sol Ring" });

    await user.click(within(printings).getByRole("button", { name: "Close" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(visibleCardNames()).toEqual(["Sol Ring", "Rhystic Study"]);
  });
});

describe("loading and failure", () => {
  it("shows the loading message, and no count or grid, while Scryfall has not answered", async () => {
    server.use(
      http.get(SCRYFALL_SEARCH, async () => {
        await delay("infinite");
        return HttpResponse.json(aPage([]));
      })
    );
    renderWithProviders(<GameChangersPageClient />);

    expect(
      await screen.findByText("Loading from Scryfall…")
    ).toBeInTheDocument();
    expect(screen.queryByText(/cards?$/)).toBeNull();
    expect(screen.queryByRole("button", { name: /^View / })).toBeNull();
  });

  it("shows the error message when Scryfall fails, and the other tab's list still loads", async () => {
    answers.set("is:gamechanger", 500);
    const user = userEvent.setup();
    renderWithProviders(<GameChangersPageClient />);

    expect(
      await screen.findByText(
        "Failed to load data from Scryfall. Please try again in a moment."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/cards?$/)).toBeNull();

    await user.click(tab(BANLIST_TAB));
    expect(await screen.findByText("1 card")).toBeInTheDocument();
    expect(visibleCardNames()).toEqual(["Black Lotus"]);
  });

  it("treats Scryfall's 404 for a query with no match as an empty list, not a failure", async () => {
    answers.set("is:gamechanger", 404);
    renderWithProviders(<GameChangersPageClient />);

    expect(await screen.findByText("No cards found.")).toBeInTheDocument();
    expect(screen.getByText("0 cards")).toBeInTheDocument();
    expect(screen.queryByText(/Failed to load/)).toBeNull();
  });
});
