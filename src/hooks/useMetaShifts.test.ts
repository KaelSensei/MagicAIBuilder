import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMetaShifts, SHIFT_WINDOW_DAYS } from "./useMetaShifts";

/**
 * The distinction this hook exists to preserve is between **no history yet**
 * and **an error**. A commander recorded fewer than two days answers 200 with
 * `report: null`, which is the ordinary state of a commander nobody has opened
 * twice — rendering that as a failure would tell the user something is broken
 * when nothing is.
 */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const REPORT = {
  baselineCapturedOn: "2026-07-25T00:00:00.000Z",
  currentCapturedOn: "2026-08-22T00:00:00.000Z",
  spanDays: 28,
  shifts: [
    { kind: "rose" as const, name: "Sol Ring", baseline: 0.7, current: 0.85, delta: 0.15 },
  ],
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useMetaShifts", () => {
  it("does not fetch without a commander", async () => {
    const { result } = renderHook(() => useMetaShifts(null));
    await act(async () => {
      await result.current.fetchShifts();
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("requests the slug and the window the panel asks for", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      jsonResponse({ report: null, snapshotCount: 0 })
    );
    const { result } = renderHook(() => useMetaShifts("Atraxa, Praetors' Voice"));

    await act(async () => {
      await result.current.fetchShifts();
    });

    // The apostrophe is stripped by commanderToSlug, not encoded — the slug is
    // built before the URL, so a punctuation change would show up here.
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `/api/meta/atraxa-praetors-voice/history?days=${SHIFT_WINDOW_DAYS}`
    );
  });

  it("exposes the report and the snapshot count", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      jsonResponse({ report: REPORT, snapshotCount: 2 })
    );
    const { result } = renderHook(() => useMetaShifts("Atraxa"));

    await act(async () => {
      await result.current.fetchShifts();
    });

    expect(result.current.report).toEqual(REPORT);
    expect(result.current.snapshotCount).toBe(2);
    expect(result.current.error).toBeNull();
  });

  // ─── No history is not an error ─────────────────────────────────────────────

  it("treats a null report as data, not as a failure", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      jsonResponse({ report: null, snapshotCount: 0 })
    );
    const { result } = renderHook(() => useMetaShifts("Atraxa"));

    await act(async () => {
      await result.current.fetchShifts();
    });

    expect(result.current.report).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.snapshotCount).toBe(0);
  });

  it("keeps the count that separates recorded-once from never-recorded", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      jsonResponse({ report: null, snapshotCount: 1 })
    );
    const { result } = renderHook(() => useMetaShifts("Atraxa"));

    await act(async () => {
      await result.current.fetchShifts();
    });

    expect(result.current.report).toBeNull();
    expect(result.current.snapshotCount).toBe(1);
  });

  // ─── Failures ───────────────────────────────────────────────────────────────

  it("reports the server's message on an error status", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      jsonResponse({ error: "Meta history read failed" }, 500)
    );
    const { result } = renderHook(() => useMetaShifts("Atraxa"));

    await act(async () => {
      await result.current.fetchShifts();
    });

    expect(result.current.error).toBe("Meta history read failed");
    expect(result.current.report).toBeNull();
  });

  it("treats an error field in a 200 body as a failure", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(jsonResponse({ error: "nope" }));
    const { result } = renderHook(() => useMetaShifts("Atraxa"));

    await act(async () => {
      await result.current.fetchShifts();
    });

    expect(result.current.error).toBe("nope");
  });

  it("reports a network failure rather than hanging on loading", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useMetaShifts("Atraxa"));

    await act(async () => {
      await result.current.fetchShifts();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("network down");
  });

  it("drops a stale report when a later fetch fails", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      jsonResponse({ report: REPORT, snapshotCount: 2 })
    );
    const { result } = renderHook(() => useMetaShifts("Atraxa"));
    await act(async () => {
      await result.current.fetchShifts();
    });
    expect(result.current.report).toEqual(REPORT);

    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error("network down"));
    await act(async () => {
      await result.current.fetchShifts();
    });

    // Showing last week's movements next to an error would misdate the data.
    expect(result.current.report).toBeNull();
    expect(result.current.error).toBe("network down");
  });

  it("clears everything on reset, for when the commander changes", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      jsonResponse({ report: REPORT, snapshotCount: 2 })
    );
    const { result } = renderHook(() => useMetaShifts("Atraxa"));
    await act(async () => {
      await result.current.fetchShifts();
    });

    act(() => result.current.reset());

    expect(result.current.report).toBeNull();
    expect(result.current.snapshotCount).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("clears a previous error when a new fetch starts", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new Error("network down"));
    const { result } = renderHook(() => useMetaShifts("Atraxa"));
    await act(async () => {
      await result.current.fetchShifts();
    });
    expect(result.current.error).toBe("network down");

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      jsonResponse({ report: REPORT, snapshotCount: 2 })
    );
    await act(async () => {
      await result.current.fetchShifts();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.report).toEqual(REPORT);
  });
});
