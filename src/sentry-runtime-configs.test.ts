import { describe, expect, it, vi } from "vitest";
import type * as SentryNext from "@sentry/nextjs";

const init = vi.fn<typeof SentryNext.init>();

// Sentry's server and edge SDKs are an external boundary: the test reads the
// options each runtime configuration hands to `Sentry.init`.
vi.mock(import("@sentry/nextjs"), () => ({
  init: (...args) => init(...args),
}));

/** Loads a runtime configuration afresh, as the server does at start. */
async function loadRuntimeConfig(load: () => Promise<unknown>): Promise<void> {
  vi.resetModules();
  init.mockClear();
  await load();
}

const runtimes = [
  ["server", () => import("../sentry.server.config")],
  ["edge", () => import("../sentry.edge.config")],
] as const;

describe.each(runtimes)("the %s Sentry configuration", (_runtime, load) => {
  it("sends an error on a share page without its token or query string", async () => {
    await loadRuntimeConfig(load);
    const options = init.mock.calls[0]?.[0];

    const sent = await options?.beforeSend?.(
      {
        type: undefined,
        request: { url: "https://magicaibuilder.app/fr/share/abc123?x=1" },
      },
      {}
    );

    expect(sent?.request?.url).toBe(
      "https://magicaibuilder.app/fr/share/[token]"
    );
  });

  it("sends a transaction on a profile page without the username", async () => {
    await loadRuntimeConfig(load);
    const options = init.mock.calls[0]?.[0];

    const sent = await options?.beforeSendTransaction?.(
      { type: "transaction", transaction: "GET /u/kael" },
      {}
    );

    expect(sent?.transaction).toBe("GET /u/[username]");
  });

  it("records a request breadcrumb without the username", async () => {
    await loadRuntimeConfig(load);
    const options = init.mock.calls[0]?.[0];

    const breadcrumb = options?.beforeBreadcrumb?.({
      category: "http",
      data: { url: "/api/users/kael?x=1" },
    });

    expect(breadcrumb?.data).toEqual({ url: "/api/users/[username]" });
  });
});
