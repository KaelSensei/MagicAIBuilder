/**
 * The idempotency key a guest-deck claim sends. The server stores it on the
 * saved deck, so a retry sent after a release must send the same key.
 *
 * The claim goes through the real deck API client; only `fetch`, the HTTP
 * boundary, is replaced. It answers 503, so the claim fails before it would
 * forget the browser copy.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { claimGuestDeck } from "./guest-claim";
import type { Deck } from "./types";

/** A guest deck whose name holds a character outside the BMP. */
const DRAGONS: Deck = {
  id: "guest",
  name: "Dragons 🐉",
  commander: null,
  partner: null,
  companion: null,
  pairingType: "none",
  cards: [],
  maybeboard: [],
  format: "commander",
  cardCount: 0,
  targetBracket: 3,
  manualBracket: null,
  budget: null,
  description: "",
  tags: [],
  shareToken: null,
  shareEnabled: false,
  isPublic: false,
  isAIGenerated: false,
  createdAt: new Date("2026-11-01T00:00:00.000Z"),
  updatedAt: new Date("2026-11-01T00:00:00.000Z"),
};

/**
 * Claims `deck` once and reads the key its request carried.
 *
 * @param deck - the guest deck to claim
 * @returns the `Idempotency-Key` header of the claim request, or null
 */
async function keySentToClaim(deck: Deck): Promise<string | null> {
  const fetchStub = vi.fn<typeof fetch>(
    async () => new Response(null, { status: 503 })
  );
  vi.stubGlobal("fetch", fetchStub);

  await claimGuestDeck(deck);

  const [, init] = fetchStub.mock.calls[0] ?? [];
  return new Headers(init?.headers).get("Idempotency-Key");
}

describe("claimGuestDeck — idempotency key", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the same key for a deck named with an emoji from release to release (pinned)", async () => {
    expect(await keySentToClaim(DRAGONS)).toBe("guest-claim-0anmy1qga1r");
  });

  it("sends another key once the deck changes", async () => {
    const renamed = { ...DRAGONS, name: "Dragons 🐲" };

    expect(await keySentToClaim(renamed)).not.toBe(
      await keySentToClaim(DRAGONS)
    );
  });
});
