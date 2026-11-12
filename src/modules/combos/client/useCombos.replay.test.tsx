/**
 * Replays the recorded Commander Spellbook lookup end to end from the builder's
 * hook: `useCombos` → `fetchCombosForDeck` → `POST /api/combos` →
 * `requestDeckCombos` → Spellbook.
 *
 * Characterization for the combos pilot (CMB-01). MSW stands in for both
 * network hops: `/api/combos` is answered by the real route handler, and
 * Spellbook by the recording in
 * `@/modules/combos/infrastructure/fixtures/find-my-combos-v1`. No
 * module is mocked, so the move into `src/modules/combos` (CMB-02) and the
 * route's use case (CMB-04) change nothing here but import paths.
 *
 * Pinned here: the ten-card minimum and the companion exclusion of
 * `useCombos.ts` (`MIN_CARDS` and `toDeckComboQuery`, which B2-43 will revisit), the list the
 * browser sends against the canonical list Spellbook receives, and how each
 * failure reaches the builder.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { delay, http, HttpResponse, type JsonBodyType } from "msw";
import { useCombos } from "@/modules/combos/client/useCombos";
import { COMBO_FETCH_TIMEOUT_MS } from "@/modules/combos/client/api";
import {
  SPELLBOOK_FIND_MY_COMBOS_URL,
  SPELLBOOK_TIMEOUT_MS,
} from "@/modules/combos/infrastructure/find-my-combos";
import {
  FIND_MY_COMBOS_RECORDED,
  FIND_MY_COMBOS_RECORDED_REQUEST,
} from "@/modules/combos/infrastructure/fixtures/find-my-combos-v1";
import type { Deck, DeckCard, DeckZone } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { setupMsw } from "@/test/msw";
import { renderHookWithProviders } from "@/test/render";

/** The browser calls the route by path; MSW resolves it against jsdom's origin. */
const API_COMBOS = "/api/combos";

const [RECORDED_COMMANDER] = FIND_MY_COMBOS_RECORDED_REQUEST.commanders.map(
  (entry) => entry.card
);
const RECORDED_MAIN = FIND_MY_COMBOS_RECORDED_REQUEST.main.map(
  (entry) => entry.card
);

/** Bodies `/api/combos` received during the current test, in order. */
let apiBodies: unknown[] = [];
/** Bodies Spellbook received during the current test, in order. */
let spellbookBodies: unknown[] = [];
let routePost: (request: Request) => Promise<Response>;

function card(name: string, zone: DeckZone = "main", quantity = 1): DeckCard {
  return aDeckCard({ id: `${zone}-${name}`, name, quantity, zone });
}

interface DeckShape {
  readonly cards: readonly DeckCard[];
  readonly partner?: DeckCard;
  readonly companion?: DeckCard;
}

/** A Commander deck led by the recorded commander, Kenrith. */
function deck({ cards, partner, companion }: DeckShape): Deck {
  return aDeck({
    id: "replayed-deck",
    name: "Replayed deck",
    commander: card(RECORDED_COMMANDER),
    partner: partner ?? null,
    companion: companion ?? null,
    pairingType: partner ? "partner" : "none",
    cards: [...cards],
    maybeboard: cards.filter((entry) => entry.zone === "maybeboard"),
    cardCount: cards.length,
  });
}

/** The recorded deck: Kenrith and nine main-deck cards, ten in all. */
function recordedDeck(): Deck {
  return deck({ cards: RECORDED_MAIN.map((name) => card(name)) });
}

/** The recorded main deck without its last card (Swamp): with Kenrith, nine cards. */
const EIGHT_MAIN_CARDS = RECORDED_MAIN.slice(0, -1).map((name) => card(name));

function apiCombosServedByRoute() {
  return http.post(API_COMBOS, async ({ request }) => {
    apiBodies.push(await request.clone().json());
    return routePost(request);
  });
}

function spellbookAnswers(body: JsonBodyType, status = 200) {
  return http.post(SPELLBOOK_FIND_MY_COMBOS_URL, async ({ request }) => {
    spellbookBodies.push(await request.clone().json());
    return HttpResponse.json(body, { status });
  });
}

/**
 * One endpoint taking one request and never answering it. The caller's
 * `AbortSignal.timeout(timeoutMs)` is swapped for a signal the handler fires
 * once the request arrives, so the request goes through fetch's real abort
 * path without the test waiting. Other timeouts in the chain stay real.
 * `vi.restoreAllMocks` undoes the swap.
 */
function neverAnswers(url: string, timeoutMs: number) {
  const timeout = AbortSignal.timeout.bind(AbortSignal);
  const fired = new AbortController();
  vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) =>
    ms === timeoutMs ? fired.signal : timeout(ms)
  );
  return http.post(url, async () => {
    fired.abort(
      new DOMException(
        "The operation was aborted due to timeout",
        "TimeoutError"
      )
    );
    await delay("infinite");
  });
}

function renderCombos(subject: Deck) {
  return renderHookWithProviders(() => useCombos(subject));
}

describe("useCombos, replayed end to end against the recorded Spellbook lookup", () => {
  const server = setupMsw(
    apiCombosServedByRoute(),
    spellbookAnswers(FIND_MY_COMBOS_RECORDED)
  );

  beforeEach(async () => {
    // A fresh route module gives every test an empty combo cache and empty
    // rate-limit windows, so each test reaches Spellbook on its own.
    vi.resetModules();
    ({ POST: routePost } = await import("@/app/api/combos/route"));
    const { logger } = await import("@/lib/logger");
    vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    apiBodies = [];
    spellbookBodies = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("the recorded deck", () => {
    it("looks the deck up at exactly ten cards, commander included, and returns the combos it holds", async () => {
      const { result } = renderCombos(recordedDeck());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      // The three `included` lines, in the order the route answered; the
      // almost-included Tainted Pact line is dropped (see find-my-combos.replay.test.ts).
      expect(result.current.data?.map((combo) => combo.id)).toEqual([
        "513-5034--46",
        "742-1295",
        "4821-5261",
      ]);
      expect(apiBodies).toHaveLength(1);
      expect(spellbookBodies).toHaveLength(1);
    });

    it("sends the names as the deck holds them, and Spellbook receives them in canonical form", async () => {
      const { result } = renderCombos(recordedDeck());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(apiBodies).toEqual([
        { commanders: [RECORDED_COMMANDER], main: RECORDED_MAIN },
      ]);
      expect(spellbookBodies).toEqual([
        {
          commanders: [{ card: "kenrith, the returned king" }],
          main: [
            { card: "demonic consultation" },
            { card: "dramatic reversal" },
            { card: "hullbreaker horror" },
            { card: "island" },
            { card: "isochron scepter" },
            { card: "sol ring" },
            { card: "swamp" },
            { card: "thassa's oracle" },
            { card: "wayfarer's bauble" },
          ],
        },
      ]);
    });
  });

  describe("the ten-card minimum (MIN_CARDS in useCombos.ts)", () => {
    it("does not look a deck of nine cards up", () => {
      const { result } = renderCombos(deck({ cards: EIGHT_MAIN_CARDS }));

      expect(result.current.fetchStatus).toBe("idle");
      expect(result.current.data).toBeUndefined();
      expect(apiBodies).toEqual([]);
    });

    it("counts the partner as a commander toward the ten cards, and sends it as one", async () => {
      const partner = card("Tymna the Weaver");

      const { result } = renderCombos(
        deck({ cards: EIGHT_MAIN_CARDS, partner })
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(apiBodies).toEqual([
        {
          commanders: [RECORDED_COMMANDER, "Tymna the Weaver"],
          main: RECORDED_MAIN.slice(0, -1),
        },
      ]);
    });

    it("currently counts card rows, not copies: a row of twenty Islands counts once (pinned; see B2-43)", () => {
      const islands = card("Island", "main", 20);
      const sevenSpells = RECORDED_MAIN.filter((name) => name !== "Island")
        .slice(0, 7)
        .map((name) => card(name));

      // Kenrith, seven spells and one row of twenty Islands: nine rows.
      const { result } = renderCombos(
        deck({ cards: [...sevenSpells, islands] })
      );

      expect(result.current.fetchStatus).toBe("idle");
      expect(apiBodies).toEqual([]);
    });

    it("counts two printings of one card as two rows, and Spellbook receives the name once", async () => {
      const foilSolRing = { ...card("Sol Ring"), id: "main-Sol Ring-foil" };

      // Kenrith, eight main-deck rows and a second Sol Ring row: ten rows.
      const { result } = renderCombos(
        deck({ cards: [...EIGHT_MAIN_CARDS, foilSolRing] })
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(apiBodies).toEqual([
        {
          commanders: [RECORDED_COMMANDER],
          main: [...RECORDED_MAIN.slice(0, -1), "Sol Ring"],
        },
      ]);
      expect(JSON.stringify(spellbookBodies).match(/"sol ring"/g)).toEqual([
        '"sol ring"',
      ]);
    });

    it("currently leaves maybeboard and sideboard rows out of the ten, though the builder page counts them (pinned; see B2-43)", () => {
      const cards = [
        ...EIGHT_MAIN_CARDS,
        card("Food Chain", "maybeboard"),
        card("Tainted Pact", "sideboard"),
      ];

      // Ten rows in `deck.cards`, so the page's `deck.cards.length >= 10`
      // shows the panel as enabled; the hook counts nine and never looks up.
      const { result } = renderCombos(deck({ cards }));

      expect(cards).toHaveLength(10);
      expect(result.current.fetchStatus).toBe("idle");
      expect(apiBodies).toEqual([]);
    });

    it("sends only main-deck names: maybeboard and sideboard rows stay out of the lookup", async () => {
      const cards = [
        ...recordedDeck().cards,
        card("Food Chain", "maybeboard"),
        card("Tainted Pact", "sideboard"),
      ];

      const { result } = renderCombos(deck({ cards }));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(apiBodies).toEqual([
        { commanders: [RECORDED_COMMANDER], main: RECORDED_MAIN },
      ]);
    });
  });

  describe("the companion (toDeckComboQuery in useCombos.ts)", () => {
    const companion = card("Jegantha, the Wellspring");

    it("currently does not count the companion toward the ten cards (pinned; see B2-43)", () => {
      const { result } = renderCombos(
        deck({ cards: EIGHT_MAIN_CARDS, companion })
      );

      expect(result.current.fetchStatus).toBe("idle");
      expect(apiBodies).toEqual([]);
    });

    it("currently leaves the companion out of the list it sends (pinned; see B2-43)", async () => {
      const { result } = renderCombos(
        deck({ cards: recordedDeck().cards, companion })
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(apiBodies).toEqual([
        { commanders: [RECORDED_COMMANDER], main: RECORDED_MAIN },
      ]);
    });
  });

  describe("failures reach the builder as errors, never as a deck without combos", () => {
    it("reports Spellbook answering 500 as an error once the route answers 502, and does not retry", async () => {
      server.use(spellbookAnswers({ detail: "Internal error" }, 500));

      const { result } = renderCombos(recordedDeck());

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe(
        "Combo lookup failed with HTTP 502"
      );
      expect(result.current.data).toBeUndefined();
      expect(apiBodies).toHaveLength(1);
    });

    it("reports a Spellbook body of another shape as an error once the route answers 502", async () => {
      server.use(spellbookAnswers({ results: "not a combo list" }));

      const { result } = renderCombos(recordedDeck());

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe(
        "Combo lookup failed with HTTP 502"
      );
    });

    it("reports a Spellbook timeout as an error once the route answers 504", async () => {
      server.use(
        neverAnswers(SPELLBOOK_FIND_MY_COMBOS_URL, SPELLBOOK_TIMEOUT_MS)
      );

      const { result } = renderCombos(recordedDeck());

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe(
        "Combo lookup failed with HTTP 504"
      );
    });

    it("gives up in the browser after COMBO_FETCH_TIMEOUT_MS when the route does not answer", async () => {
      server.use(neverAnswers(API_COMBOS, COMBO_FETCH_TIMEOUT_MS));

      const { result } = renderCombos(recordedDeck());

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.name).toBe("TimeoutError");
      expect(COMBO_FETCH_TIMEOUT_MS).toBe(15_000);
      expect(spellbookBodies).toEqual([]);
    });

    it("rejects a route answer that is not a combo list rather than showing it", async () => {
      server.use(
        http.post(API_COMBOS, () =>
          HttpResponse.json({ combos: [{ id: "742-1295" }] })
        )
      );

      const { result } = renderCombos(recordedDeck());

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe(
        "Combo lookup sent an unexpected response"
      );
    });
  });
});
