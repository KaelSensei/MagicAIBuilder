import { describe, it, expect, vi, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { useCardPrintings } from "./useCardPrintings";
import * as scryfallClient from "@/lib/scryfall/client";
import { renderHookWithProviders } from "@/test/render";

vi.mock(import("@/lib/scryfall/client"));

afterEach(() => {
  vi.clearAllMocks();
});

describe("useCardPrintings", () => {
  it("does not fetch when cardName is null", () => {
    const { result } = renderHookWithProviders(() => useCardPrintings(null));
    expect(result.current.fetchStatus).toBe("idle");
    expect(scryfallClient.searchCardPrintings).not.toHaveBeenCalled();
  });

  it("fetches printings when cardName is provided", async () => {
    const printings = { data: [{ id: "p1", name: "Sol Ring" }] };
    vi.mocked(scryfallClient.searchCardPrintings).mockResolvedValueOnce(printings as never);

    const { result } = renderHookWithProviders(() => useCardPrintings("Sol Ring"));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(printings);
    expect(scryfallClient.searchCardPrintings).toHaveBeenCalledWith("Sol Ring");
  });

  it("has isPending true while loading", () => {
    vi.mocked(scryfallClient.searchCardPrintings).mockImplementation(
      () => new Promise(() => {})
    );
    const { result } = renderHookWithProviders(() => useCardPrintings("Counterspell"));
    expect(result.current.isPending).toBe(true);
  });
});
