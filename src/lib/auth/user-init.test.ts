import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchUserInit } from "./user-init";

describe("fetchUserInit", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ onboardingDone: true, collection: [] }), {
            status: 200,
          })
        )
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shares the pending request for the same user", async () => {
    const first = fetchUserInit("user-1");
    const second = fetchUserInit("user-1");

    await expect(Promise.all([first, second])).resolves.toEqual([
      { onboardingDone: true, collection: [] },
      { onboardingDone: true, collection: [] },
    ]);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not share requests between users", async () => {
    await Promise.all([fetchUserInit("user-2"), fetchUserInit("user-3")]);

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("rejects an invalid response instead of leaving consumers loading", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ collection: [] }), { status: 200 })
    );

    await expect(fetchUserInit("user-invalid")).rejects.toThrow(
      "invalid payload"
    );
  });

  it("rejects non-success responses", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(null, { status: 503 })
    );

    await expect(fetchUserInit("user-error")).rejects.toThrow("HTTP 503");
  });

  it("aborts a request that exceeds the loading budget", async () => {
    vi.useFakeTimers();
    vi.mocked(globalThis.fetch).mockImplementationOnce((_url, options) => {
      return new Promise<Response>((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    });

    const request = fetchUserInit("user-timeout");
    const rejected = expect(request).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(8_000);

    await rejected;
    vi.useRealTimers();
  });
});
