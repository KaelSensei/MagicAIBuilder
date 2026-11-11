// @vitest-environment node
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import { logger } from "@/lib/logger";
import {
  jsonError,
  logRouteFailure,
  rateLimitResponse,
  retryAfterHeaders,
  withRequestLog,
  type RouteParams,
} from "./route-kit";

const captureException = vi.hoisted(() => vi.fn());

// Sentry is a package boundary: the real logger runs, and the report it would
// send is what the failure tests read.
vi.mock(import("@sentry/nextjs"), () => ({ captureException }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  captureException.mockReset();
});

describe("rateLimitResponse", () => {
  it("answers 429 with { error } and Retry-After in whole seconds, rounded up", async () => {
    const response = rateLimitResponse(
      { retryAfterMs: 58_300 },
      "Too many requests"
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("59");
    expect(await response.json()).toEqual({ error: "Too many requests" });
  });

  it("builds the message from the same whole seconds the header carries", async () => {
    const response = rateLimitResponse(
      { retryAfterMs: 4_001 },
      (seconds) => `Too many requests. Retry in ${seconds}s.`
    );

    expect(response.headers.get("Retry-After")).toBe("5");
    expect(await response.json()).toEqual({
      error: "Too many requests. Retry in 5s.",
    });
  });
});

describe("retryAfterHeaders", () => {
  it("never rounds a wait shorter than a second down to zero", () => {
    expect(retryAfterHeaders({ retryAfterMs: 1 })).toEqual({
      "Retry-After": "1",
    });
  });
});

describe("jsonError", () => {
  it("answers { error } with the status", async () => {
    const response = jsonError(404, "Deck not found");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Deck not found" });
  });

  it("puts extra fields beside error, without wrapping them in an envelope", async () => {
    const response = jsonError(400, "Invalid input", { details: ["Required"] });

    expect(await response.json()).toEqual({
      error: "Invalid input",
      details: ["Required"],
    });
  });
});

describe("logRouteFailure", () => {
  it("reports the thrown error itself, so the report keeps the failure's stack", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const thrown = new Error("connection reset");

    logRouteFailure(thrown, "GET /api/decks/:id/playtest-sessions", {
      id: "deck-1",
    });

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException.mock.calls[0]?.[0]).toBe(thrown);
    expect(captureException).toHaveBeenCalledWith(thrown, {
      tags: { context: "GET /api/decks/:id/playtest-sessions" },
      extra: { meta: [thrown, { id: "deck-1" }] },
    });
  });

  it("logs under the message the routes already use, with the error after the context", () => {
    const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const thrown = new Error("connection reset");

    logRouteFailure(thrown, "PATCH /api/decks/:id/folder");

    expect(error).toHaveBeenCalledWith(
      "Unexpected error",
      "PATCH /api/decks/:id/folder",
      thrown
    );
  });
});

describe("withRequestLog", () => {
  const label = {
    message: "Profile request completed",
    context: "GET /api/user/profile",
  };

  it("returns the handler's response and logs its status and duration once", async () => {
    vi.useFakeTimers({ toFake: ["performance"] });
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    const answer = Response.json({ ok: true }, { status: 201 });

    const response = await withRequestLog(label, async () => {
      vi.advanceTimersByTime(42);
      return answer;
    });

    expect(response).toBe(answer);
    expect(info.mock.calls).toEqual([
      [
        "Profile request completed",
        "GET /api/user/profile",
        { status: 201, durationMs: 42 },
      ],
    ]);
  });

  it("logs status 500 and rethrows when the handler throws", async () => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    const thrown = new Error("boom");

    await expect(
      withRequestLog(label, () => Promise.reject(thrown))
    ).rejects.toBe(thrown);

    expect(info).toHaveBeenCalledWith(
      "Profile request completed",
      "GET /api/user/profile",
      {
        status: 500,
        durationMs: expect.any(Number),
      }
    );
  });
});

describe("RouteParams", () => {
  it("types the awaited params of a dynamic segment as read-only strings", () => {
    expectTypeOf<RouteParams<"id" | "snapshotId">>().toEqualTypeOf<{
      readonly params: Promise<{
        readonly id: string;
        readonly snapshotId: string;
      }>;
    }>();
  });
});
