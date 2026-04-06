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
    vi.mocked(scryfallClient.fetchAllPages).mockResolvedValueOnce(
      bannedCards as never
    );

    const { result } = renderHook(() => useBanlistQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(scryfallClient.fetchAllPages).toHaveBeenCalledWith("banned:commander");
  });

  it("fetches multiple pages when has_more is true", async () => {
    const cards = [
      { id: "1", name: "Card1" },
      { id: "2", name: "Card2" },
    ];
    vi.mocked(scryfallClient.fetchAllPages).mockResolvedValueOnce(
      cards as never
    );

    const { result } = renderHook(() => useBanlistQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(scryfallClient.fetchAllPages).toHaveBeenCalledTimes(1);
  });
});

describe("useBanlistSet", () => {
  it("returns empty set when not loaded", () => {
    vi.mocked(scryfallClient.fetchAllPages).mockImplementation(
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
    vi.mocked(scryfallClient.fetchAllPages).mockResolvedValueOnce(
      bannedCards as never
    );

    const { result } = renderHook(() => useBanlistSet(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.bannedNames.has("Emrakul, the Aeons Torn")).toBe(true);
    expect(result.current.isBanned("Primeval Titan")).toBe(true);
    expect(result.current.isBanned("Lightning Bolt")).toBe(false);
  });
});
