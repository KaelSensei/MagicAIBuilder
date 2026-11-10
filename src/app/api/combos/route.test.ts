import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import {
  FIND_MY_COMBOS_RECORDED,
  FIND_MY_COMBOS_RECORDED_REQUEST,
} from "@/lib/combos/fixtures/find-my-combos-v1";
import { MAX_MAIN_CARDS, MAX_QUERY_BODY_BYTES } from "@/lib/combos/deck-query";
import {
  COMBO_LOOKUPS_PER_CLIENT,
  SPELLBOOK_CALLS_PER_WINDOW,
} from "@/lib/combos/lookup-policy";
import { SPELLBOOK_FIND_MY_COMBOS_URL } from "@/lib/combos/find-my-combos";

type PostHandler = (request: Request) => Promise<Response>;

const RECORDED_DECK = {
  commanders: FIND_MY_COMBOS_RECORDED_REQUEST.commanders.map(
    (entry) => entry.card
  ),
  main: FIND_MY_COMBOS_RECORDED_REQUEST.main.map((entry) => entry.card),
};

const mockFetch = vi.fn();
let POST: PostHandler;
let warn: MockInstance;

function lookup(
  body: unknown,
  client = "203.0.113.1",
  headers: Record<string, string> = {}
) {
  return new Request("http://localhost/api/combos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-real-ip": client,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function spellbookAnswers(body: unknown, status = 200): void {
  mockFetch.mockImplementation(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      })
  );
}

describe("POST /api/combos", () => {
  beforeEach(async () => {
    // Fresh modules give every test an empty cache and empty rate-limit windows.
    vi.resetModules();
    ({ POST } = await import("./route"));
    const { logger } = await import("@/lib/logger");
    warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks Spellbook once for the whole deck and returns only the combos it contains", async () => {
    spellbookAnswers(FIND_MY_COMBOS_RECORDED);

    const response = await POST(lookup(RECORDED_DECK));

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(SPELLBOOK_FIND_MY_COMBOS_URL);
    expect(init.method).toBe("POST");
    expect(init.headers["User-Agent"]).toMatch(/^MagicAIBuilder\//);
    const sent = JSON.parse(String(init.body));
    expect(sent.commanders).toEqual([{ card: "kenrith, the returned king" }]);
    expect(sent.main).toHaveLength(RECORDED_DECK.main.length);
    expect(sent.main).toContainEqual({ card: "thassa's oracle" });

    const { combos } = await response.json();
    expect(combos.map((combo: { id: string }) => combo.id).sort()).toEqual([
      "4821-5261",
      "513-5034--46",
      "742-1295",
    ]);
  });

  it("serves the same card list from the cache, whatever its order, case or spacing", async () => {
    spellbookAnswers(FIND_MY_COMBOS_RECORDED);
    const shuffled = {
      commanders: ["  KENRITH, THE RETURNED KING "],
      main: [...RECORDED_DECK.main].reverse().map((name) => name.toUpperCase()),
    };

    const first = await POST(lookup(RECORDED_DECK));
    const second = await POST(lookup(shuffled));

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual(await first.json());
  });

  it("answers 429 with Retry-After once one client goes over its limit", async () => {
    spellbookAnswers(FIND_MY_COMBOS_RECORDED);
    for (let i = 0; i < COMBO_LOOKUPS_PER_CLIENT; i += 1) {
      expect((await POST(lookup(RECORDED_DECK, "203.0.113.7"))).status).toBe(
        200
      );
    }

    const limited = await POST(lookup(RECORDED_DECK, "203.0.113.7"));
    const otherClient = await POST(lookup(RECORDED_DECK, "203.0.113.8"));

    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(otherClient.status).toBe(200);
  });

  it("rejects a card list over the cap without calling Spellbook", async () => {
    const oversize = {
      commanders: [],
      main: Array.from({ length: MAX_MAIN_CARDS + 1 }, (_, i) => `Card ${i}`),
    };

    const response = await POST(lookup(oversize));

    expect(response.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects a body that declares more bytes than any valid list needs", async () => {
    const response = await POST(
      lookup(RECORDED_DECK, "203.0.113.1", {
        "Content-Length": String(MAX_QUERY_BODY_BYTES + 1),
      })
    );

    expect(response.status).toBe(413);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("answers an empty card list without calling Spellbook", async () => {
    const response = await POST(lookup({ commanders: [], main: [] }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ combos: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("degrades to 504 when Spellbook times out, and does not cache the failure", async () => {
    spellbookAnswers(FIND_MY_COMBOS_RECORDED);
    mockFetch.mockRejectedValueOnce(
      new DOMException(
        "The operation was aborted due to timeout",
        "TimeoutError"
      )
    );

    const timedOut = await POST(lookup(RECORDED_DECK));
    const retried = await POST(lookup(RECORDED_DECK));

    expect(timedOut.status).toBe(504);
    expect(await timedOut.json()).toEqual({
      error: "Combo lookup unavailable",
    });
    expect(retried.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(
      "Commander Spellbook timed out",
      "POST /api/combos"
    );
  });

  it("degrades to 502 when Spellbook fails or answers with an unexpected shape", async () => {
    spellbookAnswers({ detail: "Internal error" }, 500);
    const failed = await POST(lookup(RECORDED_DECK));

    spellbookAnswers({ results: "not a combo list" });
    const malformed = await POST(lookup(RECORDED_DECK));

    expect(failed.status).toBe(502);
    expect(malformed.status).toBe(502);
    expect(await malformed.json()).toEqual({
      error: "Combo lookup unavailable",
    });
    expect(warn).toHaveBeenCalledWith(
      "Commander Spellbook lookup failed",
      "POST /api/combos",
      { status: 500 }
    );
    expect(warn).toHaveBeenCalledWith(
      "Commander Spellbook sent an unexpected response",
      "POST /api/combos"
    );
  });

  it("stops calling Spellbook once this server's shared budget is spent", async () => {
    spellbookAnswers(FIND_MY_COMBOS_RECORDED);
    for (let i = 0; i < SPELLBOOK_CALLS_PER_WINDOW; i += 1) {
      const deck = { commanders: [], main: [`Card ${i}`] };
      expect((await POST(lookup(deck, `198.51.100.${i}`))).status).toBe(200);
    }

    const overBudget = await POST(
      lookup({ commanders: [], main: ["One more"] }, "192.0.2.1")
    );

    expect(overBudget.status).toBe(503);
    expect(Number(overBudget.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(mockFetch).toHaveBeenCalledTimes(SPELLBOOK_CALLS_PER_WINDOW);
  });
});
