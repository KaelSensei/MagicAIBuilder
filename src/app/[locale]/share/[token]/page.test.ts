import { afterEach, expect, it, vi } from "vitest";

const fetchSharedDeck = vi.hoisted(() => vi.fn());

vi.stubGlobal("fetch", fetchSharedDeck);
vi.mock("@/components/deck/ShareDeckView", () => ({ ShareDeckView: () => null }));

import { generateMetadata } from "./page";

afterEach(() => fetchSharedDeck.mockReset());

it("tells crawlers not to retain or index a valid share link", async () => {
  fetchSharedDeck.mockResolvedValue(
    new Response(
      JSON.stringify({
        name: "Private Link Deck",
        cards: [],
        targetBracket: 2,
        format: "commander",
      }),
      { status: 200 }
    )
  );

  const metadata = await generateMetadata({
    params: Promise.resolve({ token: "private-token" }),
  });

  expect(metadata.robots).toEqual({
    index: false,
    follow: false,
    noarchive: true,
  });
});
