import { afterEach, expect, it, vi } from "vitest";

const fetchPublicDeck = vi.hoisted(() => vi.fn());
vi.mock("@/lib/deck/public-deck", () => ({ fetchPublicDeck }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/lib/auth/config", () => ({ auth: async () => null }));
vi.mock("@/components/layout/Header", () => ({ Header: () => null }));
vi.mock("@/components/profile/PublicDeckView", () => ({ PublicDeckView: () => null }));

import PublicDeckPage, { generateMetadata } from "./page";

afterEach(() => fetchPublicDeck.mockReset());

it("does not label an unavailable public deck as missing in metadata", async () => {
  fetchPublicDeck.mockRejectedValue(new Error("PUBLIC_DECK_UNAVAILABLE"));

  const metadata = await generateMetadata({
    params: Promise.resolve({ locale: "en", id: "deck-1" }),
  });

  expect(metadata.title).toBe("Deck unavailable — MagicAIBuilder");
});

it("passes a temporary deck failure to the retryable route error boundary", async () => {
  fetchPublicDeck.mockRejectedValue(new Error("PUBLIC_DECK_UNAVAILABLE"));

  await expect(
    PublicDeckPage({ params: Promise.resolve({ locale: "en", id: "deck-1" }) })
  ).rejects.toThrow("PUBLIC_DECK_UNAVAILABLE");
});

it("keeps a missing deck as not found", async () => {
  fetchPublicDeck.mockResolvedValue(null);

  await expect(
    PublicDeckPage({ params: Promise.resolve({ locale: "en", id: "missing" }) })
  ).rejects.toThrow("NOT_FOUND");
});
