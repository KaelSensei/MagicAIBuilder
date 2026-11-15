// @vitest-environment node
/**
 * Pins `readNdjsonOnFakeClock`, the stream reader the AI route suites use to
 * see when each streamed event arrived: the fake time each event is stamped
 * with, the line split across chunks, and the raw body. The route suites rely
 * on these arrival times to check the pacing between events, so the reader is
 * pinned on its own, with a stream whose pacing the test controls.
 *
 * The node environment matches the route suites that call the reader.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { readNdjsonOnFakeClock } from "@/test/ai-route-msw";

const encoder = new TextEncoder();

/** @returns a promise that settles after `ms` of (fake) time */
function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A response streaming four events: one at once, two together after 250 ms,
 * and one 100 ms later whose line is split across two chunks.
 */
function pacedResponse(): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode('{"n":1}\n'));
      await pause(250);
      controller.enqueue(encoder.encode('{"n":2}\n{"n":3}\n'));
      await pause(100);
      controller.enqueue(encoder.encode('{"n":'));
      controller.enqueue(encoder.encode("4}\n"));
      controller.close();
    },
  });
  return new Response(stream);
}

describe("readNdjsonOnFakeClock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stamps each event with the fake time it arrived at, so the pauses between events show", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "Date"] });

    const { events } = await readNdjsonOnFakeClock(pacedResponse());

    expect(events).toEqual([
      { at: 0, event: { n: 1 } },
      { at: 250, event: { n: 2 } },
      { at: 250, event: { n: 3 } },
      { at: 350, event: { n: 4 } },
    ]);
  });

  it("returns the raw body as streamed, with a line split across chunks joined", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "Date"] });

    const { body } = await readNdjsonOnFakeClock(pacedResponse());

    expect(body).toBe('{"n":1}\n{"n":2}\n{"n":3}\n{"n":4}\n');
  });

  it("rejects a response with no body to stream", async () => {
    await expect(readNdjsonOnFakeClock(new Response(null))).rejects.toThrow(
      "The response has no body to stream."
    );
  });
});
