// @vitest-environment node
/**
 * The Scryfall client as a server runs it (no `window`): route handlers and
 * `lib/deck/batch-fetch.ts` call it from Node. The browser side lives in
 * `client.test.ts`.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { USER_AGENT } from "@/lib/http";
import { __resetRateLimiter, getCardByName } from "./client";

describe("Scryfall client on the server", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    __resetRateLimiter();
  });

  it("names the app in the User-Agent and asks for JSON", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ id: "card-1", name: "Sol Ring" }), {
          status: 200,
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    await getCardByName("Sol Ring");

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get("User-Agent")).toBe(USER_AGENT);
    expect(headers.get("Accept")).toBe("application/json");
  });
});
