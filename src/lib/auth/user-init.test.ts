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
    vi.useRealTimers();
  });

  it("keeps the loading budget active while reading the response body", async () => {
    vi.useFakeTimers();
    vi.mocked(globalThis.fetch).mockImplementationOnce((_url, options) => {
      const body = new ReadableStream({
        start(controller) {
          options?.signal?.addEventListener("abort", () => {
            controller.error(new Error("aborted"));
          });
          setTimeout(() => {
            if (options?.signal?.aborted) return;
            controller.enqueue(new TextEncoder().encode(
              JSON.stringify({ onboardingDone: true, collection: [] }),
            ));
            controller.close();
          }, 9_000);
        },
      });
      return Promise.resolve(new Response(body, { status: 200 }));
    });

    const outcome = fetchUserInit("user-body-timeout").catch((error: unknown) => error);
    try {
      await vi.advanceTimersByTimeAsync(8_000);
      expect(vi.mocked(globalThis.fetch).mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
      expect(await outcome).toEqual(new Error("aborted"));
    } finally {
      await vi.advanceTimersByTimeAsync(1_000);
      await outcome;
    }
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
