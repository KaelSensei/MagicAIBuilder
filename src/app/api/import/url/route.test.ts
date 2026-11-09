import { afterEach, describe, expect, it, vi } from "vitest";
import { MOXFIELD_REFUSED_MESSAGE } from "@/lib/import/moxfield-client";
import { logger } from "@/lib/logger";
import { POST } from "./route";

let client = 0;

/**
 * Builds an import request from a fresh client so the per-IP rate limit
 * never carries over between tests.
 *
 * @param url - deck URL to import
 * @returns a POST request for the route
 */
function importRequest(url: string): Request {
  client += 1;
  return new Request("http://localhost/api/import/url", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": `198.51.100.${client}` },
    body: JSON.stringify({ url }),
  });
}

/** @returns the Cloudflare block page Moxfield served the app on 2026-11-09 */
function cloudflareBlockPage(): Response {
  return new Response("<!DOCTYPE html><title>Attention Required! | Cloudflare</title>", {
    status: 403,
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
}

describe("POST /api/import/url when Moxfield refuses", () => {
  afterEach(() => vi.restoreAllMocks());

  it("tells the client it was a refusal, with the paste-import way out", async () => {
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
    vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(cloudflareBlockPage());

    const response = await POST(importRequest("https://moxfield.com/decks/abc123"));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error: MOXFIELD_REFUSED_MESSAGE,
      code: "moxfield_refused",
    });
  });

  it("logs the refusal as a warning, not as a server error", async () => {
    const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(cloudflareBlockPage());

    await POST(importRequest("https://moxfield.com/decks/abc123"));

    expect(warn).toHaveBeenCalledWith("Moxfield refused the import", "POST /api/import/url", {
      status: 403,
    });
    expect(error).not.toHaveBeenCalled();
  });
});
