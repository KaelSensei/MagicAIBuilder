import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchInBatches } from "./batch-fetch";
import * as scryfallClient from "@/lib/scryfall/client";
import type { ScryfallCard } from "@/lib/scryfall/types";

vi.mock("@/lib/scryfall/client");

function makeCard(name: string): ScryfallCard {
  return { id: name, name } as unknown as ScryfallCard;
}

describe("fetchInBatches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array for empty input", async () => {
    const result = await fetchInBatches([]);
    expect(result).toEqual([]);
    expect(scryfallClient.getCardCollection).not.toHaveBeenCalled();
  });

  it("fetches a single batch when under 75 cards", async () => {
    const names = Array.from({ length: 10 }, (_, i) => ({ name: `Card${i}` }));
    const cards = names.map((n) => makeCard(n.name));

    vi.mocked(scryfallClient.getCardCollection).mockResolvedValueOnce({
      data: cards,
      object: "list",
      not_found: [],
    });

    const result = await fetchInBatches(names);
    expect(scryfallClient.getCardCollection).toHaveBeenCalledTimes(1);
    expect(scryfallClient.getCardCollection).toHaveBeenCalledWith(names);
    expect(result).toHaveLength(10);
  });

  it("splits into multiple batches when over 75 cards", async () => {
    const names = Array.from({ length: 100 }, (_, i) => ({ name: `Card${i}` }));
    const batch1 = names.slice(0, 75).map((n) => makeCard(n.name));
    const batch2 = names.slice(75).map((n) => makeCard(n.name));

    vi.mocked(scryfallClient.getCardCollection)
      .mockResolvedValueOnce({ data: batch1, object: "list", not_found: [] })
      .mockResolvedValueOnce({ data: batch2, object: "list", not_found: [] });

    const result = await fetchInBatches(names);
    expect(scryfallClient.getCardCollection).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(100);
  });

  it("sends exactly 75 cards in the first batch", async () => {
    const names = Array.from({ length: 80 }, (_, i) => ({ name: `Card${i}` }));
    const batch1 = names.slice(0, 75).map((n) => makeCard(n.name));
    const batch2 = names.slice(75).map((n) => makeCard(n.name));

    vi.mocked(scryfallClient.getCardCollection)
      .mockResolvedValueOnce({ data: batch1, object: "list", not_found: [] })
      .mockResolvedValueOnce({ data: batch2, object: "list", not_found: [] });

    await fetchInBatches(names);
    const firstCallArg = vi.mocked(scryfallClient.getCardCollection).mock.calls[0][0];
    expect(firstCallArg).toHaveLength(75);
  });

  it("concatenates results from all batches in order", async () => {
    const names = Array.from({ length: 76 }, (_, i) => ({ name: `Card${i}` }));
    const batch1 = names.slice(0, 75).map((n) => makeCard(n.name));
    const batch2 = names.slice(75).map((n) => makeCard(n.name));

    vi.mocked(scryfallClient.getCardCollection)
      .mockResolvedValueOnce({ data: batch1, object: "list", not_found: [] })
      .mockResolvedValueOnce({ data: batch2, object: "list", not_found: [] });

    const result = await fetchInBatches(names);
    expect(result[0].name).toBe("Card0");
    expect(result[75].name).toBe("Card75");
  });

  it("handles exactly 75 cards in a single batch", async () => {
    const names = Array.from({ length: 75 }, (_, i) => ({ name: `Card${i}` }));
    const cards = names.map((n) => makeCard(n.name));

    vi.mocked(scryfallClient.getCardCollection).mockResolvedValueOnce({
      data: cards,
      object: "list",
      not_found: [],
    });

    const result = await fetchInBatches(names);
    expect(scryfallClient.getCardCollection).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(75);
  });
});
