import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock deck-api cache functions before importing client
vi.mock("@/lib/db/deck-api", () => ({
  lookupCardCache: vi.fn(async () => null),
  storeCardCache: vi.fn(async () => undefined),
}));

import {
  searchCards,
  getCardByName,
  getCardByNameFuzzy,
  getCardById,
  autocompleteCardName,
  getCardCollection,
  getGameChangers,
  getCommanderBanlist,
  searchCardPrintings,
} from "@/lib/scryfall/client";
import { lookupCardCache } from "@/lib/db/deck-api";
import type { ScryfallCard, ScryfallSearchResponse } from "@/lib/scryfall/types";

function makeScryfallCard(id = "card-1"): ScryfallCard {
  return {
    id,
    name: "Sol Ring",
    mana_cost: "{1}",
    cmc: 1,
    type_line: "Artifact",
    oracle_text: "",
    color_identity: [],
    colors: [],
    keywords: [],
    set: "cmd",
    set_name: "Commander",
    rarity: "uncommon",
    prices: { usd: "1.00", usd_foil: null, eur: null },
    image_uris: { small: "", normal: "", large: "", art_crop: "", border_crop: "", png: "" },
    card_faces: undefined,
    legalities: { commander: "legal" },
  };
}

function makeSearchResponse(cards: ScryfallCard[] = []): ScryfallSearchResponse {
  return {
    object: "list",
    total_cards: cards.length,
    has_more: false,
    data: cards,
  };
}

function mockFetchSuccess(data: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  }));
}

function mockFetchError(status = 404, statusText = "Not Found") {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    json: async () => ({ details: statusText }),
  }));
}

describe("searchCards", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("calls the correct Scryfall endpoint", async () => {
    const searchResponse = makeSearchResponse([makeScryfallCard()]);
    mockFetchSuccess(searchResponse);

    const promise = searchCards("Sol Ring");
    vi.runAllTimers();
    const result = await promise;

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe("Sol Ring");
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(fetchCall).toContain("/cards/search");
    expect(fetchCall).toContain("Sol+Ring");
  });

  it("throws on API error", async () => {
    mockFetchError(400, "Bad Request");
    const promise = searchCards("invalid query");
    vi.runAllTimers();
    await expect(promise).rejects.toThrow("Scryfall API error 400");
  });
});

describe("getCardByName", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("fetches a card by exact name", async () => {
    const card = makeScryfallCard();
    mockFetchSuccess(card);
    const promise = getCardByName("Sol Ring");
    vi.runAllTimers();
    const result = await promise;
    expect(result.name).toBe("Sol Ring");
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(fetchCall).toContain("/cards/named");
    expect(fetchCall).toContain("exact=Sol+Ring");
  });
});

describe("getCardByNameFuzzy", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("fetches a card by fuzzy name", async () => {
    const card = makeScryfallCard();
    mockFetchSuccess(card);
    const promise = getCardByNameFuzzy("Sol Rign");
    vi.runAllTimers();
    const result = await promise;
    expect(result.name).toBe("Sol Ring");
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(fetchCall).toContain("fuzzy=");
  });
});

describe("getCardById", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("returns cached card without fetching", async () => {
    const cachedCard = makeScryfallCard("cached-id");
    vi.mocked(lookupCardCache).mockResolvedValueOnce(cachedCard);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => cachedCard });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getCardById("cached-id");
    expect(result.id).toBe("cached-id");
  });

  it("fetches from Scryfall when not in cache", async () => {
    vi.mocked(lookupCardCache).mockResolvedValueOnce(null);
    const card = makeScryfallCard("fresh-card");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => card });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getCardById("fresh-card");
    expect(result.id).toBe("fresh-card");
    expect(fetchMock).toHaveBeenCalled();
  });
});

describe("handleResponse edge cases", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("falls back to statusText when error response JSON parsing fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: () => Promise.reject(new Error("invalid json")),
    }));
    const promise = searchCards("fail");
    vi.runAllTimers();
    await expect(promise).rejects.toThrow("Service Unavailable");
  });
});

describe("getCardById — cache failure", () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it("falls through to Scryfall when cache lookup throws", async () => {
    vi.mocked(lookupCardCache).mockRejectedValueOnce(new Error("cache down"));
    const card = makeScryfallCard("fallback-card");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => card }));

    const result = await getCardById("fallback-card");
    expect(result.id).toBe("fallback-card");
  });
});

describe("autocompleteCardName", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("returns autocomplete suggestions", async () => {
    mockFetchSuccess({ object: "catalog", data: ["Sol Ring", "Sol'Kanar the Swamp King"] });
    const promise = autocompleteCardName("Sol");
    vi.runAllTimers();
    const result = await promise;
    expect(result).toContain("Sol Ring");
  });
});

describe("getCardCollection", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("POSTs to cards/collection", async () => {
    const card = makeScryfallCard();
    mockFetchSuccess({ object: "list", not_found: [], data: [card] });
    const promise = getCardCollection([{ id: "card-1" }]);
    vi.runAllTimers();
    const result = await promise;
    expect(result.data).toHaveLength(1);
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(fetchCall).toContain("/cards/collection");
  });
});

describe("getGameChangers", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("searches for is:gamechanger", async () => {
    mockFetchSuccess(makeSearchResponse());
    const promise = getGameChangers();
    vi.runAllTimers();
    await promise;
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(fetchCall).toContain("gamechanger");
  });
});

describe("getCommanderBanlist", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("searches for banned:commander", async () => {
    mockFetchSuccess(makeSearchResponse());
    const promise = getCommanderBanlist();
    vi.runAllTimers();
    await promise;
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(fetchCall).toContain("banned%3Acommander");
  });
});

describe("searchCardPrintings", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("searches printings with unique=prints", async () => {
    mockFetchSuccess(makeSearchResponse([makeScryfallCard()]));
    const promise = searchCardPrintings("Sol Ring");
    vi.runAllTimers();
    const result = await promise;
    expect(result.data).toHaveLength(1);
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(fetchCall).toContain("unique=prints");
  });
});
