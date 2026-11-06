import { describe, expect, it, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { SESSION_LOAD_TIMEOUT_MS, useBoundedSession } from "./useBoundedSession";

const update = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ status: "loading" }));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: session.status, data: null, update }),
}));

describe("useBoundedSession", () => {
  afterEach(() => {
    vi.useRealTimers();
    session.status = "loading";
    update.mockClear();
  });

  it("stops a session request that never resolves", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useBoundedSession());

    expect(result.current.timedOut).toBe(false);
    act(() => {
      vi.advanceTimersByTime(SESSION_LOAD_TIMEOUT_MS);
    });

    expect(result.current.timedOut).toBe(true);
  });

  it("retries the session after a timeout", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useBoundedSession());
    act(() => {
      vi.advanceTimersByTime(SESSION_LOAD_TIMEOUT_MS);
    });

    act(() => {
      result.current.retry();
    });

    expect(update).toHaveBeenCalledOnce();
    expect(result.current.timedOut).toBe(false);
  });
});
