import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkDeckLegality } from "@/lib/deck/check-deck-legality";
import type { LegalityDeckCard } from "@/lib/deck/legality";
import { __resetRateLimiter } from "@/lib/scryfall/client";

const COLLECTION_URL = "https://api.scryfall.com/cards/collection";

interface CollectionRequest {
  readonly identifiers: readonly { readonly id: string }[];
}

function isCollectionRequest(value: unknown): value is CollectionRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    "identifiers" in value &&
    Array.isArray(value.identifiers)
  );
}

/** Scryfall double: answers every collection lookup, Mana Crypt banned in Commander. */
const scryfallFetch = vi.fn(
  async (_url: string, init?: RequestInit): Promise<Response> => {
    const body: unknown = JSON.parse(
      typeof init?.body === "string" ? init.body : "{}"
    );
    const identifiers = isCollectionRequest(body) ? body.identifiers : [];
    const data = identifiers.map(({ id }) => ({
      id,
      name: id === "mana-crypt" ? "Mana Crypt" : `Card ${id}`,
      cmc: 0,
      type_line: "Artifact",
      color_identity: [],
      legalities: { commander: id === "mana-crypt" ? "banned" : "legal" },
    }));
    return new Response(
      JSON.stringify({ object: "list", not_found: [], data }),
      { status: 200 }
    );
  }
);

function deckRow(
  scryfallId: string,
  zone: LegalityDeckCard["zone"] = "main"
): LegalityDeckCard {
  return { scryfallId, name: `Card ${scryfallId}`, quantity: 1, zone };
}

function collectionRequests(): readonly CollectionRequest[] {
  return scryfallFetch.mock.calls
    .filter(([url]) => url === COLLECTION_URL)
    .map(([, init]) => {
      const body: unknown = JSON.parse(
        typeof init?.body === "string" ? init.body : "{}"
      );
      return isCollectionRequest(body) ? body : { identifiers: [] };
    });
}

describe("checkDeckLegality", () => {
  beforeEach(() => {
    __resetRateLimiter();
    scryfallFetch.mockClear();
    vi.stubGlobal("fetch", scryfallFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("reports an unknown format as unsupported instead of checking it as Commander", async () => {
    const verdict = await checkDeckLegality("duel", [deckRow("mana-crypt")]);

    expect(verdict).toEqual({ kind: "unsupported_format", format: "duel" });
    expect(scryfallFetch).not.toHaveBeenCalled();
  });

  it("fetches a 100-card deck from Scryfall in batches of 75, never one request per card", async () => {
    const mainDeck = Array.from({ length: 79 }, (_, index) =>
      deckRow(`card-${index}`)
    );
    const rows = [
      ...mainDeck,
      deckRow("mana-crypt"),
      deckRow("card-0"),
      deckRow("maybe-only", "maybeboard"),
    ];

    const verdict = await checkDeckLegality("commander", rows);

    const requests = collectionRequests();
    expect(scryfallFetch).toHaveBeenCalledTimes(2);
    expect(requests.map((request) => request.identifiers.length)).toEqual([
      75, 5,
    ]);
    const requestedIds = requests.flatMap((request) =>
      request.identifiers.map(({ id }) => id)
    );
    expect(requestedIds).not.toContain("maybe-only");
    expect(new Set(requestedIds).size).toBe(80);
    expect(verdict).toMatchObject({
      kind: "checked",
      legal: false,
      violations: [{ name: "Mana Crypt", reason: "banned" }],
    });
  });

  it("dates the verdict with the time the server fetched the card data", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-09T12:30:00.000Z"));

    const verdict = await checkDeckLegality("commander", [deckRow("card-1")]);

    expect(verdict).toMatchObject({
      source: {
        provider: "scryfall",
        legalityKey: "commander",
        fetchedAt: "2026-11-09T12:30:00.000Z",
      },
    });
  });
});
