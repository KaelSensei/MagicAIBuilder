// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const loadPublicDeckImage = vi.hoisted(() => vi.fn());
vi.mock("@/lib/deck/social-image", () => ({ loadPublicDeckImage }));
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const deck = (await import("@/messages/en/deck.json")).default;
  return {
    getTranslations: async ({
      namespace,
    }: {
      locale: string;
      namespace: "deck.socialImage";
    }) => createTranslator({ locale: "en", messages: { deck }, namespace }),
  };
});

import { GET } from "./route";

const DECK = {
  name: "Tymna Kraum Turbo",
  commanders: ["Tymna the Weaver", "Kraum, Ludevic's Opus"],
  colorIdentity: ["W", "U", "B", "R"],
  cardCount: 100,
  author: "Kael",
};

/** The eight bytes every PNG file starts with. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

async function fetchImage(url: string, id = "deck-1") {
  const response = await GET(new Request(url), {
    params: Promise.resolve({ id }),
  });
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { response, bytes };
}

beforeEach(() => {
  loadPublicDeckImage.mockReset();
});

describe("GET /og/deck/[id]", () => {
  it("renders a public deck as a PNG that expires within a minute", async () => {
    loadPublicDeckImage.mockResolvedValue(DECK);

    const { response, bytes } = await fetchImage(
      "https://example.test/og/deck/deck-1"
    );

    expect(loadPublicDeckImage).toHaveBeenCalledWith("deck-1");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=60, s-maxage=60"
    );
    expect([...bytes.slice(0, 8)]).toEqual(PNG_SIGNATURE);
  });

  it("ignores the query string", async () => {
    loadPublicDeckImage.mockResolvedValue(DECK);

    const plain = await fetchImage("https://example.test/og/deck/deck-1");
    const spoofed = await fetchImage(
      "https://example.test/og/deck/deck-1?title=Free%20cards&commander=Scam&colors=WUBRG"
    );

    expect(spoofed.bytes).toEqual(plain.bytes);
  });

  it("serves the same generic image for a private deck and a missing one", async () => {
    loadPublicDeckImage.mockResolvedValue(DECK);
    const publicDeck = await fetchImage("https://example.test/og/deck/deck-1");
    loadPublicDeckImage.mockResolvedValue(null);

    const privateDeck = await fetchImage(
      "https://example.test/og/deck/private",
      "private"
    );
    const missingDeck = await fetchImage(
      "https://example.test/og/deck/missing",
      "missing"
    );

    expect(privateDeck.response.status).toBe(200);
    expect([...privateDeck.bytes.slice(0, 8)]).toEqual(PNG_SIGNATURE);
    expect(privateDeck.bytes).toEqual(missingDeck.bytes);
    expect(privateDeck.bytes).not.toEqual(publicDeck.bytes);
  });
});
