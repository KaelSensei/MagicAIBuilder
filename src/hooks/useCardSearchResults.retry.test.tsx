/**
 * Which failed card searches the builder's search panel sends again, seen from what the player
 * reads and from what Scryfall receives.
 *
 * Sociable: `useCardSearchResults`, the Scryfall client and its request queue, and
 * `SearchResults` run for real. MSW stands in for the shared search cache, which misses, and for
 * api.scryfall.com. The query client has the app's default of two retries
 * (`app/[locale]/providers.tsx`), so a search that leaves retrying to that default is caught. It
 * waits nothing between attempts, so no test sits through TanStack Query's backoff; production
 * keeps that backoff.
 */
import { screen } from "@testing-library/react";
import type { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { SearchResults } from "@/components/search/SearchResults";
import { useCollectionStore } from "@/lib/collection/store";
import { __resetRateLimiter } from "@/lib/scryfall/client";
import { SEARCH_NOT_FOUND_RECORDED } from "@/lib/scryfall/fixtures/e2e-stand-in-v1";
import {
  SEARCH_REJECTED_QUERY,
  SEARCH_REJECTED_RECORDED,
} from "@/lib/scryfall/fixtures/search-rejected-v1";
import { setupMsw } from "@/test/msw";
import { aTestQueryClient, renderWithProviders } from "@/test/render";
import { useCardSearchResults } from "./useCardSearchResults";

const SCRYFALL_SEARCH = "https://api.scryfall.com/cards/search";

/** A well-formed query; what Scryfall answers to it is up to each test. */
const QUERY = "t:artifact legal:commander";

const REJECTED_MESSAGE =
  "Scryfall could not read this search. Check its syntax.";
const UNAVAILABLE_MESSAGE =
  "Card search is unavailable right now. Try again in a moment.";

/** The `q` of every search that reached Scryfall, in order. */
let sentToScryfall: string[] = [];

const server = setupMsw(
  // The shared cache misses, so every search goes on to Scryfall.
  http.get("*/api/cache/search", () => HttpResponse.json({ hit: false }))
);

/** Scryfall answers every search with `answer()`, and each search is recorded. */
function scryfallAnswers(answer: () => Response): void {
  server.use(
    http.get(SCRYFALL_SEARCH, ({ request }) => {
      sentToScryfall.push(new URL(request.url).searchParams.get("q") ?? "");
      return answer();
    })
  );
}

/** The search panel as the builder composes it: the hook's results, rendered. */
function SearchPanel({
  query,
  collectionOnly,
}: {
  readonly query: string;
  readonly collectionOnly: boolean;
}) {
  const results = useCardSearchResults(query, {
    collectionOnly,
    sessionStatus: "authenticated",
  });
  // These tests are about retries; the builder decides an empty result's next
  // step, pinned in `page.search-query.test.tsx`.
  return <SearchResults {...results} nextStep={{ kind: "none" }} />;
}

/**
 * The kit's test client, with the defaults these tests are about: the app's two retries
 * (`app/[locale]/providers.tsx`) in place of the kit's none, and no wait between attempts.
 */
function anAppLikeQueryClient(): QueryClient {
  const client = aTestQueryClient();
  client.setDefaultOptions({ queries: { retry: 2, retryDelay: 0 } });
  return client;
}

/** Runs `query` in the panel, with "Collection only" on or off. */
function search(query: string, options: { readonly collectionOnly: boolean }) {
  const appQueryClient = anAppLikeQueryClient();
  renderWithProviders(
    <SearchPanel query={query} collectionOnly={options.collectionOnly} />,
    { queryClient: appQueryClient }
  );
}

/** Puts one Sol Ring in the player's collection, so "Collection only" has something to filter by. */
function ownASolRing(): void {
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
}

beforeEach(() => {
  sentToScryfall = [];
  __resetRateLimiter();
  useCollectionStore.setState({
    collectionCards: {},
    collectionCardsFoil: {},
    isLoading: false,
    loadError: false,
  });
});

describe("a card search Scryfall rejects", () => {
  it("is sent once, and the player reads that Scryfall could not read it", async () => {
    scryfallAnswers(() =>
      HttpResponse.json(SEARCH_REJECTED_RECORDED, { status: 400 })
    );

    search(SEARCH_REJECTED_QUERY, { collectionOnly: false });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      REJECTED_MESSAGE
    );
    expect(sentToScryfall).toEqual([SEARCH_REJECTED_QUERY]);
  });

  it("is sent once with Collection only on", async () => {
    ownASolRing();
    scryfallAnswers(() =>
      HttpResponse.json(SEARCH_REJECTED_RECORDED, { status: 400 })
    );

    search(SEARCH_REJECTED_QUERY, { collectionOnly: true });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      REJECTED_MESSAGE
    );
    expect(sentToScryfall).toEqual([SEARCH_REJECTED_QUERY]);
  });
});

describe("a card search that failed for a reason that can pass", () => {
  it("is sent twice more when Scryfall is unavailable, then says search is unavailable", async () => {
    scryfallAnswers(
      () =>
        new HttpResponse(null, {
          status: 503,
          statusText: "Service Unavailable",
        })
    );

    search(QUERY, { collectionOnly: false });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      UNAVAILABLE_MESSAGE
    );
    expect(sentToScryfall).toEqual([QUERY, QUERY, QUERY]);
  });

  it("is sent twice more when the network fails", async () => {
    scryfallAnswers(() => HttpResponse.error());

    search(QUERY, { collectionOnly: false });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      UNAVAILABLE_MESSAGE
    );
    expect(sentToScryfall).toEqual([QUERY, QUERY, QUERY]);
  });

  it("is sent twice more when Scryfall answers too many requests (429)", async () => {
    scryfallAnswers(
      () =>
        new HttpResponse(null, {
          status: 429,
          statusText: "Too Many Requests",
        })
    );

    search(QUERY, { collectionOnly: false });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      UNAVAILABLE_MESSAGE
    );
    expect(sentToScryfall).toEqual([QUERY, QUERY, QUERY]);
  });

  it("is sent twice more with Collection only on when Scryfall is unavailable", async () => {
    ownASolRing();
    scryfallAnswers(
      () =>
        new HttpResponse(null, {
          status: 503,
          statusText: "Service Unavailable",
        })
    );

    search(QUERY, { collectionOnly: true });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      UNAVAILABLE_MESSAGE
    );
    expect(sentToScryfall).toEqual([QUERY, QUERY, QUERY]);
  });
});

describe("a card search that matches nothing", () => {
  it("is sent once and shows the empty state, not a failure", async () => {
    scryfallAnswers(() =>
      HttpResponse.json(SEARCH_NOT_FOUND_RECORDED, { status: 404 })
    );

    search(QUERY, { collectionOnly: false });

    expect(
      await screen.findByText("No cards found. Try a different search.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(sentToScryfall).toEqual([QUERY]);
  });
});
