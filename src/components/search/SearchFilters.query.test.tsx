/**
 * Characterization of the Scryfall query the builder's name search sends for each combination of
 * search filters (P1-21, audit catalog A2). `SearchFilters.test.tsx` pins the panel itself; this
 * file pins what its choices become on the wire, so the planned split of the panel (audit catalog
 * SF) and the move of the query builder into the card-catalog context cannot change a query
 * unnoticed (ADR 0005, rule 6).
 *
 * Sociable: the real search box, filters panel, query builder (`buildSearchQuery`), results hook
 * (`useCardSearchResults`), Scryfall client and result list run. MSW stands in for the shared
 * search cache the browser reads (`/api/cache/search`); any other request fails the test, so a
 * query that fell through to api.scryfall.com would show.
 *
 * The parent below reproduces the builder page's wiring for name search, which lives in private
 * functions of `src/app/[locale]/builder/[deckId]/page.tsx`: `buildSearchQueryFromMode` falls
 * through to `buildSearchQuery(searchText, filters, format)` (:190-191) and the results hook
 * receives `collectionOnly: filters.collectionOnly === true` (:525-529). The page's own test
 * (P1-11) pins the page; when the split extracts this wiring into a hook, the parent becomes that
 * hook and no assertion changes.
 *
 * Tests named "currently … (pinned)" record odd behaviour on purpose; a `fix/` pull request that
 * changes it flips the test with its own Red.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { SearchBar } from "./SearchBar";
import { SearchFilters } from "./SearchFilters";
import { SearchResults } from "./SearchResults";
import {
  useCardSearchResults,
  type SessionStatus,
} from "@/hooks/useCardSearchResults";
import { useCollectionStore } from "@/lib/collection/store";
import type { DeckFormat } from "@/lib/deck/formats";
import type { SearchFilters as SearchFiltersValue } from "@/lib/deck/types";
import { buildSearchQuery } from "@/lib/scryfall/search";
import {
  EMPTY_SEARCH_RESPONSE,
  type ScryfallCard,
  type ScryfallSearchResponse,
} from "@/lib/scryfall/types";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";

/** The filters the builder page starts from (`DEFAULT_FILTERS`, builder page.tsx:250-269). */
const PAGE_DEFAULTS: SearchFiltersValue = {
  colors: [],
  colorMode: "or",
  colorlessFilter: false,
  landFilter: false,
  types: [],
  cmcMode: "range",
  cmcMin: null,
  cmcMax: null,
  cmcExact: null,
  priceMin: null,
  priceMax: null,
  subtype: "",
  keyword: "",
  powerMin: null,
  powerMax: null,
  toughnessMin: null,
  toughnessMax: null,
  interactionType: null,
};

const PRESETS_KEY = "magicaibuilder:filter-presets";

/** The builder's name search: the search box, the filters, and the list they produce. */
function NameSearch({
  format,
  sessionStatus,
}: {
  readonly format: DeckFormat;
  readonly sessionStatus: SessionStatus;
}) {
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState(PAGE_DEFAULTS);
  const results = useCardSearchResults(
    buildSearchQuery(searchText, filters, format),
    { collectionOnly: filters.collectionOnly === true, sessionStatus }
  );
  return (
    <>
      <SearchBar onSearch={setSearchText} isLoading={results.isLoading} />
      <SearchFilters filters={filters} onChange={setFilters} />
      <SearchResults
        cards={results.cards}
        isLoading={results.isLoading}
        error={results.error}
        totalCards={results.totalCards}
        collectionOnly={results.collectionOnly}
      />
    </>
  );
}

function renderNameSearch(
  options: {
    readonly format?: DeckFormat;
    readonly sessionStatus?: SessionStatus;
  } = {}
) {
  renderWithProviders(
    <NameSearch
      format={options.format ?? "commander"}
      sessionStatus={options.sessionStatus ?? "authenticated"}
    />,
    { session: null }
  );
  return userEvent.setup();
}

/** The `query` of every search-cache read, in the order the browser sent them. */
let searched: string[] = [];
/** What the shared search cache answers; empty unless a test says otherwise. */
let cachedPage: ScryfallSearchResponse = EMPTY_SEARCH_RESPONSE;

function card(id: string, name: string): ScryfallCard {
  return { id, name, cmc: 1, type_line: "Artifact", color_identity: [] };
}

/** One user action on the name search, named as the player would say it. */
type Step = (user: ReturnType<typeof userEvent.setup>) => Promise<void>;

const click =
  (name: string): Step =>
  (user) =>
    user.click(screen.getByRole("button", { name }));
/** A colour match tab; only those carry a title, which tells them from the CMC "Exact". */
const match =
  (name: "Any" | "All" | "Exact"): Step =>
  (user) =>
    user.click(screen.getByRole("button", { name, description: /\(.+…\)$/ }));
const cmcMode =
  (name: "Range" | "Exact" | "Min" | "Max"): Step =>
  (user) =>
    user.click(screen.getByRole("button", { name, description: "" }));
const fill =
  (placeholder: string, text: string): Step =>
  (user) =>
    user.type(screen.getByPlaceholderText(placeholder), text);
const role =
  (option: string): Step =>
  (user) =>
    user.selectOptions(screen.getByDisplayValue("None"), option);
/** Types in the search box; it reports the text after its 400 ms debounce. */
const search =
  (text: string): Step =>
  (user) =>
    user.type(screen.getByPlaceholderText("Search cards…"), text);

async function lastSearchIs(query: string): Promise<void> {
  await waitFor(() => expect(searched.at(-1)).toBe(query));
}

beforeEach(() => {
  searched = [];
  cachedPage = EMPTY_SEARCH_RESPONSE;
  localStorage.clear();
  useCollectionStore.setState({
    collectionCards: {},
    collectionCardsFoil: {},
    isLoading: false,
    loadError: false,
  });
});

describe("characterization: the Scryfall query of the name search filters", () => {
  setupMsw(
    http.get("/api/cache/search", ({ request }) => {
      searched.push(new URL(request.url).searchParams.get("query") ?? "");
      return HttpResponse.json({ hit: true, data: cachedPage });
    })
  );

  const COMBINATIONS: ReadonlyArray<{
    readonly choice: string;
    readonly steps: readonly Step[];
    readonly query: string;
  }> = [
    { choice: "nothing", steps: [], query: "legal:commander" },
    {
      choice:
        "White alone, which also matches colourless cards (identity within White)",
      steps: [click("White")],
      query: "id<=W legal:commander",
    },
    {
      choice: "Blue then White, joined in click order",
      steps: [click("Blue"), click("White")],
      query: "id<=UW legal:commander",
    },
    {
      choice: "White and Blue, matching All",
      steps: [click("White"), click("Blue"), match("All")],
      query: "c>=WU legal:commander",
    },
    {
      choice: "White and Blue, matching Exact",
      steps: [click("White"), click("Blue"), match("Exact")],
      query: "c=WU legal:commander",
    },
    {
      choice:
        "White and Blue matching All, then Blue removed: currently the hidden match still applies (pinned)",
      steps: [click("White"), click("Blue"), match("All"), click("Blue")],
      query: "c>=W legal:commander",
    },
    {
      choice: "Colorless",
      steps: [click("Colorless")],
      query: "c:c legal:commander",
    },
    {
      choice: "Red, then Colorless, which drops Red",
      steps: [click("Red"), click("Colorless")],
      query: "c:c legal:commander",
    },
    {
      choice: "Land",
      steps: [click("Land")],
      query: "t:land legal:commander",
    },
    {
      choice: "Green and Land",
      steps: [click("Green"), click("Land")],
      query: "id<=G t:land legal:commander",
    },
    {
      choice: "mana value from 2 to 4",
      steps: [fill("Min", "2"), fill("Max", "4")],
      query: "cmc>=2 cmc<=4 legal:commander",
    },
    {
      choice: "mana value exactly 3",
      steps: [cmcMode("Exact"), fill("e.g. 3", "3")],
      query: "cmc=3 legal:commander",
    },
    {
      choice: "mana value at least 5",
      steps: [cmcMode("Min"), fill("≥", "5")],
      query: "cmc>=5 legal:commander",
    },
    {
      choice: "mana value at most 2",
      steps: [cmcMode("Max"), fill("≤", "2")],
      query: "cmc<=2 legal:commander",
    },
    {
      // White comes second so that the cleared query is one the cache has not answered yet.
      choice:
        "a minimum of 5 and White, then the Exact mode, which clears the minimum",
      steps: [fill("Min", "5"), click("White"), cmcMode("Exact")],
      query: "id<=W legal:commander",
    },
    {
      choice: "currently a minimum above the maximum, sent as is (pinned)",
      steps: [fill("Min", "5"), fill("Max", "2")],
      query: "cmc>=5 cmc<=2 legal:commander",
    },
    {
      choice: "a price from 0.5 to 10 US dollars",
      steps: [fill("Min $", "0.5"), fill("Max $", "10")],
      query: "usd>=0.5 usd<=10 legal:commander",
    },
    {
      choice: "the subtype ' Elf ', trimmed",
      steps: [fill("e.g. Elf, Dragon", " Elf ")],
      query: "t:Elf legal:commander",
    },
    {
      choice: "the multi-word subtype 'Time Lord', quoted as one type",
      steps: [fill("e.g. Elf, Dragon", "Time Lord")],
      query: 't:"Time Lord" legal:commander',
    },
    {
      choice: "the keyword 'first strike', quoted as one ability",
      steps: [fill("e.g. Flying, Trample", "first strike")],
      query: 'keyword:"first strike" legal:commander',
    },
    {
      choice: "the Removal role",
      steps: [role("Removal")],
      query: '(o:"destroy target" OR o:"exile target") legal:commander',
    },
    {
      choice: "the Counterspell role",
      steps: [role("Counterspell")],
      query: '(t:instant o:"counter target") legal:commander',
    },
    {
      choice: "Land and the Ramp role, which repeats t:land",
      steps: [click("Land"), role("Ramp")],
      query: 't:land (t:land OR o:"add {") legal:commander',
    },
    {
      choice: "the name 'sol' and White",
      steps: [search("sol"), click("White")],
      query: "name:/sol/ id<=W legal:commander",
    },
    {
      choice: "typed Scryfall syntax and Blue, the syntax kept as typed",
      steps: [search("o:draw"), click("Blue")],
      query: "o:draw id<=U legal:commander",
    },
    {
      choice: "every filter at once, in the builder's fixed order",
      steps: [
        search("drake"),
        click("White"),
        click("Blue"),
        match("All"),
        click("Land"),
        fill("Min", "1"),
        fill("Max", "3"),
        fill("Max $", "5"),
        fill("e.g. Elf, Dragon", "Wizard"),
        fill("e.g. Flying, Trample", "Flying"),
        role("Draw"),
      ],
      query:
        'name:/drake/ c>=WU t:land cmc>=1 cmc<=3 usd<=5 t:Wizard keyword:Flying o:"draw a card" legal:commander',
    },
  ];

  it.each(COMBINATIONS)("$choice → $query", async ({ steps, query }) => {
    const user = renderNameSearch();
    await lastSearchIs("legal:commander");

    for (const step of steps) await step(user);

    await lastSearchIs(query);
  });

  it("scopes the query to the deck's format", async () => {
    const user = renderNameSearch({ format: "standard" });

    await click("White")(user);

    await lastSearchIs("id<=W legal:standard");
  });

  it("adds the card type and power bound of a loaded preset, the only way to set them", async () => {
    localStorage.setItem(
      PRESETS_KEY,
      JSON.stringify([
        {
          name: "Big creatures",
          filters: {
            ...PAGE_DEFAULTS,
            types: ["Creature"],
            powerMin: 5,
            toughnessMax: 6,
          },
        },
      ])
    );
    const user = renderNameSearch();

    await user.selectOptions(
      screen.getByDisplayValue("Load a preset…"),
      "Big creatures"
    );

    await lastSearchIs("(type:Creature) pow>=5 tou<=6 legal:commander");
  });

  describe("with Collection only", () => {
    it("adds nothing to the query, reads it again through the owned-card scan and lists only owned cards", async () => {
      cachedPage = {
        object: "list",
        total_cards: 2,
        has_more: false,
        data: [
          card("sol-ring-cmm", "Sol Ring"),
          card("arcane-signet-cmm", "Arcane Signet"),
        ],
      };
      useCollectionStore.getState().hydrateCollection([
        {
          id: "row-1",
          scryfallId: "sol-ring-c21",
          name: "Sol Ring",
          quantity: 1,
          foil: false,
          createdAt: "2026-11-01T00:00:00.000Z",
        },
      ]);
      const user = renderNameSearch();
      expect(await screen.findByText("Arcane Signet")).toBeDefined();
      expect(searched).toEqual(["legal:commander"]);

      await click("Only cards I own")(user);

      expect(await screen.findByText("1 card you own")).toBeDefined();
      expect(screen.getByText("Sol Ring")).toBeDefined();
      expect(screen.queryByText("Arcane Signet")).toBeNull();
      expect(searched).toEqual(["legal:commander", "legal:commander"]);
    });

    it("sends nothing for a guest and asks them to sign in", async () => {
      const user = renderNameSearch({ sessionStatus: "unauthenticated" });
      await lastSearchIs("legal:commander");

      await click("Only cards I own")(user);
      await click("White")(user);

      expect(
        await screen.findByText(
          "Sign in and add cards to your collection to see only the cards you own."
        )
      ).toBeDefined();
      expect(searched).toEqual(["legal:commander"]);
    });
  });
});
