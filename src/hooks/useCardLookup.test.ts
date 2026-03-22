import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useCardLookup, useCardLookupByName } from "./useCardLookup";
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

describe("useCardLookup", () => {
  it("does not fetch when id is empty", () => {
    const { result } = renderHook(() => useCardLookup(""), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(scryfallClient.getCardById).not.toHaveBeenCalled();
  });

  it("fetches card by id", async () => {
    const card = { id: "abc-123", name: "Lightning Bolt" };
    vi.mocked(scryfallClient.getCardById).mockResolvedValueOnce(card as never);

    const { result } = renderHook(() => useCardLookup("abc-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(card);
    expect(scryfallClient.getCardById).toHaveBeenCalledWith("abc-123");
  });

  it("has isPending true initially when id provided", () => {
    vi.mocked(scryfallClient.getCardById).mockImplementation(
      () => new Promise(() => {})
    );
    const { result } = renderHook(() => useCardLookup("some-id"), {
      wrapper: createWrapper(),
    });
    expect(result.current.isPending).toBe(true);
  });
});

describe("useCardLookupByName", () => {
  it("does not fetch when name is shorter than 2 chars", () => {
    const { result } = renderHook(() => useCardLookupByName("A"), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(scryfallClient.getCardByName).not.toHaveBeenCalled();
  });

  it("does not fetch when name is empty", () => {
    const { result } = renderHook(() => useCardLookupByName(""), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("fetches card by name when name length >= 2", async () => {
    const card = { id: "xyz", name: "Sol Ring" };
    vi.mocked(scryfallClient.getCardByName).mockResolvedValueOnce(card as never);

    const { result } = renderHook(() => useCardLookupByName("Sol Ring"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(card);
  });
});
