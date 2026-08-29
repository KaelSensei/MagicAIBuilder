import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCardRulings } from "./rulings";

const SCRYFALL_RESPONSE = {
  object: "list",
  data: [
    {
      object: "ruling",
      oracle_id: "oracle-1",
      source: "wotc",
      published_at: "2024-01-12",
      comment: "This is the current ruling.",
    },
  ],
};

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("getCardRulings", () => {
  it("returns previously viewed rulings when the network is unavailable", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(SCRYFALL_RESPONSE), { status: 200 })
      )
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock);

    const onlineResult = await getCardRulings("card-1");
    const offlineResult = await getCardRulings("card-1");

    expect(onlineResult.source).toBe("network");
    expect(offlineResult).toEqual({
      source: "cache",
      rulings: onlineResult.rulings,
    });
  });
});
