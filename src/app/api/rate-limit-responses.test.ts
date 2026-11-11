// @vitest-environment node
/**
 * Characterization suite: the exact 429 answer of every API route that builds
 * one by hand from `checkRateLimit`, as it was before P1-40 moved them onto
 * `rateLimitResponse` (`src/lib/api/route-kit.ts`).
 *
 * Each route words its message its own way, and clients may show it, so the
 * suite pins the body, the status and `Retry-After` exactly. Every route runs
 * for real against the real in-memory limiter: a client spends its budget on
 * requests the route refuses before any database or network call, then one
 * more request is throttled 1.7 s into the window. 58.3 s are then left in a
 * one-minute window, which `Retry-After` must round up to 59, not down to 58.
 *
 * Not covered here: the AI routes (frozen until their own series), the
 * `/api/v1` envelope (`src/lib/api/authenticate.ts`) and the translated-search
 * `{ code }` answer (`search/translate`), which build other bodies.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/logger";
import { COMBO_LOOKUPS_PER_CLIENT } from "@/modules/combos/domain/lookup-policy";
import { MAX_QUERY_BODY_BYTES } from "@/modules/combos/domain/deck-query";
import { PUBLIC_DECK_READS_PER_CLIENT } from "@/lib/deck/public-read-policy";
import { POST as signUp } from "./auth/signup/route";
import { readThroughResponse } from "./cache/read-through-response";
import { POST as findCombos } from "./combos/route";
import { GET as readPublicDeck } from "./deck/[id]/route";
import { POST as listMoxfieldDecks } from "./import/moxfield-user/route";
import { POST as importFromUrl } from "./import/url/route";
import { GET as readMeta } from "./meta/[commanderSlug]/route";
import { GET as readMetaHistory } from "./meta/[commanderSlug]/history/route";
import { GET as proxyCardImage } from "./proxy-card-image/route";

const WINDOW_OPENED_AT = new Date("2026-11-11T12:00:00.000Z");
const THROTTLED_AFTER_MS = 1_700;

/** One request from `ip`, carrying only what the route reads before its checks. */
function request(
  path: string,
  ip: string,
  init: Readonly<{
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  }> = {}
): Request {
  return new Request(`http://localhost${path}`, {
    method: init.method ?? "GET",
    body: init.body,
    headers: { "x-real-ip": ip, ...init.headers },
  });
}

/** The `params` argument of a dynamic route. */
function params<P>(values: P): { params: Promise<P> } {
  return { params: Promise.resolve(values) };
}

/**
 * Spends a client's whole budget, then sends one more request 1.7 s later.
 *
 * @param budget - requests the route allows per window
 * @param refusedStatus - what each budgeted request answers: the route refuses
 *   it before any database or network call
 * @param send - one request from the same client
 * @returns the answer to the request over budget
 */
async function throttledAnswer(
  budget: number,
  refusedStatus: number,
  send: () => Promise<Response>
): Promise<{ status: number; retryAfter: string | null; body: unknown }> {
  for (let sent = 0; sent < budget; sent += 1) {
    expect((await send()).status).toBe(refusedStatus);
  }
  vi.setSystemTime(WINDOW_OPENED_AT.getTime() + THROTTLED_AFTER_MS);
  const response = await send();
  return {
    status: response.status,
    retryAfter: response.headers.get("Retry-After"),
    body: await response.json(),
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: WINDOW_OPENED_AT });
  // The timed routes log one line per request; the suite reads answers only.
  vi.spyOn(logger, "info").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("429 answers built from checkRateLimit", () => {
  it("sign-up answers its own message, with the 15-minute window's seconds left", async () => {
    // 5 attempts per 15 minutes per address; a malformed body is refused first.
    const answer = await throttledAnswer(5, 400, () =>
      signUp(
        request("/api/auth/signup", "192.0.2.10", { method: "POST", body: "{" })
      )
    );

    expect(answer).toEqual({
      status: 429,
      retryAfter: "899",
      body: { error: "Too many signup attempts. Please try again later." },
    });
  });

  it("the URL import puts the seconds left in its message", async () => {
    // 10 imports per minute per address, a budget shared with the profile import.
    const answer = await throttledAnswer(10, 400, () =>
      importFromUrl(
        request("/api/import/url", "192.0.2.20", { method: "POST", body: "{" })
      )
    );

    expect(answer).toEqual({
      status: 429,
      retryAfter: "59",
      body: { error: "Too many requests. Please wait 59s before retrying." },
    });
  });

  it("the Moxfield profile import puts the seconds left in its message", async () => {
    const answer = await throttledAnswer(10, 400, () =>
      listMoxfieldDecks(
        request("/api/import/moxfield-user", "192.0.2.30", {
          method: "POST",
          body: "{",
        })
      )
    );

    expect(answer).toEqual({
      status: 429,
      retryAfter: "59",
      body: { error: "Too many requests. Please wait 59s before retrying." },
    });
  });

  it("commander meta puts the seconds left in its message", async () => {
    // 30 reads per minute per address; a malformed slug is refused first.
    const answer = await throttledAnswer(30, 400, () =>
      readMeta(
        request("/api/meta/BAD!", "192.0.2.40"),
        params({ commanderSlug: "BAD!" })
      )
    );

    expect(answer).toEqual({
      status: 429,
      retryAfter: "59",
      body: { error: "Too many requests. Retry in 59s." },
    });
  });

  it("commander meta history puts the seconds left in its message", async () => {
    const answer = await throttledAnswer(30, 400, () =>
      readMetaHistory(
        request("/api/meta/BAD!/history", "192.0.2.50"),
        params({ commanderSlug: "BAD!" })
      )
    );

    expect(answer).toEqual({
      status: 429,
      retryAfter: "59",
      body: { error: "Too many requests. Retry in 59s." },
    });
  });

  it("combos answer their own message", async () => {
    // A body declaring more bytes than any valid list is refused first (413).
    const answer = await throttledAnswer(COMBO_LOOKUPS_PER_CLIENT, 413, () =>
      findCombos(
        request("/api/combos", "192.0.2.60", {
          method: "POST",
          body: "{}",
          headers: { "Content-Length": String(MAX_QUERY_BODY_BYTES + 1) },
        })
      )
    );

    expect(answer).toEqual({
      status: 429,
      retryAfter: "59",
      body: { error: "Too many combo lookups" },
    });
  });

  it("the card image proxy answers a plain message", async () => {
    // 300 images per minute per address; a request without a URL is refused first.
    const answer = await throttledAnswer(300, 400, () =>
      proxyCardImage(request("/api/proxy-card-image", "192.0.2.70"))
    );

    expect(answer).toEqual({
      status: 429,
      retryAfter: "59",
      body: { error: "Too many requests" },
    });
  });

  it("the public deck read answers its own message", async () => {
    const tooLongId = "d".repeat(51);
    const answer = await throttledAnswer(
      PUBLIC_DECK_READS_PER_CLIENT,
      400,
      () =>
        readPublicDeck(
          request(`/api/deck/${tooLongId}`, "192.0.2.80"),
          params({ id: tooLongId })
        )
    );

    expect(answer).toEqual({
      status: 429,
      retryAfter: "59",
      body: { error: "Too many deck requests" },
    });
  });
});

describe("429 answer of the shared Scryfall cache routes", () => {
  it("answers a throttled fill with a plain message and the seconds left, rounded up", async () => {
    const response = readThroughResponse(
      { kind: "throttled", retryAfterMs: 58_300 },
      60_000
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("59");
    expect(response.headers.get("Cache-Control")).toBeNull();
    expect(await response.json()).toEqual({ error: "Too many requests" });
  });
});
