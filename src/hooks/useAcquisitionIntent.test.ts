/**
 * Characterization suite for `useAcquisitionIntent`, the hook behind the buy list's
 * "proxy now" and "buy later" toggles (`ShoppingListModal`, `ShoppingListRow`).
 *
 * The hook had no test (audit catalog_collection A6). COL-06 moves the acquisition
 * intent route into use cases and COL-08 routes the hook through a typed API client,
 * so this suite pins, first, what today's hook does: the load, the optimistic toggle,
 * the request it sends, the rollback rules, and what a guest gets. It also pins two
 * behaviours that look wrong; their tests say `currently …` and the PR body lists them
 * as follow-ups.
 *
 * MSW serves the intent route (`setupMsw`); nothing internal is mocked. Toasts are read
 * from the real toast store through `recordToasts`.
 *
 * Vocabulary (from `lib/collection/acquisition-intent.ts`): an *intent* is a deferral of
 * one printing, `proxy_now` or `buy_later`. `buy_now` is not an intent but the choice
 * that clears one, so the map never holds it.
 *
 * The app mounts the shopping list only for a signed-in player
 * (`CollectionStatsPanel.tsx:83`); the guest tests here pin what the hook alone does
 * with the 401 the route answers.
 */
import { act, waitFor } from "@testing-library/react";
import { http, HttpResponse, type HttpResponseResolver } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAcquisitionIntent } from "@/hooks/useAcquisitionIntent";
import { setupMsw } from "@/test/msw";
import { renderHookWithProviders } from "@/test/render";
import { recordToasts } from "@/test/toast-recorder";

const INTENT_ROUTE = "/api/decks/:deckId/acquisition-intent";
const DECK_ID = "deck-1";
const SOL_RING = "printing-sol-ring";
const SIGNET = "printing-arcane-signet";

// ---------------------------------------------------------------------------
// The requests the hook sends
// ---------------------------------------------------------------------------

/** One request as the intent route received it. */
interface SentRequest {
  readonly method: string;
  /** Path only; the route takes no query string. */
  readonly path: string;
  readonly contentType: string | null;
  /** The parsed JSON body, or null when the request carried none. */
  readonly body: unknown;
}

let sent: SentRequest[] = [];

async function record(request: Request): Promise<void> {
  const text = await request.text();
  sent.push({
    method: request.method,
    path: new URL(request.url).pathname,
    contentType: request.headers.get("content-type"),
    body: text === "" ? null : JSON.parse(text),
  });
}

function sentRequests(method: "GET" | "PUT"): readonly SentRequest[] {
  return sent.filter((request) => request.method === method);
}

/** A handler body that records the request, then gives `reply`'s answer. */
function recordThen(reply: () => Response): HttpResponseResolver {
  return async ({ request }) => {
    await record(request);
    return reply();
  };
}

/**
 * A handler the test releases by hand, to order one answer after another event.
 * The response is built only once `open` is called.
 */
function gatedReply(reply: () => Response): {
  readonly handler: HttpResponseResolver;
  readonly open: () => void;
} {
  let open: () => void = () => undefined;
  const opened = new Promise<void>((resolve) => {
    open = resolve;
  });
  const handler: HttpResponseResolver = async ({ request }) => {
    await record(request);
    await opened;
    return reply();
  };
  return { handler, open: () => open() };
}

/** One field of a parsed JSON body, or null when the body is not an object. */
function fieldOf(body: unknown, field: string): unknown {
  return typeof body === "object" && body !== null && field in body
    ? Reflect.get(body, field)
    : null;
}

/** What the route answers once the intent is saved: the mode it stored. */
const savedReply: HttpResponseResolver = async ({ request }) => {
  const body: unknown = await request.clone().json();
  await record(request);
  return HttpResponse.json({ mode: fieldOf(body, "mode") });
};

/**
 * Lets the responses already released reach the hook. Only for asserting that
 * something did *not* change; a change is always awaited with `waitFor`.
 */
async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

/** The ways a save can fail, as each failing test names them. */
const SAVE_FAILURES = [
  {
    outcome: "a 401 answer (the session ended)",
    reply: () => HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
  },
  {
    outcome: "a 500 answer",
    reply: () =>
      HttpResponse.json(
        { error: "Failed to save acquisition intent" },
        { status: 500 }
      ),
  },
  { outcome: "a network error", reply: () => HttpResponse.error() },
] as const;

const server = setupMsw(
  http.get(
    INTENT_ROUTE,
    recordThen(() => HttpResponse.json({ intents: [] }))
  ),
  http.put(INTENT_ROUTE, savedReply)
);

/** Serves `intents` as the saved rows of every deck, for one test. */
function givenSavedIntents(intents: readonly unknown[]): void {
  server.use(
    http.get(
      INTENT_ROUTE,
      recordThen(() => HttpResponse.json({ intents }))
    )
  );
}

/** Makes every save fail with `reply`, for one test. */
function givenSavesFail(reply: () => Response): void {
  server.use(http.put(INTENT_ROUTE, recordThen(reply)));
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * The deck the hook is rendered for. `rerenderFor` changes it: Testing Library's
 * `renderHook` takes no initial props through `renderHookWithProviders`, so the hook
 * reads the id from here instead.
 */
let currentDeckId = DECK_ID;

function renderIntents() {
  const rendered = renderHookWithProviders(() =>
    useAcquisitionIntent(currentDeckId)
  );
  return {
    ...rendered,
    rerenderFor(deckId: string) {
      currentDeckId = deckId;
      rendered.rerender();
    },
  };
}

/** Renders the hook and waits until the saved rows have been read. */
async function renderLoaded(saved: Readonly<Record<string, string>>) {
  givenSavedIntents(
    Object.entries(saved).map(([scryfallId, mode]) => ({ scryfallId, mode }))
  );
  const rendered = renderIntents();
  await waitFor(() =>
    expect(rendered.result.current.intentById).toEqual(saved)
  );
  return rendered;
}

const toasts = recordToasts();

beforeEach(() => {
  sent = [];
  currentDeckId = DECK_ID;
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Loading the deck's intents
// ---------------------------------------------------------------------------

describe("useAcquisitionIntent: loading a deck's saved intents", () => {
  it("starts with no intent and asks the deck's intent route once", async () => {
    const { result } = renderIntents();

    expect(result.current.intentById).toEqual({});
    await waitFor(() => expect(sentRequests("GET")).toHaveLength(1));
    expect(sentRequests("GET")[0]).toEqual({
      method: "GET",
      path: `/api/decks/${DECK_ID}/acquisition-intent`,
      contentType: null,
      body: null,
    });
  });

  it("URL-encodes the deck id in the route", async () => {
    currentDeckId = "deck id/with?odd chars";
    renderIntents();

    await waitFor(() => expect(sentRequests("GET")).toHaveLength(1));
    expect(sentRequests("GET")[0]?.path).toBe(
      "/api/decks/deck%20id%2Fwith%3Fodd%20chars/acquisition-intent"
    );
  });

  it("maps each saved row to its printing: proxy_now or buy_later", async () => {
    const { result } = await renderLoaded({
      [SOL_RING]: "proxy_now",
      [SIGNET]: "buy_later",
    });

    expect(result.current.intentById).toEqual({
      [SOL_RING]: "proxy_now",
      [SIGNET]: "buy_later",
    });
  });

  it("skips a saved row whose mode it does not know, buy_now included", async () => {
    givenSavedIntents([
      { scryfallId: SOL_RING, mode: "buy_now" },
      { scryfallId: "printing-mystery", mode: "steal" },
      { scryfallId: 42, mode: "proxy_now" },
      { scryfallId: SIGNET, mode: "buy_later" },
    ]);
    const { result } = renderIntents();

    await waitFor(() =>
      expect(result.current.intentById).toEqual({ [SIGNET]: "buy_later" })
    );
  });

  it("reloads when the deck changes and shows the new deck's intents only", async () => {
    const rendered = await renderLoaded({ [SOL_RING]: "proxy_now" });

    givenSavedIntents([{ scryfallId: SIGNET, mode: "buy_later" }]);
    rendered.rerenderFor("deck-2");

    await waitFor(() =>
      expect(rendered.result.current.intentById).toEqual({
        [SIGNET]: "buy_later",
      })
    );
    expect(sentRequests("GET").map((request) => request.path)).toEqual([
      `/api/decks/${DECK_ID}/acquisition-intent`,
      "/api/decks/deck-2/acquisition-intent",
    ]);
  });

  it("reads a refused load as no intent: a guest or a non-owner gets 401 and an empty list", async () => {
    const rendered = await renderLoaded({ [SOL_RING]: "proxy_now" });

    server.use(
      http.get(
        INTENT_ROUTE,
        recordThen(() =>
          HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
        )
      )
    );
    rendered.rerenderFor("deck-of-someone-else");

    await waitFor(() => expect(rendered.result.current.intentById).toEqual({}));
  });

  it("ends with no intent when the load fails on the network", async () => {
    const rendered = await renderLoaded({ [SOL_RING]: "proxy_now" });

    server.use(
      http.get(
        INTENT_ROUTE,
        recordThen(() => HttpResponse.error())
      )
    );
    rendered.rerenderFor("deck-2");

    await waitFor(() => expect(rendered.result.current.intentById).toEqual({}));
  });

  it("shows no intent for the new deck when its payload cannot be trusted, never the previous deck's", async () => {
    const rendered = await renderLoaded({ [SOL_RING]: "proxy_now" });

    server.use(
      http.get(
        INTENT_ROUTE,
        recordThen(() => HttpResponse.json({ intents: "not a list" }))
      )
    );
    rendered.rerenderFor("deck-2");

    await waitFor(() => expect(rendered.result.current.intentById).toEqual({}));
    expect(sentRequests("GET")).toHaveLength(2);
  });

  it("does not let a failed save from the previous deck undo a choice of the new deck", async () => {
    const rendered = await renderLoaded({});
    const failing = gatedReply(SAVE_FAILURES[1].reply);
    server.use(http.put(INTENT_ROUTE, failing.handler));
    act(() => rendered.result.current.setIntent(SOL_RING, "proxy_now"));
    await waitFor(() => expect(sentRequests("PUT")).toHaveLength(1));

    givenSavedIntents([{ scryfallId: SOL_RING, mode: "buy_later" }]);
    rendered.rerenderFor("deck-2");
    await waitFor(() =>
      expect(rendered.result.current.intentById).toEqual({
        [SOL_RING]: "buy_later",
      })
    );

    failing.open();

    // deck-1's rollback would clear Sol Ring, which deck-2 defers.
    await settle();
    expect(rendered.result.current.intentById).toEqual({
      [SOL_RING]: "buy_later",
    });
  });
});

// ---------------------------------------------------------------------------
// Choosing for one printing
// ---------------------------------------------------------------------------

describe("useAcquisitionIntent: choosing for one printing", () => {
  it("defers the printing at once and saves the choice with PUT {scryfallId, mode}", async () => {
    const { result } = await renderLoaded({});

    act(() => result.current.setIntent(SOL_RING, "proxy_now"));

    expect(result.current.intentById).toEqual({ [SOL_RING]: "proxy_now" });
    await waitFor(() => expect(sentRequests("PUT")).toHaveLength(1));
    expect(sentRequests("PUT")[0]).toEqual({
      method: "PUT",
      path: `/api/decks/${DECK_ID}/acquisition-intent`,
      contentType: "application/json",
      body: { scryfallId: SOL_RING, mode: "proxy_now" },
    });
    expect(result.current.intentById).toEqual({ [SOL_RING]: "proxy_now" });
  });

  it("switches a deferred printing from proxy_now to buy_later", async () => {
    const { result } = await renderLoaded({ [SOL_RING]: "proxy_now" });

    act(() => result.current.setIntent(SOL_RING, "buy_later"));

    expect(result.current.intentById).toEqual({ [SOL_RING]: "buy_later" });
    await waitFor(() => expect(sentRequests("PUT")).toHaveLength(1));
    expect(sentRequests("PUT")[0]?.body).toEqual({
      scryfallId: SOL_RING,
      mode: "buy_later",
    });
  });

  it("buy_now clears the printing's deferral and leaves the other printings alone", async () => {
    const { result } = await renderLoaded({
      [SOL_RING]: "proxy_now",
      [SIGNET]: "buy_later",
    });

    act(() => result.current.setIntent(SOL_RING, "buy_now"));

    expect(result.current.intentById).toEqual({ [SIGNET]: "buy_later" });
    await waitFor(() => expect(sentRequests("PUT")).toHaveLength(1));
    expect(sentRequests("PUT")[0]?.body).toEqual({
      scryfallId: SOL_RING,
      mode: "buy_now",
    });
  });

  it("does not reload the deck's intents after a save: the route is read once", async () => {
    const { result } = await renderLoaded({});

    act(() => result.current.setIntent(SOL_RING, "proxy_now"));
    act(() => result.current.setIntent(SIGNET, "buy_later"));

    await waitFor(() => expect(sentRequests("PUT")).toHaveLength(2));
    expect(sentRequests("GET")).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// When a save fails
// ---------------------------------------------------------------------------

describe("useAcquisitionIntent: when a save fails", () => {
  for (const { outcome, reply } of SAVE_FAILURES) {
    it(`puts a newly deferred printing back on the buy-now list after ${outcome}`, async () => {
      const { result } = await renderLoaded({ [SIGNET]: "buy_later" });
      givenSavesFail(reply);

      act(() => result.current.setIntent(SOL_RING, "proxy_now"));

      expect(result.current.intentById).toEqual({
        [SOL_RING]: "proxy_now",
        [SIGNET]: "buy_later",
      });
      await waitFor(() =>
        expect(result.current.intentById).toEqual({ [SIGNET]: "buy_later" })
      );
    });
  }

  it("restores the earlier deferred mode when the change to another mode fails", async () => {
    const { result } = await renderLoaded({ [SOL_RING]: "buy_later" });
    givenSavesFail(SAVE_FAILURES[1].reply);

    act(() => result.current.setIntent(SOL_RING, "proxy_now"));

    expect(result.current.intentById).toEqual({ [SOL_RING]: "proxy_now" });
    await waitFor(() =>
      expect(result.current.intentById).toEqual({ [SOL_RING]: "buy_later" })
    );
  });

  it("restores a deferral that buy_now failed to clear", async () => {
    const { result } = await renderLoaded({ [SOL_RING]: "proxy_now" });
    givenSavesFail(SAVE_FAILURES[1].reply);

    act(() => result.current.setIntent(SOL_RING, "buy_now"));

    expect(result.current.intentById).toEqual({});
    await waitFor(() =>
      expect(result.current.intentById).toEqual({ [SOL_RING]: "proxy_now" })
    );
  });

  it("rolls back only the failed printing, not a later choice that succeeded on another card", async () => {
    const { result } = await renderLoaded({});
    const failing = gatedReply(SAVE_FAILURES[1].reply);
    server.use(
      http.put(INTENT_ROUTE, async (info) => {
        const body: unknown = await info.request.clone().json();
        const forSolRing = fieldOf(body, "scryfallId") === SOL_RING;
        return forSolRing ? failing.handler(info) : savedReply(info);
      })
    );

    act(() => result.current.setIntent(SOL_RING, "proxy_now"));
    act(() => result.current.setIntent(SIGNET, "buy_later"));
    await waitFor(() => expect(sentRequests("PUT")).toHaveLength(2));
    expect(result.current.intentById).toEqual({
      [SOL_RING]: "proxy_now",
      [SIGNET]: "buy_later",
    });

    failing.open();

    await waitFor(() =>
      expect(result.current.intentById).toEqual({ [SIGNET]: "buy_later" })
    );
  });

  it("ignores a failed save that a later choice on the same printing has superseded", async () => {
    const { result } = await renderLoaded({});
    const failing = gatedReply(SAVE_FAILURES[1].reply);
    server.use(http.put(INTENT_ROUTE, failing.handler));

    act(() => result.current.setIntent(SOL_RING, "proxy_now"));
    await waitFor(() => expect(sentRequests("PUT")).toHaveLength(1));

    server.use(http.put(INTENT_ROUTE, savedReply));
    act(() => result.current.setIntent(SOL_RING, "buy_later"));
    await waitFor(() => expect(sentRequests("PUT")).toHaveLength(2));

    failing.open();

    // The stale failure must not undo the later choice.
    await settle();
    expect(result.current.intentById).toEqual({ [SOL_RING]: "buy_later" });
  });

  for (const { outcome, reply } of SAVE_FAILURES) {
    it(`tells the player the choice was not saved, in an error toast, after ${outcome}`, async () => {
      const { result } = await renderLoaded({});
      givenSavesFail(reply);

      act(() => result.current.setIntent(SOL_RING, "proxy_now"));

      await waitFor(() => expect(result.current.intentById).toEqual({}));
      expect(toasts).toHaveBeenCalledTimes(1);
      expect(toasts).toHaveBeenCalledWith(
        "error",
        "Could not save your choice — try again"
      );
    });
  }

  it("says it in the player's language", async () => {
    givenSavesFail(SAVE_FAILURES[1].reply);
    const { result } = renderHookWithProviders(
      () => useAcquisitionIntent(currentDeckId),
      { locale: "fr" }
    );
    await waitFor(() => expect(sentRequests("GET")).toHaveLength(1));

    act(() => result.current.setIntent(SOL_RING, "proxy_now"));

    await waitFor(() =>
      expect(toasts).toHaveBeenCalledWith(
        "error",
        "Impossible d'enregistrer votre choix — réessayez"
      )
    );
  });

  it("raises no toast for a failed save that a later choice on the same printing has superseded", async () => {
    const { result } = await renderLoaded({});
    const failing = gatedReply(SAVE_FAILURES[1].reply);
    server.use(http.put(INTENT_ROUTE, failing.handler));

    act(() => result.current.setIntent(SOL_RING, "proxy_now"));
    await waitFor(() => expect(sentRequests("PUT")).toHaveLength(1));

    server.use(http.put(INTENT_ROUTE, savedReply));
    act(() => result.current.setIntent(SOL_RING, "buy_later"));
    await waitFor(() => expect(sentRequests("PUT")).toHaveLength(2));

    failing.open();

    // The later choice stands, so there is nothing to tell the player.
    await settle();
    expect(result.current.intentById).toEqual({ [SOL_RING]: "buy_later" });
    expect(toasts).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// A choice made before the first load answers
// ---------------------------------------------------------------------------

describe("useAcquisitionIntent: a choice made before the saved intents arrive", () => {
  /** Renders the hook with the first load held back, serving `saved` once released. */
  async function renderWithLoadHeld(saved: readonly unknown[]) {
    const load = gatedReply(() => HttpResponse.json({ intents: saved }));
    server.use(http.get(INTENT_ROUTE, load.handler));
    const rendered = renderIntents();
    await waitFor(() => expect(sentRequests("GET")).toHaveLength(1));
    return { ...rendered, releaseLoad: load.open };
  }

  it("keeps the choice when the load arrives, and takes the loaded values for the other cards", async () => {
    const { result, releaseLoad } = await renderWithLoadHeld([
      { scryfallId: SIGNET, mode: "buy_later" },
    ]);

    act(() => result.current.setIntent(SOL_RING, "proxy_now"));
    await waitFor(() => expect(sentRequests("PUT")).toHaveLength(1));
    expect(result.current.intentById).toEqual({ [SOL_RING]: "proxy_now" });

    releaseLoad();

    await waitFor(() =>
      expect(result.current.intentById).toEqual({
        [SOL_RING]: "proxy_now",
        [SIGNET]: "buy_later",
      })
    );
    // The PUT saved the choice; the screen must not disagree with the server.
    await settle();
    expect(result.current.intentById).toEqual({
      [SOL_RING]: "proxy_now",
      [SIGNET]: "buy_later",
    });
  });

  it("keeps a buy_now choice: the loaded deferral of that card stays cleared", async () => {
    const { result, releaseLoad } = await renderWithLoadHeld([
      { scryfallId: SOL_RING, mode: "proxy_now" },
      { scryfallId: SIGNET, mode: "buy_later" },
    ]);

    act(() => result.current.setIntent(SOL_RING, "buy_now"));
    await waitFor(() => expect(sentRequests("PUT")).toHaveLength(1));

    releaseLoad();

    await waitFor(() =>
      expect(result.current.intentById).toEqual({ [SIGNET]: "buy_later" })
    );
    await settle();
    expect(result.current.intentById).toEqual({ [SIGNET]: "buy_later" });
  });

  it("lets the loaded value through for a choice whose save had already failed", async () => {
    givenSavesFail(SAVE_FAILURES[1].reply);
    const { result, releaseLoad } = await renderWithLoadHeld([
      { scryfallId: SOL_RING, mode: "buy_later" },
    ]);

    act(() => result.current.setIntent(SOL_RING, "proxy_now"));
    // The failed save rolled the card back before the load answered.
    await waitFor(() => expect(result.current.intentById).toEqual({}));

    releaseLoad();

    // The server never took proxy_now, so its saved buy_later is the truth.
    await waitFor(() =>
      expect(result.current.intentById).toEqual({ [SOL_RING]: "buy_later" })
    );
  });
});
