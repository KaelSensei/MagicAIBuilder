/**
 * Characterization of the builder page shell, `src/app/[locale]/builder/[deckId]/page.tsx`
 * (P1-11, audit TT-07). The page is the largest UI module of the app and had no unit test; these
 * tests pin what it does today so the Phase 6 split into layout, panels and modals cannot change
 * it unnoticed (ADR 0005, rule 6).
 *
 * Sociable: the page, every panel it mounts, the deck store and the UI store are the real ones.
 * MSW stands in for the network (the deck API, the shared Scryfall cache, meta history, the AI
 * routes), and Next's own app-router contexts carry the route params and the router, so nothing
 * in `next/navigation` or `next-auth/react` is mocked.
 *
 * One seam is left, `@/i18n/navigation`, replaced by the shared typed stub. next-intl's ESM build
 * imports `next/navigation` without a file extension, which Node's loader cannot resolve unless
 * Vitest inlines next-intl; `vitest.config.ts` inlines only next-auth. Inlining next-intl renders
 * the real module (checked while writing this file), so that config change removes the seam.
 *
 * Tests named "currently … (pinned)" record odd behaviour on purpose. A `fix/` pull request that
 * changes it flips the test with its own Red.
 */
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse, type JsonBodyType } from "msw";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider, useLocale, useMessages } from "next-intl";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { aiCallDenialBody } from "@/lib/ai/usage/denial";
import type {
  ApiDeck,
  ApiDeckCard,
  ApiDeckListResponse,
} from "@/lib/db/deck-api";
import { GUEST_DECK_ID } from "@/lib/deck/guest-deck";
import { useDeckStore } from "@/lib/deck/store";
import { EMPTY_SEARCH_RESPONSE } from "@/lib/scryfall/types";
import { useUIStore } from "@/lib/ui/store";
import auth from "@/messages/en/auth.json";
import { setupMsw } from "@/test/msw";
import { renderWithIntl } from "@/test/render-with-intl";
import BuilderPage from "./page";

// eslint-disable-next-line no-restricted-syntax -- the one seam left; the header says why and what removes it
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

const DECK_ID = "deck-1";
const SCRYFALL_NAMED = "https://api.scryfall.com/cards/named";

/** A signed-in player who owns the deck under test. */
const PLAYER: Session = {
  user: { id: "player-1", name: "Kael" },
  expires: "2099-01-01T00:00:00.000Z",
};

/** A deck row as `GET /api/decks/:id` serves it; card data follows Scryfall's Oracle text. */
function row(name: string, card: Partial<ApiDeckCard>): ApiDeckCard {
  const slug = name.toLowerCase().replaceAll(/[^a-z]+/g, "-");
  return {
    id: `row-${slug}`,
    deckId: DECK_ID,
    scryfallId: `scryfall-${slug}`,
    name,
    manaCost: "",
    cmc: 0,
    typeLine: "",
    oracleText: "",
    colorIdentity: ["U"],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: `https://cards.scryfall.io/normal/front/${slug}.jpg`,
    artCropUri: `https://cards.scryfall.io/art_crop/front/${slug}.jpg`,
    category: "other",
    quantity: 1,
    notes: null,
    zone: "main",
    isCommander: false,
    isPartner: false,
    ...card,
  };
}

const TALRAND = row("Talrand, Sky Summoner", {
  manaCost: "{2}{U}{U}",
  cmc: 4,
  typeLine: "Legendary Creature — Merfolk Wizard",
  oracleText:
    "Whenever you cast an instant or sorcery spell, create a 2/2 blue Drake creature token with flying.",
  power: "2",
  toughness: "2",
  category: "creature",
  isCommander: true,
});
const BARAL = row("Baral, Chief of Compliance", {
  manaCost: "{1}{U}",
  cmc: 2,
  typeLine: "Legendary Creature — Human Wizard",
  oracleText:
    "Instant and sorcery spells you cast cost {1} less to cast.\nWhenever a spell or ability you control counters a spell, you may draw a card. If you do, discard a card.",
  power: "1",
  toughness: "3",
  category: "creature",
});
const COUNTERSPELL = row("Counterspell", {
  manaCost: "{U}{U}",
  cmc: 2,
  typeLine: "Instant",
  oracleText: "Counter target spell.",
  category: "instant",
});
const SOL_RING = row("Sol Ring", {
  manaCost: "{1}",
  cmc: 1,
  typeLine: "Artifact",
  oracleText: "{T}: Add {C}{C}.",
  colorIdentity: [],
  category: "ramp",
});
const ISLANDS = row("Island", {
  typeLine: "Basic Land — Island",
  oracleText: "({T}: Add {U}.)",
  category: "land",
  quantity: 10,
});

/** The saved deck: Talrand leads 13 main-deck cards, so the counters read 14. */
function savedDeck(deck: Partial<ApiDeck> = {}): ApiDeck {
  return {
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
    cards: [TALRAND, BARAL, COUNTERSPELL, SOL_RING, ISLANDS],
    ...deck,
  };
}

/** `GET /api/decks` keeps only the command zone of each deck, plus its row count. */
function listingOf(deck: ApiDeck): ApiDeckListResponse {
  return {
    decks: [
      {
        ...deck,
        cards: deck.cards.filter((card) => card.isCommander),
        _count: { cards: deck.cards.length },
      },
    ],
    total: 1,
    page: 0,
    limit: 20,
  };
}

/** A request the page sent, as `METHOD path?query` plus its JSON body when it has one. */
interface SentRequest {
  readonly line: string;
  readonly body?: JsonBodyType;
}

/** Every request the handlers below served during the current test, in order. */
let sent: SentRequest[] = [];

async function record(request: Request): Promise<void> {
  const url = new URL(request.url);
  const line = `${request.method} ${url.origin === location.origin ? "" : url.origin}${url.pathname}${url.search}`;
  const text = request.method === "GET" ? "" : await request.text();
  sent.push(text === "" ? { line } : { line, body: JSON.parse(text) });
}

/** The lines of the deck API requests sent so far. */
function deckApiLines(): readonly string[] {
  return sent
    .map((request) => request.line)
    .filter((line) => line.includes("/api/decks"));
}

/** A handler for one deck route that waits for the test to let the answer through. */
function heldUntilReleased(answer: () => Response): {
  readonly release: () => void;
  readonly handler: (input: { readonly request: Request }) => Promise<Response>;
} {
  let release = (): void => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  return {
    release,
    handler: async ({ request }) => {
      await record(request);
      await gate;
      return answer();
    },
  };
}

/**
 * `renderWithIntl` loads the namespaces most components read, but not `auth`, which the header's
 * user menu reads. This adds it rather than forking the helper.
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

/** Renders the page at `/en/builder/<deckId>` the way the app router mounts it. */
function renderBuilder(
  deckId: string,
  session: Session | null
): { readonly push: (href: string) => void } {
  const push = vi.fn<(href: string) => void>();
  const router = {
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push,
    replace: vi.fn(),
    prefetch: vi.fn(),
  };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  renderWithIntl(
    <AppRouterContext.Provider value={router}>
      <PathParamsContext.Provider value={{ locale: "en", deckId }}>
        <SessionProvider session={session}>
          <QueryClientProvider client={queryClient}>
            <WithAuthMessages>
              <BuilderPage />
            </WithAuthMessages>
          </QueryClientProvider>
        </SessionProvider>
      </PathParamsContext.Provider>
    </AppRouterContext.Provider>
  );
  return { push };
}

/** Opens the saved deck and waits for its title bar. */
async function openSavedDeck(): Promise<void> {
  renderBuilder(DECK_ID, PLAYER);
  await screen.findByRole("heading", { level: 1, name: "Talrand Spells" });
}

/**
 * Whether `element` sits in a panel hidden below the `lg` breakpoint. jsdom applies no CSS, so the
 * Tailwind class is the only observable signal; the responsive E2E checks cover real visibility.
 */
function hiddenBelowLg(element: HTMLElement): boolean {
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.parentElement
  ) {
    if (node.classList.contains("max-lg:hidden")) return true;
  }
  return false;
}

/**
 * A search mode button. "Name" and "By Color" also name the deck's sort and grouping buttons
 * (pinned below); only those carry a title, so an empty description picks the search mode.
 */
function searchMode(name: string): HTMLElement {
  return screen.getByRole("button", { name, description: "" });
}

beforeEach(() => {
  sent = [];
  localStorage.clear();
  useDeckStore.setState(useDeckStore.getInitialState(), true);
  useUIStore.setState(useUIStore.getInitialState(), true);
  // jsdom does not implement scrollTo; framer-motion calls it while measuring the panels' entry.
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("characterization: builder page shell", () => {
  const server = setupMsw(
    http.get("/api/decks/:id", async ({ request }) => {
      await record(request);
      return HttpResponse.json(savedDeck());
    }),
    http.get("/api/decks", async ({ request }) => {
      await record(request);
      return HttpResponse.json(listingOf(savedDeck()));
    }),
    http.patch("/api/decks/:id", async ({ request }) => {
      await record(request);
      return HttpResponse.json(savedDeck());
    }),
    // Game Changers, banlist and the search panel all read the shared Scryfall cache. The lists are
    // empty: this file pins the shell, not the catalogue.
    http.get("/api/cache/search", async ({ request }) => {
      await record(request);
      return HttpResponse.json({ hit: true, data: EMPTY_SEARCH_RESPONSE });
    }),
    http.get("/api/search/translate", () =>
      HttpResponse.json({ available: false })
    ),
    http.get("/api/meta/:slug/history", () =>
      HttpResponse.json({ report: null, snapshotCount: 0, windowDays: 90 })
    )
  );

  describe("opening a saved deck", () => {
    it("shows the loading state until the deck arrives, then the title bar and the three panels", async () => {
      const deckRequest = heldUntilReleased(() =>
        HttpResponse.json(savedDeck())
      );
      server.use(http.get("/api/decks/:id", deckRequest.handler));

      renderBuilder(DECK_ID, PLAYER);

      expect(await screen.findByText("Loading deck…")).toHaveAttribute(
        "aria-busy",
        "true"
      );
      expect(
        screen.queryByRole("heading", { level: 1 })
      ).not.toBeInTheDocument();

      act(() => deckRequest.release());

      expect(
        await screen.findByRole("heading", { level: 1, name: "Talrand Spells" })
      ).toBeInTheDocument();
      expect(screen.queryByText("Loading deck…")).not.toBeInTheDocument();
      // Search panel: the three search modes.
      for (const mode of ["Name", "By Set", "By Color"]) {
        expect(searchMode(mode)).toBeInTheDocument();
      }
      // Deck panel: the three zone tabs, main selected.
      expect(screen.getByRole("button", { name: "Main (14)" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(
        screen.getByRole("button", { name: "Sideboard (0)" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Considering (0)" })
      ).toBeInTheDocument();
      // Stats panel: deck details first, then the analysis panels.
      expect(
        screen.getByRole("region", { name: "Deck details" })
      ).toBeInTheDocument();
      expect(screen.getByText("Bracket Score")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Analyze Deck" })
      ).toBeEnabled();
    });

    it("asks the deck API for the deck by id and for the first page of the deck listing", async () => {
      await openSavedDeck();

      expect([...deckApiLines()].sort()).toEqual([
        `GET /api/decks/${DECK_ID}`,
        "GET /api/decks?page=0&limit=20",
      ]);
    });

    it("names the deck in the title bar and counts the main deck plus the commander out of 100 there and in the editor", async () => {
      await openSavedDeck();

      // The title bar counts "14 / 100"; the deck editor and the stats panel's deck checks "14/100".
      expect(screen.getByText("14 / 100")).toBeInTheDocument();
      expect(screen.getAllByText("14/100")).toHaveLength(2);
      expect(
        screen.getByRole("button", { name: "Talrand Spells" })
      ).toHaveAttribute("title", "Click to rename");
    });

    it("renames the deck from the title bar on Enter", async () => {
      await openSavedDeck();

      await userEvent.click(
        screen.getByRole("button", { name: "Talrand Spells" })
      );
      const name = screen.getByRole("textbox", { name: "Click to rename" });
      await userEvent.clear(name);
      await userEvent.type(name, "Talrand Tempo{Enter}");

      expect(
        await screen.findByRole("heading", { level: 1, name: "Talrand Tempo" })
      ).toBeInTheDocument();
      await waitFor(() =>
        expect(
          sent.filter(
            (request) => request.line === `PATCH /api/decks/${DECK_ID}`
          )
        ).toEqual([
          {
            line: `PATCH /api/decks/${DECK_ID}`,
            body: { name: "Talrand Tempo" },
          },
        ])
      );
    });

    it("duplicates the deck and opens the copy; currently through next/navigation's router, without the locale prefix (pinned)", async () => {
      server.use(
        http.post("/api/decks/:id/duplicate", async ({ request }) => {
          await record(request);
          return HttpResponse.json(
            savedDeck({ id: "deck-2", name: "Talrand Spells (copy)" })
          );
        })
      );
      const { push } = renderBuilder(DECK_ID, PLAYER);
      await screen.findByRole("heading", { level: 1, name: "Talrand Spells" });

      await userEvent.click(screen.getByRole("button", { name: "Duplicate" }));

      await waitFor(() => expect(push).toHaveBeenCalledWith("/builder/deck-2"));
      expect(deckApiLines()).toContain(`POST /api/decks/${DECK_ID}/duplicate`);
    });

    it("currently counts a Standard deck against 100 cards although Standard asks for 60 (pinned)", async () => {
      server.use(
        http.get("/api/decks/:id", () =>
          HttpResponse.json(
            savedDeck({
              format: "standard",
              commanderId: null,
              commanderName: null,
              cards: [COUNTERSPELL, ISLANDS],
            })
          )
        )
      );

      renderBuilder(DECK_ID, PLAYER);
      await screen.findByRole("heading", { level: 1, name: "Talrand Spells" });

      expect(screen.getByText("11 / 100")).toBeInTheDocument();
      expect(screen.getByText("11/100")).toBeInTheDocument();
      // The stats panel's deck checks already count against the format's size.
      expect(screen.getByText("11/60")).toBeInTheDocument();
    });

    it("lists commander-legal cards in the search panel before anything is typed", async () => {
      await openSavedDeck();

      await waitFor(() =>
        expect(sent.map((request) => request.line)).toContain(
          "GET /api/cache/search?query=legal%3Acommander&page=1"
        )
      );
      expect(
        await screen.findByText("No cards found. Try a different search.")
      ).toBeInTheDocument();
    });

    it("currently names the card search box only by its placeholder (pinned)", async () => {
      await openSavedDeck();

      expect(screen.getByPlaceholderText("Search cards…")).toHaveAccessibleName(
        ""
      );
    });

    it("currently labels a card of the deck grid 'Add <name> to deck' although clicking it looks the card up for the printing picker (pinned)", async () => {
      server.use(
        http.get(SCRYFALL_NAMED, async ({ request }) => {
          await record(request);
          return HttpResponse.json(
            { object: "error", code: "not_found", status: 404, details: "" },
            { status: 404 }
          );
        })
      );
      await openSavedDeck();

      await userEvent.click(
        screen.getByRole("button", { name: "Add Counterspell to deck" })
      );

      await waitFor(() =>
        expect(sent.map((request) => request.line)).toContain(
          `GET ${SCRYFALL_NAMED}?fuzzy=Counterspell`
        )
      );
      expect(deckApiLines().filter((line) => !line.startsWith("GET"))).toEqual(
        []
      );
    });
  });

  describe("when the deck cannot be opened", () => {
    it("offers 'Try again' after a 503 and opens the deck once the retry succeeds", async () => {
      let attempts = 0;
      server.use(
        http.get("/api/decks/:id", async ({ request }) => {
          await record(request);
          attempts += 1;
          return attempts === 1
            ? HttpResponse.json(
                { error: "Database unavailable" },
                { status: 503 }
              )
            : HttpResponse.json(savedDeck());
        })
      );
      renderBuilder(DECK_ID, PLAYER);

      expect(
        await screen.findByText("Something went wrong")
      ).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveTextContent(
        "An unexpected error interrupted this page."
      );
      await userEvent.click(screen.getByRole("button", { name: "Try again" }));

      expect(
        await screen.findByRole("heading", { level: 1, name: "Talrand Spells" })
      ).toBeInTheDocument();
      expect(
        deckApiLines().filter((line) => line === `GET /api/decks/${DECK_ID}`)
      ).toHaveLength(2);
    });

    it("currently keeps the error and an enabled 'Try again' on screen while the retry loads (pinned)", async () => {
      const retry = heldUntilReleased(() => HttpResponse.json(savedDeck()));
      let attempts = 0;
      server.use(
        http.get("/api/decks/:id", async (input) => {
          attempts += 1;
          if (attempts > 1) return retry.handler(input);
          await record(input.request);
          return HttpResponse.json(
            { error: "Database unavailable" },
            { status: 503 }
          );
        })
      );
      renderBuilder(DECK_ID, PLAYER);

      await userEvent.click(
        await screen.findByRole("button", { name: "Try again" })
      );
      await waitFor(() => expect(attempts).toBe(2));

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
      expect(screen.queryByText("Loading deck…")).not.toBeInTheDocument();

      act(() => retry.release());
      expect(
        await screen.findByRole("heading", { level: 1, name: "Talrand Spells" })
      ).toBeInTheDocument();
    });

    it("currently answers a deck the server does not find with 'Something went wrong' and a retry, not 'Deck not found' (pinned)", async () => {
      server.use(
        http.get("/api/decks/:id", () =>
          HttpResponse.json({ error: "Deck not found" }, { status: 404 })
        ),
        http.get("/api/decks", () =>
          HttpResponse.json({ decks: [], total: 0, page: 0, limit: 20 })
        )
      );

      renderBuilder(DECK_ID, PLAYER);

      expect(
        await screen.findByText("Something went wrong")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Try again" })
      ).toBeInTheDocument();
      expect(screen.queryByText("Deck not found")).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Back to My Decks" })
      ).toHaveAttribute("href", "/decks");
    });

    it("currently reports a failed deck listing while the deck itself is still loading (pinned)", async () => {
      const deckRequest = heldUntilReleased(() =>
        HttpResponse.json(savedDeck())
      );
      server.use(
        http.get("/api/decks/:id", deckRequest.handler),
        http.get("/api/decks", () =>
          HttpResponse.json({ error: "Database unavailable" }, { status: 503 })
        )
      );

      renderBuilder(DECK_ID, PLAYER);

      expect(
        await screen.findByText("Could not load your decks")
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();

      act(() => deckRequest.release());
      expect(
        await screen.findByRole("heading", { level: 1, name: "Talrand Spells" })
      ).toBeInTheDocument();
    });
  });

  describe("the guest deck", () => {
    it("opens the browser-only guest deck, empty at 0 of 100, without calling the deck API", async () => {
      renderBuilder(GUEST_DECK_ID, null);

      expect(
        await screen.findByRole("heading", { level: 1, name: "Guest Deck" })
      ).toBeInTheDocument();
      expect(screen.getByText("Guest deck.")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Create account" })
      ).toHaveAttribute("href", "/auth/signup?callbackUrl=/builder/guest");
      expect(screen.getByText("0 / 100")).toBeInTheDocument();
      expect(screen.getAllByText("0/100")).toHaveLength(2);
      expect(deckApiLines()).toEqual([]);
    });

    it("hides Duplicate and the public switch, and keeps AI analysis off without a commander", async () => {
      renderBuilder(GUEST_DECK_ID, null);
      await screen.findByRole("heading", { level: 1, name: "Guest Deck" });

      expect(
        screen.queryByRole("button", { name: "Duplicate" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("switch", { name: "Make deck public" })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Analyze Deck" })
      ).toBeDisabled();
    });

    it("offers Duplicate and the public switch on a saved deck", async () => {
      await openSavedDeck();

      expect(
        screen.getByRole("button", { name: "Duplicate" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("switch", { name: "Make deck public" })
      ).not.toBeChecked();
    });

    // The share popover was dropped from this row by 7ce381b4 without a word (OD-01 mounts it again).
    it("offers the share link popover among the deck actions of a saved deck", async () => {
      await openSavedDeck();

      await userEvent.click(screen.getByRole("button", { name: "Share" }));

      expect(
        screen.getByRole("dialog", { name: "Share deck" })
      ).toBeInTheDocument();
    });

    it("offers no share link on the browser-only guest deck", async () => {
      renderBuilder(GUEST_DECK_ID, null);
      await screen.findByRole("heading", { level: 1, name: "Guest Deck" });

      expect(
        screen.queryByRole("button", { name: "Share" })
      ).not.toBeInTheDocument();
    });
  });

  describe("panel toggles", () => {
    it("shows and hides the search filters from the name search", async () => {
      await openSavedDeck();

      await userEvent.click(
        screen.getByRole("button", { name: "Show filters" })
      );
      expect(
        screen.getByRole("button", { name: "Hide filters" })
      ).toBeInTheDocument();
      expect(screen.getByText("Colors")).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", { name: "Hide filters" })
      );
      expect(
        screen.getByRole("button", { name: "Show filters" })
      ).toBeInTheDocument();
      expect(screen.queryByText("Colors")).not.toBeInTheDocument();
    });

    it("switches the search panel between name, set and colour search", async () => {
      await openSavedDeck();

      await userEvent.click(searchMode("By Set"));
      expect(
        screen.queryByRole("button", { name: "Show filters" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText("Search cards…")
      ).not.toBeInTheDocument();

      await userEvent.click(searchMode("By Color"));
      expect(screen.getByRole("button", { name: /^Blue/ })).toBeInTheDocument();

      await userEvent.click(searchMode("Name"));
      expect(
        screen.getByRole("button", { name: "Show filters" })
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Search cards…")).toBeInTheDocument();
    });

    it("currently gives two search modes the names of the deck's sort and grouping buttons (pinned)", async () => {
      await openSavedDeck();

      const named = screen.getAllByRole("button", { name: "Name" });
      expect(named).toHaveLength(2);
      expect(named[1]).toHaveAccessibleDescription(/^Sort by Name/);
      const byColor = screen.getAllByRole("button", { name: "By Color" });
      expect(byColor).toHaveLength(2);
      expect(byColor[1]).toHaveAccessibleDescription("Group By Color");
    });

    it("resizes the search panel from the keyboard in 10-pixel steps and remembers the width", async () => {
      await openSavedDeck();
      const handle = screen.getByRole("separator", {
        name: "Search panel width",
      });
      expect(handle).toHaveAttribute("aria-valuenow", "300");

      fireEvent.keyDown(handle, { key: "ArrowRight" });

      expect(handle).toHaveAttribute("aria-valuenow", "310");
      expect(localStorage.getItem("builder-search-panel-width")).toBe("310");
    });

    it("shows one panel at a time below the lg breakpoint, the deck first, chosen from the bottom tab bar", async () => {
      await openSavedDeck();
      const searchPanel = searchMode("By Set");
      const deckPanel = screen.getByRole("button", { name: "Main (14)" });
      const statsPanel = screen.getByRole("region", { name: "Deck details" });
      expect([
        hiddenBelowLg(searchPanel),
        hiddenBelowLg(deckPanel),
        hiddenBelowLg(statsPanel),
      ]).toEqual([true, false, true]);

      await userEvent.click(screen.getByRole("button", { name: "Stats" }));
      expect([
        hiddenBelowLg(searchPanel),
        hiddenBelowLg(deckPanel),
        hiddenBelowLg(statsPanel),
      ]).toEqual([true, true, false]);

      await userEvent.click(screen.getByRole("button", { name: "Search" }));
      expect([
        hiddenBelowLg(searchPanel),
        hiddenBelowLg(deckPanel),
        hiddenBelowLg(statsPanel),
      ]).toEqual([false, true, true]);
    });

    it("currently marks the active mobile tab by colour only, with no pressed or current state (pinned)", async () => {
      await openSavedDeck();

      for (const tab of ["Search", "Deck", "Stats"]) {
        const button = screen.getByRole("button", { name: tab });
        expect(button).not.toHaveAttribute("aria-pressed");
        expect(button).not.toHaveAttribute("aria-current");
        expect(button).not.toHaveAttribute("aria-selected");
      }
    });
  });

  describe("stats panel", () => {
    it("mounts the deck details panel, whose target bracket saves on this deck", async () => {
      await openSavedDeck();
      const details = screen.getByRole("region", { name: "Deck details" });
      expect(
        within(details).getByRole("button", { name: "Bracket 2: Core" })
      ).toHaveAttribute("aria-pressed", "true");

      await userEvent.click(
        within(details).getByRole("button", { name: "Bracket 3: Upgraded" })
      );

      await waitFor(() =>
        expect(
          sent.filter(
            (request) => request.line === `PATCH /api/decks/${DECK_ID}`
          )
        ).toEqual([
          { line: `PATCH /api/decks/${DECK_ID}`, body: { targetBracket: 3 } },
        ])
      );
      expect(
        within(details).getByRole("button", { name: "Bracket 3: Upgraded" })
      ).toHaveAttribute("aria-pressed", "true");
    });

    it("tells the player the month's AI suggestions are used up when the server refuses with 429", async () => {
      server.use(
        http.post("/api/ai/suggest", async ({ request }) => {
          await record(request);
          return HttpResponse.json(
            aiCallDenialBody({
              code: "allowance_exhausted",
              route: "suggest",
              limit: 30,
              resetsAt: new Date("2026-12-01T00:00:00.000Z"),
            }),
            { status: 429 }
          );
        })
      );
      await openSavedDeck();

      await userEvent.click(
        screen.getByRole("button", { name: "Analyze Deck" })
      );

      expect(
        await screen.findByText(
          "Monthly AI suggestions used up (30). They reset on December 1, 2026. Everything else keeps working."
        )
      ).toBeInTheDocument();
      expect(
        sent.filter((request) => request.line === "POST /api/ai/suggest")
      ).toHaveLength(1);
    });
  });

  describe("deck rows", () => {
    it("offers the note, printing, commander and copy controls on each row of the list view", async () => {
      await openSavedDeck();

      await userEvent.click(screen.getByRole("button", { name: "List view" }));

      expect(
        screen.getByRole("button", { name: "Add a note to Counterspell" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: "Change the printing of Counterspell",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: "Set Baral, Chief of Compliance as commander",
        })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Set Counterspell as commander" })
      ).not.toBeInTheDocument();
      const islands = screen.getByRole("group", { name: "Copies of Island" });
      expect(
        within(islands).getByRole("button", { name: "Add a copy of Island" })
      ).toBeEnabled();
      expect(
        within(islands).getByRole("button", { name: "Remove a copy of Island" })
      ).toBeEnabled();
    });

    // Found by the P1-12 journeys (2026-11-12): the row left the deck, but the page swapped the
    // editor for "Loading deck…" and never came back, because the store still counted the row.
    it("keeps the editor open, a card lighter, after a row is removed", async () => {
      server.use(
        http.delete("/api/decks/:id/cards/:cardId", async ({ request }) => {
          await record(request);
          return new HttpResponse(null, { status: 204 });
        })
      );
      await openSavedDeck();

      await userEvent.click(
        screen.getByRole("button", { name: "Remove Counterspell" })
      );

      await waitFor(() =>
        expect(deckApiLines()).toContain(
          `DELETE /api/decks/${DECK_ID}/cards/${COUNTERSPELL.id}`
        )
      );
      expect(screen.queryByText("Loading deck…")).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 1, name: "Talrand Spells" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Main (13)" })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Remove Counterspell" })
      ).not.toBeInTheDocument();
    });
  });
});
