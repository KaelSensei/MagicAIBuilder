import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useTypewriter } from "./useTypewriter";

/**
 * The rotating prompt on the landing page.
 *
 * Small, but it owns a `setInterval` that outlives a render, and an interval
 * that is not cleared keeps calling `setState` on an unmounted component for as
 * long as the tab is open. That is the property worth pinning, and it is
 * invisible from the page — the text rotates either way.
 */
describe("useTypewriter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts on the first prompt", () => {
    const { result } = renderHook(() => useTypewriter());
    expect(result.current).toContain("discard engines");
  });

  it("advances on each interval and wraps back to the first", () => {
    const { result } = renderHook(() => useTypewriter(1000));
    const seen = [result.current];

    for (let tick = 0; tick < 4; tick++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      seen.push(result.current);
    }

    // Four distinct prompts, then the fifth reading is the first again.
    expect(new Set(seen.slice(0, 4)).size).toBe(4);
    expect(seen[4]).toBe(seen[0]);
  });

  it("does not advance before the interval elapses", () => {
    const { result } = renderHook(() => useTypewriter(3500));
    const first = result.current;

    act(() => {
      vi.advanceTimersByTime(3499);
    });

    expect(result.current).toBe(first);
  });

  it("restarts the timer when the interval changes", () => {
    const { result, rerender } = renderHook(({ ms }) => useTypewriter(ms), {
      initialProps: { ms: 1000 },
    });
    const first = result.current;

    rerender({ ms: 5000 });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // The old 1000ms timer was cleared, so this tick belongs to nothing.
    expect(result.current).toBe(first);

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current).not.toBe(first);
  });

  it("clears the interval on unmount", () => {
    const clearInterval = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = renderHook(() => useTypewriter());

    unmount();

    expect(clearInterval).toHaveBeenCalled();
    clearInterval.mockRestore();
  });
});
