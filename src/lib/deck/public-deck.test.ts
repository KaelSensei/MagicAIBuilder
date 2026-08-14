import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchPublicDeck } from "@/lib/deck/public-deck";

/**
 * fetchPublicDeck swallows every failure into `null`, and the deck page turns
 * that null straight into notFound(). So each null path below is a distinct way
 * a real deck page 404s — worth pinning individually.
 */

const DECK_FIXTURE = { id: "deck-1", name: "Atraxa", isOwner: false };

function mockFetch(impl: (url: string, init?: RequestInit) => unknown) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("fetchPublicDeck", () => {
  it("returns the deck on a successful response", async () => {
    mockFetch(() => okResponse(DECK_FIXTURE));

    await expect(fetchPublicDeck("deck-1", null)).resolves.toEqual(DECK_FIXTURE);
  });

  it("returns null on a non-ok response rather than throwing", async () => {
    mockFetch(() => ({ ok: false, status: 404, json: async () => ({}) }));

    await expect(fetchPublicDeck("missing", null)).resolves.toBeNull();
  });

  it("returns null when the fetch itself rejects", async () => {
    mockFetch(() => {
      throw new Error("ECONNREFUSED");
    });

    await expect(fetchPublicDeck("deck-1", null)).resolves.toBeNull();
  });

  it("returns null when the body is not valid JSON", async () => {
    mockFetch(() => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    }));

    await expect(fetchPublicDeck("deck-1", null)).resolves.toBeNull();
  });

  it("forwards the session cookie and skips the cache for a signed-in viewer", async () => {
    const fetchMock = mockFetch(() => okResponse(DECK_FIXTURE));

    await fetchPublicDeck("deck-1", "authjs.session-token=abc");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/deck/deck-1"),
      expect.objectContaining({
        headers: { cookie: "authjs.session-token=abc" },
        cache: "no-store",
      })
    );
  });

  it("lets an anonymous request stay cacheable", async () => {
    const fetchMock = mockFetch(() => okResponse(DECK_FIXTURE));

    await fetchPublicDeck("deck-1", null);

    const init = fetchMock.mock.calls[0][1] as RequestInit & {
      next?: { revalidate: number };
    };
    expect(init.headers).toBeUndefined();
    expect(init.cache).toBeUndefined();
    expect(init.next).toEqual({ revalidate: 60 });
  });
});

describe("fetchPublicDeck — base URL resolution", () => {
  it("prefers NEXT_PUBLIC_APP_URL when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://magicaibuilder.com");
    const fetchMock = mockFetch(() => okResponse(DECK_FIXTURE));

    await fetchPublicDeck("deck-1", null);

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://magicaibuilder.com/api/deck/deck-1"
    );
  });

  it("falls back to the https VERCEL_URL on a preview deployment", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("VERCEL_URL", "preview-abc.vercel.app");
    const fetchMock = mockFetch(() => okResponse(DECK_FIXTURE));

    await fetchPublicDeck("deck-1", null);

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://preview-abc.vercel.app/api/deck/deck-1"
    );
  });

  it("falls back to localhost when neither env var is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    const fetchMock = mockFetch(() => okResponse(DECK_FIXTURE));

    await fetchPublicDeck("deck-1", null);

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:3000/api/deck/deck-1");
  });
});
