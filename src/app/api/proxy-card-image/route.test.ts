import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";
import { logger } from "@/lib/logger";
import { USER_AGENT } from "@/lib/http";

const VALID_URL =
  "https://cards.scryfall.io/normal/front/a/b/abc123.jpg";

function makeReq(search: string): Request {
  return new Request(`http://localhost:3000/api/proxy-card-image?${search}`);
}

/** @returns a small JPEG answer, as cards.scryfall.io sends one */
function imageResponse(): Response {
  return new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), {
    status: 200,
    headers: { "content-type": "image/jpeg" },
  });
}

/**
 * A stand-in for the network that honours `fetch`'s `redirect` option as
 * Node's fetch does: "follow" (the default) chases the `Location` header,
 * "manual" hands the 3xx answer back, "error" rejects. It records every URL it
 * is asked for, so a test can prove that a host was never contacted.
 *
 * @param routes - the answer each absolute URL gives; any other URL answers 404
 */
function fakeNetwork(routes: Readonly<Record<string, () => Response>>) {
  const requested: string[] = [];
  async function fakeFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    let url = input instanceof Request ? input.url : String(input);
    for (let hop = 0; hop <= 20; hop++) {
      requested.push(url);
      const answer = routes[url]?.() ?? new Response(null, { status: 404 });
      const location = answer.headers.get("location");
      const isRedirect =
        answer.status >= 300 && answer.status < 400 && location !== null;
      if (!isRedirect) return answer;
      const mode = init?.redirect ?? "follow";
      if (mode === "manual") return answer;
      if (mode === "error") {
        throw new TypeError("fetch failed: unexpected redirect");
      }
      url = new URL(location, url).toString();
    }
    throw new TypeError("fetch failed: redirect count exceeded");
  }
  return { fetch: fakeFetch, requested };
}

describe("GET /api/proxy-card-image", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "image/jpeg" }),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 when url is missing", async () => {
    const res = await GET(makeReq(""));
    expect(res.status).toBe(400);
  });

  it("returns 403 for non-Scryfall host", async () => {
    const res = await GET(
      makeReq(`url=${encodeURIComponent("https://evil.com/x.jpg")}`)
    );
    expect(res.status).toBe(403);
  });

  it("returns 403 for http scheme", async () => {
    const res = await GET(
      makeReq(
        `url=${encodeURIComponent("http://cards.scryfall.io/normal/front/a/b/x.jpg")}`
      )
    );
    expect(res.status).toBe(403);
  });

  it("names the app with the shared User-Agent", async () => {
    await GET(makeReq(`url=${encodeURIComponent(VALID_URL)}`));

    const init = vi.mocked(global.fetch).mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get("User-Agent")).toBe(USER_AGENT);
  });

  it("proxies allowed URL and returns image bytes", async () => {
    const res = await GET(makeReq(`url=${encodeURIComponent(VALID_URL)}`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(vi.mocked(global.fetch).mock.calls[0]?.[0]).toBe(VALID_URL);
  });

  it("returns 502 when upstream is not ok", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as unknown as Response);

    const res = await GET(makeReq(`url=${encodeURIComponent(VALID_URL)}`));
    expect(res.status).toBe(502);
  });

  it("returns 502 when content-type is not image/*", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "text/html" }),
    } as unknown as Response);

    const res = await GET(makeReq(`url=${encodeURIComponent(VALID_URL)}`));
    expect(res.status).toBe(502);
  });

  it("refuses an upstream that declares more than 5 MB without reading it", async () => {
    const arrayBuffer = vi.fn();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "image/png", "content-length": String(6 * 1024 * 1024) }),
      arrayBuffer,
    } as unknown as Response);

    const res = await GET(makeReq(`url=${encodeURIComponent(VALID_URL)}`));
    expect(res.status).toBe(502);
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it("refuses an upstream whose body turns out larger than its header said", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "image/png" }),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(5 * 1024 * 1024 + 1)),
    } as unknown as Response);

    const res = await GET(makeReq(`url=${encodeURIComponent(VALID_URL)}`));
    expect(res.status).toBe(502);
  });
});

describe("GET /api/proxy-card-image request timing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([
    ["a proxied image", () => vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "image/jpeg" }),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
    })), `url=${encodeURIComponent(VALID_URL)}`, 200],
    ["a missing url", () => undefined, "", 400],
    ["a disallowed host", () => undefined, `url=${encodeURIComponent("https://evil.com/x.jpg")}`, 403],
    ["an upstream failure", () => vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline"))), `url=${encodeURIComponent(VALID_URL)}`, 502],
  ])("logs status and duration once for %s", async (_label, arrange, search, expected) => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    arrange();

    const res = await GET(makeReq(search));

    expect(res.status).toBe(expected);
    const calls = info.mock.calls.filter(([message]) => message === "Card image proxy request completed");
    expect(calls).toEqual([
      ["Card image proxy request completed", "GET /api/proxy-card-image", { status: expected, durationMs: expect.any(Number) }],
    ]);
  });
});

describe("GET /api/proxy-card-image upstream redirects", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("refuses a redirect to a host outside the allowlist without contacting that host", async () => {
    const foreignUrl = "https://intranet.example/secret.jpg";
    const network = fakeNetwork({
      [VALID_URL]: () =>
        new Response(null, { status: 302, headers: { location: foreignUrl } }),
      [foreignUrl]: imageResponse,
    });
    vi.stubGlobal("fetch", network.fetch);

    const res = await GET(makeReq(`url=${encodeURIComponent(VALID_URL)}`));

    expect(res.status).toBe(502);
    expect(network.requested).toEqual([VALID_URL]);
  });
});

describe("GET /api/proxy-card-image rate limit", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** @returns a proxy request for a real image from the client at `ip` */
  function fromClient(ip: string): Request {
    return new Request(
      `http://localhost:3000/api/proxy-card-image?url=${encodeURIComponent(VALID_URL)}`,
      { headers: { "x-real-ip": ip } }
    );
  }

  it("answers 429 once a client passes 300 requests a minute, and serves other clients", async () => {
    vi.useFakeTimers({
      now: new Date("2026-11-11T10:00:00Z"),
      toFake: ["Date"],
    });
    vi.spyOn(logger, "info").mockImplementation(() => undefined);
    const network = fakeNetwork({ [VALID_URL]: imageResponse });
    vi.stubGlobal("fetch", network.fetch);
    for (let request = 0; request < 300; request++) {
      await GET(fromClient("203.0.113.9"));
    }

    const throttled = await GET(fromClient("203.0.113.9"));

    expect(throttled.status).toBe(429);
    expect(throttled.headers.get("Retry-After")).toBe("60");
    expect(await throttled.json()).toEqual({ error: "Too many requests" });
    expect(network.requested).toHaveLength(300);
    expect((await GET(fromClient("203.0.113.10"))).status).toBe(200);
  });
});
