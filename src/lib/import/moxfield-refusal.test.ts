import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMoxfieldUserDecks } from "./moxfield-user";
import { importFromUrl } from "./url-import";

/**
 * The page api2.moxfield.com served to the app's honest User-Agent on
 * 2026-11-09, trimmed: a 403 with Cloudflare's block page and no
 * `cf-mitigated` header.
 *
 * @returns a fresh response, since a body can be read only once
 */
function cloudflareBlockPage(): Response {
  return new Response("<!DOCTYPE html><title>Attention Required! | Cloudflare</title>", {
    status: 403,
    headers: { "content-type": "text/html; charset=UTF-8", server: "cloudflare" },
  });
}

describe("Moxfield refusing the app", () => {
  afterEach(() => vi.restoreAllMocks());

  it("reports a 403 on a deck as a Moxfield refusal", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(cloudflareBlockPage());

    await expect(importFromUrl("https://moxfield.com/decks/abc123")).rejects.toMatchObject({
      name: "MoxfieldRefusedError",
      status: 403,
    });
  });

  it("reports a 429 on a deck as a Moxfield refusal", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 429 }));

    await expect(importFromUrl("https://moxfield.com/decks/abc123")).rejects.toMatchObject({
      name: "MoxfieldRefusedError",
      status: 429,
    });
  });

  it("reports an HTML page served in place of the deck JSON as a Moxfield refusal", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("<!DOCTYPE html><title>Just a moment...</title>", {
        status: 200,
        headers: { "content-type": "text/html; charset=UTF-8" },
      })
    );

    await expect(importFromUrl("https://moxfield.com/decks/abc123")).rejects.toMatchObject({
      name: "MoxfieldRefusedError",
      status: 200,
    });
  });

  it("keeps a 503 a transient failure the player may retry", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(null, { status: 503 }));

    await expect(importFromUrl("https://moxfield.com/decks/abc123")).rejects.toMatchObject({
      name: "HttpStatusError",
      status: 503,
    });
  });

  it("reports a 403 on a profile's deck list as a Moxfield refusal", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(cloudflareBlockPage());

    await expect(fetchMoxfieldUserDecks("totoro")).rejects.toMatchObject({
      name: "MoxfieldRefusedError",
      status: 403,
    });
  });
});
