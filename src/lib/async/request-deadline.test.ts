import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REQUEST_DEADLINE_MS, withRequestDeadline } from "./request-deadline";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** A request that settles only when its signal aborts, as a stalled fetch does. */
function stalledRequest(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason));
  });
}

describe("withRequestDeadline", () => {
  it("gives a request 15 seconds by default", () => {
    expect(REQUEST_DEADLINE_MS).toBe(15_000);
  });

  it("aborts a request that has not settled when the deadline passes", async () => {
    let seen: AbortSignal | undefined;
    const result = withRequestDeadline((signal) => {
      seen = signal;
      return stalledRequest(signal);
    });
    const settled = expect(result).rejects.toThrow();

    await vi.advanceTimersByTimeAsync(REQUEST_DEADLINE_MS - 1);
    expect(seen?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    expect(seen?.aborted).toBe(true);
    await settled;
  });

  it("honours a shorter deadline when one is given", async () => {
    const result = withRequestDeadline(stalledRequest, 50);
    const settled = expect(result).rejects.toThrow();

    await vi.advanceTimersByTimeAsync(50);

    await settled;
  });

  it("returns the answer of a request that settles in time and leaves no timer behind", async () => {
    const answer = await withRequestDeadline(async () => "answered");

    expect(answer).toBe("answered");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("passes on the request's own failure and leaves no timer behind", async () => {
    await expect(
      withRequestDeadline(async () => {
        throw new Error("refused");
      })
    ).rejects.toThrow("refused");
    expect(vi.getTimerCount()).toBe(0);
  });
});
