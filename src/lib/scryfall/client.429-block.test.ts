/**
 * The browser's Scryfall client while the runtime queue's 429 block runs.
 *
 * Kept apart from `client.test.ts`, which is over the file-size limit and must
 * not grow. Sociable: the real client, its shared-cache lookup and the runtime
 * queue, with only the global `fetch` stubbed. The cache route answers 503, so
 * every search falls through to Scryfall, which answers 429.
 *
 * @module scryfall/client.429-block.test
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";
import { ScryfallApiError } from "./api-error";
import { searchCards } from "./client";
import { SCRYFALL_API } from "./constants";

/** The URL a `fetch` call asked for. */
function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  return input instanceof URL ? input.href : input.url;
}

/** Stubs `fetch`: no cached page on the server, and a 429 from Scryfall. */
function stubFetch() {
  const fetchMock = vi.fn<typeof fetch>(async (input) =>
    urlOf(input).startsWith("/api/cache/")
      ? new Response(null, { status: 503 })
      : Response.json(
          { object: "error", status: 429, details: "Too Many Requests" },
          { status: 429 }
        )
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** How many of the stubbed `fetch` calls went to api.scryfall.com. */
function scryfallRequests(fetchMock: ReturnType<typeof stubFetch>): number {
  return fetchMock.mock.calls.filter(([input]) =>
    urlOf(input).startsWith(SCRYFALL_API)
  ).length;
}

describe("searchCards during Scryfall's 429 block", () => {
  beforeEach(() => {
    vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    vi.spyOn(logger, "info").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("fails a search retried during the block as a 429, without sending it", async () => {
    const fetchMock = stubFetch();
    await expect(searchCards("sol ring")).rejects.toMatchObject({
      status: 429,
    });

    const retry = searchCards("sol ring");

    await expect(retry).rejects.toBeInstanceOf(ScryfallApiError);
    await expect(retry).rejects.toMatchObject({ status: 429 });
    expect(scryfallRequests(fetchMock)).toBe(1);
  });
});
