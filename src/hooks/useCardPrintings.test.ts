import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useCardPrintings } from "./useCardPrintings";
import * as scryfallClient from "@/lib/scryfall/client";

vi.mock("@/lib/scryfall/client");

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("useCardPrintings", () => {
  it("does not fetch when cardName is null", () => {
    const { result } = renderHook(() => useCardPrintings(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(scryfallClient.searchCardPrintings).not.toHaveBeenCalled();
  });

  it("fetches printings when cardName is provided", async () => {
    const printings = { data: [{ id: "p1", name: "Sol Ring" }] };
    vi.mocked(scryfallClient.searchCardPrintings).mockResolvedValueOnce(printings as never);

    const { result } = renderHook(() => useCardPrintings("Sol Ring"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(printings);
    expect(scryfallClient.searchCardPrintings).toHaveBeenCalledWith("Sol Ring");
  });

  it("has isPending true while loading", () => {
    vi.mocked(scryfallClient.searchCardPrintings).mockImplementation(
      () => new Promise(() => {})
    );
    const { result } = renderHook(() => useCardPrintings("Counterspell"), {
      wrapper: createWrapper(),
    });
    expect(result.current.isPending).toBe(true);
  });
});
