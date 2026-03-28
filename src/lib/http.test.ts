import { describe, it, expect, vi, beforeEach } from "vitest";
import { httpGet, parseJson } from "./http";

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
