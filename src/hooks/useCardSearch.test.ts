import { describe, it, expect, vi, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { useCardSearch } from "./useCardSearch";
import * as scryfallClient from "@/lib/scryfall/client";
import { renderHookWithProviders } from "@/test/render";

vi.mock(import("@/lib/scryfall/client"));

afterEach(() => {
  vi.clearAllMocks();
});

describe("useCardSearch", () => {
  it("does not fetch when query is empty", () => {
    const { result } = renderHookWithProviders(() => useCardSearch(""));
    expect(result.current.fetchStatus).toBe("idle");
    expect(scryfallClient.searchCards).not.toHaveBeenCalled();
  });

  it("does not fetch when query is 1 char", () => {
    const { result } = renderHookWithProviders(() => useCardSearch("a"));
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("fetches when query has 2+ chars", async () => {
    const response = { data: [{ id: "1", name: "Lightning Bolt" }], has_more: false };
    vi.mocked(scryfallClient.searchCards).mockResolvedValueOnce(response as never);

    const { result } = renderHookWithProviders(() =>
      useCardSearch("lightning")
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(response);
    expect(scryfallClient.searchCards).toHaveBeenCalledWith("lightning");
  });

  it("is pending initially when query is valid", () => {
    vi.mocked(scryfallClient.searchCards).mockImplementation(
      () => new Promise(() => {})
    );
    const { result } = renderHookWithProviders(() => useCardSearch("bolt"));
    expect(result.current.isPending).toBe(true);
  });
});

describe("useCardSearch retry behavior", () => {
  it("does not retry on 404 error", async () => {
    vi.mocked(scryfallClient.searchCards).mockRejectedValue(
      new Error("404 Not Found")
    );

    const { result } = renderHookWithProviders(() =>
      useCardSearch("noresults")
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    // Only 1 call — no retries for 404
    expect(scryfallClient.searchCards).toHaveBeenCalledTimes(1);
  });
});
