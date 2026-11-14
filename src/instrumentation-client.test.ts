import { describe, expect, it, vi } from "vitest";
import type * as SentryNext from "@sentry/nextjs";

const init = vi.fn<typeof SentryNext.init>();
const replayIntegration = vi.fn<typeof SentryNext.replayIntegration>();

// Sentry's browser SDK is an external boundary: the test reads what the client
// entry point hands to it instead of starting a real SDK in jsdom.
vi.mock(import("@sentry/nextjs"), () => ({
  init: (...args) => init(...args),
  replayIntegration: (...args) => replayIntegration(...args),
  captureRouterTransitionStart: () => undefined,
}));

/** Loads the client entry point afresh, as each page load does. */
async function loadClientInstrumentation(): Promise<void> {
  vi.resetModules();
  init.mockClear();
  replayIntegration.mockClear();
  await import("./instrumentation-client");
}

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
