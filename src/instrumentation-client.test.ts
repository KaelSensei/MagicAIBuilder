import { describe, expect, it, vi } from "vitest";
import type * as SentryNext from "@sentry/nextjs";

const init = vi.fn<typeof SentryNext.init>();
const replayIntegration = vi.fn<typeof SentryNext.replayIntegration>();
const addEventProcessor = vi.fn<typeof SentryNext.addEventProcessor>();

// Sentry's browser SDK is an external boundary: the test reads what the client
// entry point hands to it instead of starting a real SDK in jsdom.
vi.mock(import("@sentry/nextjs"), () => ({
  init: (...args) => init(...args),
  replayIntegration: (...args) => replayIntegration(...args),
  addEventProcessor: (...args) => addEventProcessor(...args),
  captureRouterTransitionStart: () => undefined,
}));

/** Loads the client entry point afresh, as each page load does. */
async function loadClientInstrumentation(): Promise<void> {
  vi.resetModules();
  init.mockClear();
  replayIntegration.mockClear();
  addEventProcessor.mockClear();
  await import("./instrumentation-client");
}

const SHARE_URL = "https://magicaibuilder.app/share/abc123?x=1";
const SCRUBBED_SHARE_URL = "https://magicaibuilder.app/share/[token]";

describe("client URL scrubbing", () => {
  it("an error on a share page reaches Sentry without its token or query string", async () => {
    await loadClientInstrumentation();
    const options = init.mock.calls[0]?.[0];

    const sent = await options?.beforeSend?.(
      { type: undefined, request: { url: SHARE_URL } },
      {}
    );

    expect(sent?.request?.url).toBe(SCRUBBED_SHARE_URL);
  });

  it("a navigation recorded in an error replay loses the token", async () => {
    await loadClientInstrumentation();
    const options = replayIntegration.mock.calls[0]?.[0];

    const recorded = options?.beforeAddRecordingEvent?.({
      type: 5,
      timestamp: 0,
      data: {
        tag: "performanceSpan",
        payload: {
          op: "navigation.push",
          description: SHARE_URL,
          startTimestamp: 0,
          endTimestamp: 0,
        },
      },
    });

    expect(recorded?.data.payload).toMatchObject({
      description: SCRUBBED_SHARE_URL,
    });
  });

  it("the page list of an error replay loses the token", async () => {
    await loadClientInstrumentation();
    const processor = addEventProcessor.mock.calls[0]?.[0];
    const replayEvent: SentryNext.Event = { type: "replay_event" };
    const replay = { ...replayEvent, urls: [SHARE_URL] };

    const sent = await processor?.(replay, {});

    expect(sent).toMatchObject({ urls: [SCRUBBED_SHARE_URL] });
  });
});

describe("client Session Replay", () => {
  it("never records a visitor's session at random", async () => {
    await loadClientInstrumentation();

    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({ replaysSessionSampleRate: 0 })
    );
  });

  it("still replays every session in which an error occurs", async () => {
    await loadClientInstrumentation();

    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({ replaysOnErrorSampleRate: 1 })
    );
  });

  it("masks all page text in an error replay, explicitly", async () => {
    await loadClientInstrumentation();

    expect(replayIntegration).toHaveBeenCalledWith(
      expect.objectContaining({ maskAllText: true })
    );
  });

  it("masks what the player types in an error replay, explicitly", async () => {
    await loadClientInstrumentation();

    expect(replayIntegration).toHaveBeenCalledWith(
      expect.objectContaining({ maskAllInputs: true })
    );
  });

  it("blocks images and other media in an error replay, explicitly", async () => {
    await loadClientInstrumentation();

    expect(replayIntegration).toHaveBeenCalledWith(
      expect.objectContaining({ blockAllMedia: true })
    );
  });
});
