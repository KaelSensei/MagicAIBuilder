import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useBanlistQuery, useBanlistSet } from "./useBanlist";
import * as scryfallClient from "@/lib/scryfall/client";

vi.mock("@/lib/scryfall/client");

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  }
  return Wrapper;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("useBanlistQuery", () => {
  it("fetches banned cards", async () => {
    const bannedCards = [{ id: "1", name: "Emrakul, the Aeons Torn" }];
    vi.mocked(scryfallClient.searchCards).mockResolvedValueOnce({
      data: bannedCards,
      has_more: false,
    } as never);

    const { result } = renderHook(() => useBanlistQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(scryfallClient.searchCards).toHaveBeenCalledWith("banned:commander", 1);
  });

  it("fetches multiple pages when has_more is true", async () => {
    const page1 = { data: [{ id: "1", name: "Card1" }], has_more: true };
    const page2 = { data: [{ id: "2", name: "Card2" }], has_more: false };
    vi.mocked(scryfallClient.searchCards)
      .mockResolvedValueOnce(page1 as never)
      .mockResolvedValueOnce(page2 as never);

    const { result } = renderHook(() => useBanlistQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(scryfallClient.searchCards).toHaveBeenCalledTimes(2);
  });
});

describe("useBanlistSet", () => {
  it("returns empty set when not loaded", () => {
    vi.mocked(scryfallClient.searchCards).mockImplementation(
      () => new Promise(() => {})
    );
    const { result } = renderHook(() => useBanlistSet(), {
      wrapper: createWrapper(),
    });
    expect(result.current.bannedNames.size).toBe(0);
    expect(result.current.isLoaded).toBe(false);
  });

  it("returns set of banned card names when loaded", async () => {
    const bannedCards = [
      { id: "1", name: "Emrakul, the Aeons Torn" },
      { id: "2", name: "Primeval Titan" },
    ];
    vi.mocked(scryfallClient.searchCards).mockResolvedValueOnce({
      data: bannedCards,
      has_more: false,
    } as never);

    const { result } = renderHook(() => useBanlistSet(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.bannedNames.has("Emrakul, the Aeons Torn")).toBe(true);
    expect(result.current.isBanned("Primeval Titan")).toBe(true);
    expect(result.current.isBanned("Lightning Bolt")).toBe(false);
  });
});
