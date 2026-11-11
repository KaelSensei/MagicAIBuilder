import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(import("@/lib/logger"), () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  __resetRateLimiter,
  getCardById,
  getCardByName,
  getCardByNameFuzzy,
  searchCards,
} from "@/lib/scryfall/client";

const CARD_ID = "0000579f-7b35-4ed3-b44c-db2a538066fe";
const SOL_RING = {
  object: "card",
  id: CARD_ID,
  name: "Sol Ring",
  cmc: 1,
  type_line: "Artifact",
  color_identity: [],
};
const PAGE = {
  object: "list",
  total_cards: 1,
  has_more: false,
  data: [SOL_RING],
};

type Answer = { readonly status: number; readonly body: unknown };

/**
 * Stubs the network the browser sees: the app's cache routes and Scryfall.
 * @returns the fetch spy, to read every request the client sent
 */
function network(answers: {
  readonly cache: Answer;
  readonly scryfall: Answer;
}) {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = String(input);
    const answer = url.startsWith("/api/cache/")
      ? answers.cache
      : answers.scryfall;
    return new Response(JSON.stringify(answer.body), {
      status: answer.status,
      headers: { "content-type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requests(fetchMock: ReturnType<typeof network>) {
  return fetchMock.mock.calls.map(([input, init]) => ({
    url: String(input),
    method: (init?.method ?? "GET").toUpperCase(),
  }));
}

function cacheWrites(fetchMock: ReturnType<typeof network>) {
  return requests(fetchMock).filter(
    (request) =>
      request.url.startsWith("/api/cache/") && request.method !== "GET"
  );
}

function scryfallRequests(fetchMock: ReturnType<typeof network>) {
  return requests(fetchMock).filter((request) =>
    request.url.startsWith("https://api.scryfall.com/")
  );
}

describe("Scryfall client and the shared cache", () => {
  beforeEach(() => __resetRateLimiter());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reads a search through the server, which fills a miss itself", async () => {
    const fetchMock = network({
      cache: { status: 200, body: { hit: false, data: PAGE } },
      scryfall: { status: 500, body: {} },
    });

    const result = await searchCards("is:gamechanger", 2);

    expect(result).toEqual(PAGE);
    const [first] = requests(fetchMock);
    expect(first?.url).toBe("/api/cache/search?query=is%3Agamechanger&page=2");
    expect(scryfallRequests(fetchMock)).toEqual([]);
    expect(cacheWrites(fetchMock)).toEqual([]);
  });

  it("asks the server for multilingual results when the query needs them", async () => {
    const fetchMock = network({
      cache: { status: 200, body: { hit: true, data: PAGE } },
      scryfall: { status: 500, body: {} },
    });

    await searchCards("lang:fr t:goblin", 1, true);

    expect(requests(fetchMock)[0]?.url).toContain("multilingual=1");
  });

  it("falls back to Scryfall when the server cannot answer, and writes nothing back", async () => {
    const fetchMock = network({
      cache: { status: 503, body: { error: "unavailable" } },
      scryfall: { status: 200, body: PAGE },
    });

    const result = await searchCards("is:gamechanger");

    expect(result).toEqual(PAGE);
    expect(scryfallRequests(fetchMock)).toHaveLength(1);
    expect(cacheWrites(fetchMock)).toEqual([]);
  });

  it("does not trust a cache answer that is not a Scryfall list", async () => {
    const fetchMock = network({
      cache: { status: 200, body: { hit: true, data: { object: "card" } } },
      scryfall: { status: 200, body: PAGE },
    });

    const result = await searchCards("is:gamechanger");

    expect(result).toEqual(PAGE);
    expect(scryfallRequests(fetchMock)).toHaveLength(1);
  });

  it("reads a card by id through the server and writes nothing back", async () => {
    const fetchMock = network({
      cache: { status: 200, body: { hit: false, data: SOL_RING } },
      scryfall: { status: 500, body: {} },
    });

    const card = await getCardById(CARD_ID);

    expect(card).toEqual(SOL_RING);
    expect(scryfallRequests(fetchMock)).toEqual([]);
    expect(cacheWrites(fetchMock)).toEqual([]);
  });

  it("falls back to Scryfall for a card the server cannot provide, and writes nothing back", async () => {
    const fetchMock = network({
      cache: { status: 502, body: { error: "upstream" } },
      scryfall: { status: 200, body: SOL_RING },
    });

    const card = await getCardById(CARD_ID);

    expect(card).toEqual(SOL_RING);
    expect(cacheWrites(fetchMock)).toEqual([]);
  });

  it.each([
    ["exact", getCardByName],
    ["fuzzy", getCardByNameFuzzy],
  ])(
    "looks a card up by %s name without writing the shared cache",
    async (_mode, lookup) => {
      const fetchMock = network({
        cache: { status: 200, body: {} },
        scryfall: { status: 200, body: SOL_RING },
      });

      await lookup("Sol Ring");

      expect(cacheWrites(fetchMock)).toEqual([]);
    }
  );
});
