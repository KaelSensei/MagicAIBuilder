import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchMoxfieldUserDecks } from "./moxfield-user";
import { importFromUrl } from "./url-import";

/**
 * Moxfield is reached at the `fetch` boundary so the assertions cover the
 * headers that actually leave the server, after `httpGet` merges its defaults.
 */
function stubFetch(response: Response) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response);
}

/** @returns the headers of the first request the stub received */
function sentHeaders(spy: ReturnType<typeof stubFetch>): Headers {
  return new Headers(spy.mock.calls[0]?.[1]?.headers);
}

const DECK_JSON = JSON.stringify({
  name: "Honest deck",
  format: "commander",
  boards: { mainboard: { cards: { s: { quantity: 1, card: { name: "Sol Ring" } } } } },
});

describe("Moxfield access identifies MagicAIBuilder honestly", () => {
  afterEach(() => vi.restoreAllMocks());

  it("fetches a deck without posing as moxfield.com", async () => {
    const spy = stubFetch(new Response(DECK_JSON, { status: 200 }));

    await importFromUrl("https://moxfield.com/decks/abc123");

    const headers = sentHeaders(spy);
    expect(headers.get("Origin")).toBeNull();
    expect(headers.get("Referer")).toBeNull();
    expect(headers.get("User-Agent")).toMatch(/^MagicAIBuilder\//);
  });

  it("lists a profile's decks without posing as moxfield.com", async () => {
    const spy = stubFetch(new Response(JSON.stringify({ data: [], totalResults: 0 }), { status: 200 }));

    await fetchMoxfieldUserDecks("totoro");

    const headers = sentHeaders(spy);
    expect(headers.get("Origin")).toBeNull();
    expect(headers.get("Referer")).toBeNull();
    expect(headers.get("User-Agent")).toMatch(/^MagicAIBuilder\//);
  });
});
