import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMetaAnalysis } from "./useMetaAnalysis";

describe("useMetaAnalysis", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ cards: [] }), { status: 200 })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not fetch when commanderName is null", async () => {
    const { result } = renderHook(() => useMetaAnalysis(null));
    await act(async () => {
      await result.current.fetchSource("edhrec");
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("fetches edhrec and clears loading", async () => {
    const payload = { cards: [{ name: "Sol Ring", inclusion: 0.5 }], _meta: { cached: true } };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(payload), { status: 200 })
    );
    const { result } = renderHook(() => useMetaAnalysis("Atraxa"));
    await act(async () => {
      await result.current.fetchSource("edhrec");
    });
    await waitFor(() => {
      expect(result.current.isLoadingEdhrec).toBe(false);
    });
    expect(result.current.edhrec).toEqual(payload);
    expect(result.current.errorEdhrec).toBeNull();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/meta/")
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/source=edhrec(?!.*refresh)/)
    );
  });

  it("passes refresh=true when requested", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ decks: [] }), { status: 200 })
    );
    const { result } = renderHook(() => useMetaAnalysis("Kenrith"));
    await act(async () => {
      await result.current.fetchSource("tournament", true);
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("refresh=true")
    );
  });

  it("sets error when response not ok", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 502 })
    );
    const { result } = renderHook(() => useMetaAnalysis("X"));
    await act(async () => {
      await result.current.fetchSource("edhrec");
    });
    await waitFor(() => {
      expect(result.current.isLoadingEdhrec).toBe(false);
    });
    expect(result.current.errorEdhrec).toContain("502");
  });

  it("sets error from JSON error field", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Meta unavailable" }), { status: 200 })
    );
    const { result } = renderHook(() => useMetaAnalysis("Y"));
    await act(async () => {
      await result.current.fetchSource("tournament");
    });
    await waitFor(() => {
      expect(result.current.isLoadingTournament).toBe(false);
    });
    expect(result.current.errorTournament).toBe("Meta unavailable");
  });

  it("handles non-Error throw in catch", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce("boom");
    const { result } = renderHook(() => useMetaAnalysis("Z"));
    await act(async () => {
      await result.current.fetchSource("edhrec");
    });
    await waitFor(() => {
      expect(result.current.errorEdhrec).toBe("Failed to load meta");
    });
  });

  it("fetchAll triggers both sources", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ cards: [] }), { status: 200 })
    );
    const { result } = renderHook(() => useMetaAnalysis("Zur"));
    await act(async () => {
      result.current.fetchAll();
    });
    await waitFor(() => {
      expect(vi.mocked(globalThis.fetch).mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
