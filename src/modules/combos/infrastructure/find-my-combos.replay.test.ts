// @vitest-environment node
/**
 * Replays Commander Spellbook's recorded `find-my-combos` exchange through
 * `requestDeckCombos`, the server-side Spellbook adapter, with MSW in place of
 * the network.
 *
 * Characterization for the combos pilot (CMB-01). It pins what the adapter
 * sends, which of Spellbook's result buckets it keeps, and how each failure
 * comes back. It drives the exported function only, so the move into
 * `src/modules/combos` (CMB-02) changes nothing here but import paths. The
 * recording, with its date and source, is `fixtures/find-my-combos-v1.ts`.
 *
 * The node environment matches where the adapter runs: it is `server-only`
 * and is called by `POST /api/combos`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { delay, http, HttpResponse, type JsonBodyType } from "msw";
import {
  FIND_MY_COMBOS_RECORDED,
  FIND_MY_COMBOS_RECORDED_REQUEST,
} from "@/modules/combos/infrastructure/fixtures/find-my-combos-v1";
import type { DeckCombosResult } from "@/modules/combos/application/ports";
import {
  SPELLBOOK_FIND_MY_COMBOS_URL,
  SPELLBOOK_TIMEOUT_MS,
  requestDeckCombos,
} from "@/modules/combos/infrastructure/find-my-combos";
import { USER_AGENT } from "@/lib/http";
import { setupMsw } from "@/test/msw";

/** The recorded deck as the adapter takes it: plain card names. */
const RECORDED_QUERY = {
  commanders: FIND_MY_COMBOS_RECORDED_REQUEST.commanders.map(
    (entry) => entry.card
  ),
  main: FIND_MY_COMBOS_RECORDED_REQUEST.main.map((entry) => entry.card),
};

/** Every request Spellbook received during the current test, in order. */
let spellbookRequests: Request[] = [];

/** Spellbook's `find-my-combos` endpoint answering every request with `body`. */
function spellbookAnswers(body: JsonBodyType, status = 200) {
  return http.post(SPELLBOOK_FIND_MY_COMBOS_URL, ({ request }) => {
    spellbookRequests.push(request.clone());
    return HttpResponse.json(body, { status });
  });
}

/**
 * Spellbook taking one request and never answering it. The adapter's own
 * 10-second `AbortSignal.timeout` is swapped, once, for a signal this handler
 * fires when the request arrives, so the test goes through fetch's real abort
 * path without waiting. MSW 3 no longer patches timers (tdd-with-ai.md,
 * "Network in tests"). `vi.restoreAllMocks` undoes the swap.
 */
function spellbookNeverAnswers() {
  const adapterTimeout = new AbortController();
  vi.spyOn(AbortSignal, "timeout").mockReturnValueOnce(adapterTimeout.signal);
  return http.post(
    SPELLBOOK_FIND_MY_COMBOS_URL,
    async ({ request }) => {
      spellbookRequests.push(request.clone());
      adapterTimeout.abort(
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

function foundCombos(result: DeckCombosResult) {
  if (result.kind !== "found") {
    throw new Error(`expected combos, got a "${result.kind}" result`);
  }
  return result.combos;
}

describe("requestDeckCombos (recorded Spellbook exchange)", () => {
  // Spellbook serves the recording unless a test says otherwise; any other
  // outgoing request fails the test.
  const server = setupMsw(spellbookAnswers(FIND_MY_COMBOS_RECORDED));

  beforeEach(() => {
    spellbookRequests = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("the request", () => {
    it("sends the whole deck in one POST whose body equals the recorded request", async () => {
      await requestDeckCombos(RECORDED_QUERY);

      expect(spellbookRequests).toHaveLength(1);
      const [request] = spellbookRequests;
      expect(request.method).toBe("POST");
      expect(request.url).toBe(SPELLBOOK_FIND_MY_COMBOS_URL);
      expect(await request.json()).toEqual(FIND_MY_COMBOS_RECORDED_REQUEST);
    });

    it("asks for JSON and names the app in its User-Agent", async () => {
      await requestDeckCombos(RECORDED_QUERY);

      const [request] = spellbookRequests;
      expect(request.headers.get("Accept")).toBe("application/json");
      expect(request.headers.get("Content-Type")).toBe("application/json");
      expect(request.headers.get("User-Agent")).toBe(USER_AGENT);
    });

    it("sends names as given: putting the list in canonical form is the route's job", async () => {
      await requestDeckCombos({
        commanders: ["  Kenrith, the Returned King "],
        main: ["SOL RING", "Sol Ring"],
      });

      expect(await spellbookRequests[0].json()).toEqual({
        commanders: [{ card: "  Kenrith, the Returned King " }],
        main: [{ card: "SOL RING" }, { card: "Sol Ring" }],
      });
    });
  });

  describe("the included and almost-included buckets", () => {
    it("returns the included bucket: three infinite two-card lines, in the order Spellbook sent them", async () => {
      const combos = foundCombos(await requestDeckCombos(RECORDED_QUERY));

      // All three are infinite and use two named cards, so the "infinite first,
      // then fewer cards" sort leaves Spellbook's order as it was.
      expect(
        combos.map(({ id, cards, isInfinite }) => ({ id, cards, isInfinite }))
      ).toEqual([
        {
          id: "513-5034--46",
          cards: ["Hullbreaker Horror", "Sol Ring"],
          isInfinite: true,
        },
        {
          id: "742-1295",
          cards: ["Demonic Consultation", "Thassa's Oracle"],
          isInfinite: true,
        },
        {
          id: "4821-5261",
          cards: ["Dramatic Reversal", "Isochron Scepter"],
          isInfinite: true,
        },
      ]);
    });

    it("currently drops the combos the deck almost holds, though Spellbook sent them (pinned; roadmap I-65 'Combos one card away', no B2 row)", async () => {
      const almostIncluded = FIND_MY_COMBOS_RECORDED.results.almostIncluded.map(
        (variant) => variant.id
      );

      const combos = foundCombos(await requestDeckCombos(RECORDED_QUERY));

      // The recording carries Tainted Pact + Thassa's Oracle in `almostIncluded`
      // because the deck lacks Tainted Pact.
      expect(almostIncluded).toEqual(["1295-3093"]);
      expect(combos.map((combo) => combo.id)).not.toContain("1295-3093");
      expect(combos).toHaveLength(
        FIND_MY_COMBOS_RECORDED.results.included.length
      );
    });

    it("reports an empty included bucket as a finding: the deck holds no known combo", async () => {
      server.use(
        spellbookAnswers({
          ...FIND_MY_COMBOS_RECORDED,
          results: { ...FIND_MY_COMBOS_RECORDED.results, included: [] },
        })
      );

      expect(await requestDeckCombos(RECORDED_QUERY)).toEqual({
        kind: "found",
        combos: [],
      });
    });
  });

  describe("failures come back as results, never as exceptions", () => {
    it.each([500, 502, 503, 429])(
      "reports HTTP %i from Spellbook as a failed lookup with that status",
      async (status) => {
        server.use(spellbookAnswers({ detail: "Upstream error" }, status));

        expect(await requestDeckCombos(RECORDED_QUERY)).toEqual({
          kind: "failed",
          status,
        });
      }
    );

    it("reports a timeout once Spellbook has not answered within SPELLBOOK_TIMEOUT_MS", async () => {
      server.use(spellbookNeverAnswers());

      const result = await requestDeckCombos(RECORDED_QUERY);

      expect(result).toEqual({ kind: "timeout" });
      expect(AbortSignal.timeout).toHaveBeenCalledWith(SPELLBOOK_TIMEOUT_MS);
      expect(SPELLBOOK_TIMEOUT_MS).toBe(10_000);
      expect(spellbookRequests).toHaveLength(1);
    });

    it.each<{ readonly shape: string; readonly body: JsonBodyType }>([
      {
        shape: "results is not an object",
        body: { results: "not a combo list" },
      },
      {
        shape: "results is a page of variants",
        body: { count: 0, results: [] },
      },
      { shape: "the included bucket is missing", body: { results: {} } },
      {
        shape: "a variant lacks its required fields",
        body: { results: { included: [{ id: "742-1295" }] } },
      },
      { shape: "the body is JSON null", body: null },
    ])(
      "reports a JSON body of another shape as unexpected: $shape",
      async ({ body }) => {
        server.use(spellbookAnswers(body));

        expect(await requestDeckCombos(RECORDED_QUERY)).toEqual({
          kind: "unexpected-body",
        });
      }
    );

    it("currently reports a 200 answer that is not JSON as a failed lookup with no status, not as an unexpected body (pinned)", async () => {
      server.use(
        http.post(SPELLBOOK_FIND_MY_COMBOS_URL, () =>
          HttpResponse.html("<html><body>Just a moment...</body></html>")
        )
      );

      expect(await requestDeckCombos(RECORDED_QUERY)).toEqual({
        kind: "failed",
        status: null,
      });
    });

    it("reports a network error as a failed lookup with no status", async () => {
      server.use(
        http.post(SPELLBOOK_FIND_MY_COMBOS_URL, () => HttpResponse.error())
      );

      expect(await requestDeckCombos(RECORDED_QUERY)).toEqual({
        kind: "failed",
        status: null,
      });
    });
  });
});
