import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  COMBO_FETCH_TIMEOUT_MS,
  fetchCombosForDeck,
  type SpellbookVariant,
} from "@/modules/combos/client/api";

const mockFetch = vi.fn();

const THORACLE: SpellbookVariant = {
  id: "742-1295",
  cards: ["Demonic Consultation", "Thassa's Oracle"],
  effects: ["Exile your library", "Win the game"],
  description: "Cast Demonic Consultation naming Thassa's Oracle.",
  isInfinite: true,
  prerequisites: { otherPieces: [], conditions: [], manaNeeded: "{U}{U}{B}" },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const DECK = {
  commanders: ["Kenrith, the Returned King"],
  main: ["Thassa's Oracle", "Demonic Consultation", "Sol Ring"],
};

describe("fetchCombosForDeck", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("looks the whole deck up in one request", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ combos: [THORACLE] }));

    const combos = await fetchCombosForDeck(DECK);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/combos");
    expect(init).toMatchObject({ method: "POST" });
    expect(JSON.parse(String(init.body))).toEqual(DECK);
    expect(combos).toEqual([THORACLE]);
  });

  it("bounds the lookup with a 15 second timeout signal", async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
    mockFetch.mockResolvedValue(jsonResponse({ combos: [] }));

    await fetchCombosForDeck(DECK);

    expect(COMBO_FETCH_TIMEOUT_MS).toBe(15_000);
    expect(timeoutSpy).toHaveBeenCalledWith(COMBO_FETCH_TIMEOUT_MS);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/combos",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    timeoutSpy.mockRestore();
  });

  it("rejects when the route could not check, rather than reporting no combos", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ error: "Combo lookup unavailable" }, 502)
    );

    await expect(fetchCombosForDeck(DECK)).rejects.toThrow("HTTP 502");
  });

  it("rejects when the lookup times out", async () => {
    mockFetch.mockRejectedValue(
      new DOMException("The operation timed out.", "TimeoutError")
    );

    await expect(fetchCombosForDeck(DECK)).rejects.toThrow("timed out");
  });

  it("rejects a response that is not a combo list", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ combos: [{ id: "no-cards" }] }));

    await expect(fetchCombosForDeck(DECK)).rejects.toThrow(
      "unexpected response"
    );
  });
});
