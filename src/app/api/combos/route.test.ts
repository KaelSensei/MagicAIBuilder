import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import { delay, http, HttpResponse, type JsonBodyType } from "msw";
import {
  FIND_MY_COMBOS_RECORDED,
  FIND_MY_COMBOS_RECORDED_REQUEST,
} from "@/modules/combos/infrastructure/fixtures/find-my-combos-v1";
import { MAX_MAIN_CARDS, MAX_QUERY_BODY_BYTES } from "@/modules/combos/domain/deck-query";
import {
  COMBO_LOOKUPS_PER_CLIENT,
  SPELLBOOK_CALLS_PER_WINDOW,
} from "@/modules/combos/domain/lookup-policy";
import {
  SPELLBOOK_FIND_MY_COMBOS_URL,
  SPELLBOOK_TIMEOUT_MS,
} from "@/modules/combos/infrastructure/find-my-combos";
import { useMsw } from "@/test/msw";

type PostHandler = (request: Request) => Promise<Response>;

const RECORDED_DECK = {
  commanders: FIND_MY_COMBOS_RECORDED_REQUEST.commanders.map(
    (entry) => entry.card
  ),
  main: FIND_MY_COMBOS_RECORDED_REQUEST.main.map((entry) => entry.card),
};

/** Every request Spellbook received during the current test, in order. */
let spellbookRequests: Request[] = [];
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

/** Spellbook's `find-my-combos` endpoint answering every request with `body`. */
function spellbookAnswers(body: JsonBodyType, status = 200) {
  return http.post(SPELLBOOK_FIND_MY_COMBOS_URL, ({ request }) => {
    spellbookRequests.push(request.clone());
    return HttpResponse.json(body, { status });
  });
}

/**
 * Spellbook taking one request and never answering it. Also replaces the next
 * `AbortSignal.timeout` call, the route's 10-second Spellbook timeout, with a
 * signal this handler fires once the request has arrived: the test neither
 * waits 10 seconds nor races a short timer. `vi.restoreAllMocks` undoes it.
 */
function spellbookTimesOutOnce() {
  const clientTimeout = new AbortController();
  vi.spyOn(AbortSignal, "timeout").mockReturnValueOnce(clientTimeout.signal);
  return http.post(
    SPELLBOOK_FIND_MY_COMBOS_URL,
    async ({ request }) => {
      spellbookRequests.push(request.clone());
      clientTimeout.abort(
        new DOMException(
          "The operation was aborted due to timeout",
          "TimeoutError"
        )
      );
      await delay("infinite");
    },
    { once: true }
  );
}

describe("POST /api/combos", () => {
  // Spellbook serves the recorded response unless a test says otherwise; any
  // other outgoing request fails the test.
  const server = useMsw(spellbookAnswers(FIND_MY_COMBOS_RECORDED));

  beforeEach(async () => {
    // Fresh modules give every test an empty cache and empty rate-limit windows.
    vi.resetModules();
    ({ POST } = await import("./route"));
    const { logger } = await import("@/lib/logger");
    warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    spellbookRequests = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("asks Spellbook once for the whole deck and returns only the combos it contains", async () => {
    const response = await POST(lookup(RECORDED_DECK));

    expect(response.status).toBe(200);
    expect(spellbookRequests).toHaveLength(1);
    const [request] = spellbookRequests;
    expect(request.url).toBe(SPELLBOOK_FIND_MY_COMBOS_URL);
    expect(request.method).toBe("POST");
    expect(request.headers.get("User-Agent")).toMatch(/^MagicAIBuilder\//);
    const sent = await request.json();
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
    const shuffled = {
      commanders: ["  KENRITH, THE RETURNED KING "],
      main: [...RECORDED_DECK.main].reverse().map((name) => name.toUpperCase()),
    };

    const first = await POST(lookup(RECORDED_DECK));
    const second = await POST(lookup(shuffled));

    expect(spellbookRequests).toHaveLength(1);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual(await first.json());
  });

  it("answers 429 with Retry-After once one client goes over its limit", async () => {
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
    expect(spellbookRequests).toHaveLength(0);
  });

  it("rejects a body that declares more bytes than any valid list needs", async () => {
    const response = await POST(
      lookup(RECORDED_DECK, "203.0.113.1", {
        "Content-Length": String(MAX_QUERY_BODY_BYTES + 1),
      })
    );

    expect(response.status).toBe(413);
    expect(spellbookRequests).toHaveLength(0);
  });

  it("answers an empty card list without calling Spellbook", async () => {
    const response = await POST(lookup({ commanders: [], main: [] }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ combos: [] });
    expect(spellbookRequests).toHaveLength(0);
  });

  it("degrades to 504 when Spellbook times out, and does not cache the failure", async () => {
    server.use(spellbookTimesOutOnce());

    const timedOut = await POST(lookup(RECORDED_DECK));
    const retried = await POST(lookup(RECORDED_DECK));

    expect(timedOut.status).toBe(504);
    expect(await timedOut.json()).toEqual({
      error: "Combo lookup unavailable",
    });
    expect(retried.status).toBe(200);
    expect(AbortSignal.timeout).toHaveBeenCalledWith(SPELLBOOK_TIMEOUT_MS);
    expect(spellbookRequests).toHaveLength(2);
    expect(warn).toHaveBeenCalledWith(
      "Commander Spellbook timed out",
      "POST /api/combos"
    );
  });

  it("degrades to 502 when Spellbook fails or answers with an unexpected shape", async () => {
    server.use(spellbookAnswers({ detail: "Internal error" }, 500));
    const failed = await POST(lookup(RECORDED_DECK));

    server.use(spellbookAnswers({ results: "not a combo list" }));
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
    for (let i = 0; i < SPELLBOOK_CALLS_PER_WINDOW; i += 1) {
      const deck = { commanders: [], main: [`Card ${i}`] };
      expect((await POST(lookup(deck, `198.51.100.${i}`))).status).toBe(200);
    }

    const overBudget = await POST(
      lookup({ commanders: [], main: ["One more"] }, "192.0.2.1")
    );

    expect(overBudget.status).toBe(503);
    expect(Number(overBudget.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(spellbookRequests).toHaveLength(SPELLBOOK_CALLS_PER_WINDOW);
  });
});
