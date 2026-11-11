import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCardSearchResults } from "./useCardSearchResults";
import { useCollectionStore } from "@/lib/collection/store";
import { __resetRateLimiter } from "@/lib/scryfall/client";
import type {
  ScryfallCard,
  ScryfallSearchResponse,
} from "@/lib/scryfall/types";

// Sociable: the real collection store and the real Scryfall client run; only HTTP is replaced,
// by an in-memory copy of the shared search cache the browser reads (`/api/cache/search`).

const QUERY = "t:artifact legal:commander";

function card(id: string, name: string): ScryfallCard {
  return { id, name, cmc: 0, type_line: "Artifact", color_identity: [] };
}

function page(
  cards: readonly ScryfallCard[],
  totalCards: number,
  hasMore: boolean
): ScryfallSearchResponse {
  return {
    object: "list",
    total_cards: totalCards,
    has_more: hasMore,
    data: [...cards],
  };
}

interface SearchRequest {
  readonly query: string;
  readonly page: number;
}

/** Answers search-cache reads from `pages` (page 1 first) and records every read. */
function serveSearch(
  pages: readonly ScryfallSearchResponse[]
): SearchRequest[] {
  const requests: SearchRequest[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://localhost");
      if (url.pathname !== "/api/cache/search")
        return new Response(null, { status: 404 });
      const request = {
        query: url.searchParams.get("query") ?? "",
        page: Number(url.searchParams.get("page")),
      };
      requests.push(request);
      const body =
        request.query === QUERY ? pages[request.page - 1] : undefined;
      return body
        ? Response.json({ data: body })
        : new Response(null, { status: 404 });
    })
  );
  return requests;
}

/** Puts these rows in the player's collection, as the API sends them. */
function own(
  ...rows: ReadonlyArray<{
    scryfallId: string;
    name: string;
    quantity?: number;
  }>
) {
  useCollectionStore.getState().hydrateCollection(
    rows.map((row, index) => ({
      id: `row-${index}`,
      scryfallId: row.scryfallId,
      name: row.name,
      quantity: row.quantity ?? 1,
      foil: false,
      createdAt: "2026-11-01T00:00:00.000Z",
    }))
  );
}

function wrapper({ children }: { readonly children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  __resetRateLimiter();
  useCollectionStore.setState({
    collectionCards: {},
    collectionCardsFoil: {},
    isLoading: false,
    loadError: false,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useCardSearchResults with Collection only off", () => {
  it("shows Scryfall's page unchanged, owned or not", async () => {
    serveSearch([
      page(
        [
          card("sol-ring-cmm", "Sol Ring"),
          card("arcane-signet-cmm", "Arcane Signet"),
        ],
        2,
        false
      ),
    ]);
    own({ scryfallId: "sol-ring-c21", name: "Sol Ring" });

    const { result } = renderHook(
      () =>
        useCardSearchResults(QUERY, {
          collectionOnly: false,
          sessionStatus: "authenticated",
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.cards.map((c) => c.name)).toEqual([
      "Sol Ring",
      "Arcane Signet",
    ]);
    expect(result.current.totalCards).toBe(2);
    expect(result.current.collectionOnly).toBeUndefined();
  });
});

describe("useCardSearchResults with Collection only on", () => {
  it("shows only the cards the player owns, in any printing, double-faced cards included", async () => {
    serveSearch([
      page(
        [
          card("sol-ring-cmm", "Sol Ring"),
          card("arcane-signet-cmm", "Arcane Signet"),
          card("esika-khm", "Esika, God of the Tree // The Prismatic Bridge"),
        ],
        3,
        false
      ),
    ]);
    own(
      { scryfallId: "sol-ring-c21", name: "Sol Ring" },
      {
        scryfallId: "esika-prm",
        name: "Esika, God of the Tree // The Prismatic Bridge",
      }
    );

    const { result } = renderHook(
      () =>
        useCardSearchResults(QUERY, {
          collectionOnly: true,
          sessionStatus: "authenticated",
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.cards.map((c) => c.name)).toEqual([
      "Sol Ring",
      "Esika, God of the Tree // The Prismatic Bridge",
    ]);
  });

  it("reads the next page when the first holds too few owned cards, and says how much it checked", async () => {
    const requests = serveSearch([
      page(
        [
          card("sol-ring-cmm", "Sol Ring"),
          card("arcane-signet-cmm", "Arcane Signet"),
        ],
        3,
        true
      ),
      page([card("command-tower-cmm", "Command Tower")], 3, false),
    ]);
    own(
      { scryfallId: "sol-ring-c21", name: "Sol Ring" },
      { scryfallId: "command-tower-c21", name: "Command Tower" }
    );

    const { result } = renderHook(
      () =>
        useCardSearchResults(QUERY, {
          collectionOnly: true,
          sessionStatus: "authenticated",
        }),
      { wrapper }
    );

    await waitFor(
      () =>
        expect(result.current.cards.map((c) => c.name)).toEqual([
          "Sol Ring",
          "Command Tower",
        ]),
      { timeout: 3000 }
    );
    expect(requests.map((r) => r.page)).toEqual([1, 2]);
    expect(result.current.collectionOnly).toEqual({
      kind: "scanned",
      scannedCards: 3,
      totalMatches: 3,
      complete: true,
    });
  });
});

describe("useCardSearchResults with Collection only on and nothing to filter by", () => {
  it("tells a guest that the filter needs an account, without searching", async () => {
    const requests = serveSearch([
      page([card("sol-ring-cmm", "Sol Ring")], 1, false),
    ]);

    const { result } = renderHook(
      () =>
        useCardSearchResults(QUERY, {
          collectionOnly: true,
          sessionStatus: "unauthenticated",
        }),
      { wrapper }
    );

    await waitFor(() =>
      expect(result.current.collectionOnly).toEqual({ kind: "signedOut" })
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.cards).toEqual([]);
    expect(requests).toEqual([]);
  });

  it("tells a player whose collection is empty that it is empty, without searching", async () => {
    const requests = serveSearch([
      page([card("sol-ring-cmm", "Sol Ring")], 1, false),
    ]);
    own({ scryfallId: "sol-ring-c21", name: "Sol Ring", quantity: 0 });

    const { result } = renderHook(
      () =>
        useCardSearchResults(QUERY, {
          collectionOnly: true,
          sessionStatus: "authenticated",
        }),
      { wrapper }
    );

    await waitFor(() =>
      expect(result.current.collectionOnly).toEqual({ kind: "emptyCollection" })
    );
    expect(result.current.isLoading).toBe(false);
    expect(requests).toEqual([]);
  });

  it("waits for the session and the collection to load instead of calling the collection empty", () => {
    const requests = serveSearch([
      page([card("sol-ring-cmm", "Sol Ring")], 1, false),
    ]);

    const session = renderHook(
      () =>
        useCardSearchResults(QUERY, {
          collectionOnly: true,
          sessionStatus: "loading",
        }),
      { wrapper }
    );
    useCollectionStore.setState({ isLoading: true });
    const collection = renderHook(
      () =>
        useCardSearchResults(QUERY, {
          collectionOnly: true,
          sessionStatus: "authenticated",
        }),
      { wrapper }
    );

    for (const { result } of [session, collection]) {
      expect(result.current.isLoading).toBe(true);
      expect(result.current.collectionOnly).toBeUndefined();
    }
    expect(requests).toEqual([]);
  });

  it("says the collection could not be loaded rather than calling it empty", () => {
    useCollectionStore.setState({ loadError: true });

    const { result } = renderHook(
      () =>
        useCardSearchResults(QUERY, {
          collectionOnly: true,
          sessionStatus: "authenticated",
        }),
      { wrapper }
    );

    expect(result.current.collectionOnly).toEqual({
      kind: "collectionUnavailable",
    });
  });
});
