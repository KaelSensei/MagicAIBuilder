import { describe, it, expect, vi, beforeEach } from "vitest";
import { httpGet, parseJson, BOT_CHALLENGE_MESSAGE } from "./http";

describe("parseJson", () => {
  it("returns the value typed as T", () => {
    const val = parseJson<{ name: string }>({ name: "Sol Ring" });
    expect(val.name).toBe("Sol Ring");
  });
});

describe("httpGet", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns response on 200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("{}", { status: 200 })
    );
    const res = await httpGet("https://example.com/api");
    expect(res.status).toBe(200);
  });

  it("throws on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 404 })
    );
    await expect(httpGet("https://example.com/api")).rejects.toThrow("not found");
  });

  it("throws on 403", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 403 })
    );
    await expect(httpGet("https://example.com/api")).rejects.toThrow("private");
  });

  /**
   * A Cloudflare managed challenge is a 403 with an HTML page, and a genuinely
   * forbidden deck is a 403 too - the two need opposite advice. "Deck is
   * private or access denied" sends the user to change their own deck settings,
   * which fixes nothing when the source is refusing the app. TappedOut serves
   * exactly this on every public deck.
   */
  it("names the bot challenge when Cloudflare declares one", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("<html>Just a moment...</html>", {
        status: 403,
        headers: { "cf-mitigated": "challenge", "content-type": "text/html" },
      })
    );
    await expect(httpGet("https://example.com/deck")).rejects.toThrow(
      BOT_CHALLENGE_MESSAGE
    );
  });

  it("names the bot challenge from the body when no header declares it", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        "<!DOCTYPE html><title>Attention Required! | Cloudflare</title>",
        { status: 403, headers: { "content-type": "text/html; charset=UTF-8" } }
      )
    );
    await expect(httpGet("https://example.com/deck")).rejects.toThrow(
      BOT_CHALLENGE_MESSAGE
    );
  });

  it("still reports a plain HTML 403 as a private deck", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("<html><body>You do not own this deck.</body></html>", {
        status: 403,
        headers: { "content-type": "text/html" },
      })
    );
    await expect(httpGet("https://example.com/deck")).rejects.toThrow("private");
  });

  it("does not read the body of a JSON 403", async () => {
    const res = new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
    const text = vi.spyOn(res, "text");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(res);

    await expect(httpGet("https://example.com/api")).rejects.toThrow("private");
    expect(text).not.toHaveBeenCalled();
  });

  it("throws on 500", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 })
    );
    await expect(httpGet("https://example.com/api")).rejects.toThrow("HTTP 500");
  });

  it("sets User-Agent header", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("{}", { status: 200 })
    );
    await httpGet("https://example.com/api");
    const callHeaders = spy.mock.calls[0][1]?.headers as Record<string, string>;
    expect(callHeaders["User-Agent"]).toContain("MagicAIBuilder");
  });
});
