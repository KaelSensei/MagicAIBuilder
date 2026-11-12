import { describe, it, expect, vi, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/render";
import { usePlaytestHistory } from "./usePlaytestHistory";

function renderHistory(deckId: string | null) {
  return renderHookWithProviders(() => usePlaytestHistory(deckId));
}

describe("usePlaytestHistory", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the history when the route succeeds", async () => {
    const history = { sessions: [], summary: { total: 0 } };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(history),
      })
    );

    const { result } = renderHistory("deck-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(history);
    expect(result.current.isError).toBe(false);
  });

  it("treats a 404 as an empty history rather than an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve({}) })
    );

    const { result } = renderHistory("deck-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it("surfaces a 500 instead of turning it into an empty history", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) })
    );

    const { result } = renderHistory("deck-1");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("does not fetch when deckId is null", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHistory(null);

    expect(result.current.fetchStatus).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
