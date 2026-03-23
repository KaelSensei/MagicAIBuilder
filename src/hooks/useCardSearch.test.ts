import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useCardSearch, useCardAutocomplete, useCardSearchInfinite } from "./useCardSearch";
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

describe("useCardSearch", () => {
  it("does not fetch when query is empty", () => {
    const { result } = renderHook(() => useCardSearch(""), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(scryfallClient.searchCards).not.toHaveBeenCalled();
  });

  it("does not fetch when query is 1 char", () => {
    const { result } = renderHook(() => useCardSearch("a"), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("fetches when query has 2+ chars", async () => {
    const response = { data: [{ id: "1", name: "Lightning Bolt" }], has_more: false };
    vi.mocked(scryfallClient.searchCards).mockResolvedValueOnce(response as never);

    const { result } = renderHook(() => useCardSearch("lightning"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(scryfallClient.searchCards).toHaveBeenCalledWith("lightning");
  });

  it("is pending initially when query is valid", () => {
    vi.mocked(scryfallClient.searchCards).mockImplementation(
      () => new Promise(() => {})
    );
    const { result } = renderHook(() => useCardSearch("bolt"), {
      wrapper: createWrapper(),
    });
    expect(result.current.isPending).toBe(true);
  });
});

describe("useCardSearch retry behavior", () => {
  it("does not retry on 404 error", async () => {
    vi.mocked(scryfallClient.searchCards).mockRejectedValue(
      new Error("404 Not Found")
    );

    const { result } = renderHook(() => useCardSearch("noresults"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // Only 1 call — no retries for 404
    expect(scryfallClient.searchCards).toHaveBeenCalledTimes(1);
  });
});

describe("useCardSearchInfinite", () => {
  it("does not fetch when query is empty", () => {
    const { result } = renderHook(() => useCardSearchInfinite(""), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(scryfallClient.searchCards).not.toHaveBeenCalled();
  });

  it("does not fetch when query is 1 char", () => {
    const { result } = renderHook(() => useCardSearchInfinite("a"), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("fetches first page when query has 2+ chars", async () => {
    const page1 = { data: [{ id: "1", name: "Lightning Bolt" }], has_more: false };
    vi.mocked(scryfallClient.searchCards).mockResolvedValueOnce(page1 as never);

    const { result } = renderHook(() => useCardSearchInfinite("lightning"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages).toHaveLength(1);
    expect(scryfallClient.searchCards).toHaveBeenCalledWith("lightning", 1);
  });

  it("getNextPageParam returns undefined when has_more is false", async () => {
    const page = { data: [], has_more: false };
    vi.mocked(scryfallClient.searchCards).mockResolvedValueOnce(page as never);

    const { result } = renderHook(() => useCardSearchInfinite("bolt"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });

  it("getNextPageParam extracts page number from next_page URL", async () => {
    const page = {
      data: [{ id: "1", name: "Bolt" }],
      has_more: true,
      next_page: "https://api.scryfall.com/cards/search?q=bolt&page=2",
    };
    vi.mocked(scryfallClient.searchCards).mockResolvedValueOnce(page as never);

    const { result } = renderHook(() => useCardSearchInfinite("bolt"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
  });
});

describe("useCardAutocomplete", () => {
  it("does not fetch when partial is too short", () => {
    const { result } = renderHook(() => useCardAutocomplete("a"), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(scryfallClient.autocompleteCardName).not.toHaveBeenCalled();
  });

  it("fetches when partial has 2+ chars", async () => {
    const suggestions = { data: ["Lightning Bolt", "Lightning Strike"] };
    vi.mocked(scryfallClient.autocompleteCardName).mockResolvedValueOnce(suggestions as never);

    const { result } = renderHook(() => useCardAutocomplete("lightning"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(scryfallClient.autocompleteCardName).toHaveBeenCalledWith("lightning");
  });
});
