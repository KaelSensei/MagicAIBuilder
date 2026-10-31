import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMoxfieldUserDecks } from "@/lib/import/moxfield-user";
import { POST } from "./route";
import { logger } from "@/lib/logger";

vi.mock("@/lib/import/moxfield-user", () => ({
  fetchMoxfieldUserDecks: vi.fn(),
}));

describe("POST /api/import/moxfield-user", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards the requested profile page to Moxfield", async () => {
    vi.mocked(fetchMoxfieldUserDecks).mockResolvedValue({
      decks: [
        {
          id: "deck-21",
          name: "Najeela",
          format: "commander",
          lastUpdatedAt: null,
        },
      ],
      total: 21,
      hasMore: false,
    });
    const request = new Request("http://localhost/api/import/moxfield-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "totoro", pageNumber: 2 }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(fetchMoxfieldUserDecks).toHaveBeenCalledWith("totoro", 2);
  });

  it("limits public profile imports per client before calling Moxfield", async () => {
    vi.mocked(fetchMoxfieldUserDecks).mockResolvedValue({
      decks: [],
      total: 0,
      hasMore: false,
    });

    const request = (ip: string) =>
      new Request("http://localhost/api/import/moxfield-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-real-ip": ip },
        body: JSON.stringify({ username: "totoro" }),
      });

    for (let attempt = 0; attempt < 10; attempt++) {
      expect((await POST(request("203.0.113.42"))).status).toBe(200);
    }

    const blocked = await POST(request("203.0.113.42"));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBe("60");
    expect(fetchMoxfieldUserDecks).toHaveBeenCalledTimes(10);
    expect((await POST(request("203.0.113.43"))).status).toBe(200);
  });
});

describe("POST /api/import/moxfield-user request timing", () => {
  let client = 0;

  /**
   * Builds an import request from a unique client so rate limits from other tests do not apply.
   *
   * @param body Raw request body.
   * @returns A POST request for the route.
   */
  function importRequest(body: string): Request {
    client += 1;
    return new Request("http://localhost/api/import/moxfield-user", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-real-ip": `203.0.113.${client}` },
      body,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["a loaded profile", () => vi.mocked(fetchMoxfieldUserDecks).mockResolvedValue({ decks: [], total: 0, hasMore: false }), JSON.stringify({ username: "totoro" }), 200],
    ["an invalid username", () => undefined, JSON.stringify({ username: "bad name!" }), 400],
    ["malformed JSON", () => undefined, "{", 400],
    ["a Moxfield failure", () => vi.mocked(fetchMoxfieldUserDecks).mockRejectedValue(new Error("upstream 503")), JSON.stringify({ username: "totoro" }), 502],
  ])("logs status and duration once for %s", async (_label, arrange, body, expected) => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
    arrange();

    const response = await POST(importRequest(body));

    expect(response.status).toBe(expected);
    const calls = info.mock.calls.filter(([message]) => message === "Moxfield profile import completed");
    expect(calls).toEqual([
      ["Moxfield profile import completed", "POST /api/import/moxfield-user", { status: expected, durationMs: expect.any(Number) }],
    ]);
    info.mockRestore();
  });
});
