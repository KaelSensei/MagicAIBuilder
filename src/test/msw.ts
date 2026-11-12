/**
 * MSW for one test file: replaces a provider's HTTP API with handlers that serve recorded
 * responses, and fails any test that sends a request none of them serves.
 *
 * Part of the shared test kit. It is for code that reaches a third party over `fetch`
 * (Commander Spellbook, Scryfall, EDHREC, the model providers); owned ports get in-memory fakes
 * instead (ADR 0005, rules 3 and 4). The policy lives in docs/engineering/tdd-with-ai.md,
 * "Network in tests".
 *
 * Not started globally on purpose: many test files still replace the global `fetch` with a
 * stub, and a server running under every file would intercept beneath those stubs. A file opts
 * in by calling `setupMsw`.
 *
 * @module test/msw
 */

import { afterAll, afterEach, beforeAll } from "vitest";
import type { AnyHandler } from "msw";
import { setupServer, type SetupServer } from "msw/node";

/**
 * Starts MSW for the calling test file and serves `handlers` to every test in it.
 *
 * Call it once per test file, at the top level of the file or of its outer `describe`: it
 * registers that block's `beforeAll`, `afterEach` and `afterAll` hooks. Works in the `node` and
 * `jsdom` test environments alike, since both run the test in Node.
 *
 * - Between tests, handlers added with `server.use` are dropped and `handlers` come back.
 * - A request no handler serves is errored before it reaches the network (MSW's `"error"`
 *   strategy), and the test that sent it fails with the method and URL. The failure comes from
 *   the `afterEach` hook, so it holds even when the code under test catches the network error,
 *   as provider clients that degrade gracefully do. A request sent from `beforeAll` or
 *   `afterAll` fails the file the same way.
 * - When the file ends, the server closes and interception stops, so no other test file sees MSW.
 *
 * The name says `setup`, not `use`: React's `rules-of-hooks` lint rule takes any `use…` call for a
 * React hook and rejects it outside a component, though this one registers Vitest hooks.
 *
 * @param handlers - the file's default handlers, usually built from a recorded `*-v1.ts` fixture
 * @returns the running server, for `server.use(...)` overrides that last one test
 */
export function setupMsw(...handlers: readonly AnyHandler[]): SetupServer {
  const server = setupServer(...handlers);
  const unserved: string[] = [];
  server.events.on("request:unhandled", ({ request }) => {
    unserved.push(`${request.method} ${request.url}`);
  });

  const failOnUnservedRequests = (): void => {
    const sent = unserved.splice(0);
    if (sent.length === 0) return;
    throw new Error(
      `setupMsw: no handler serves ${sent.join(", ")}. Add a handler that answers it, or find out why the code sent it.`
    );
  };

  beforeAll(() => {
    // MSW 3 renamed `onUnhandledRequest` to `onUnhandledFrame`:
    // https://github.com/mswjs/msw/releases/tag/v3.0.0 (read 2026-11-11).
    server.listen({ onUnhandledFrame: "error" });
  });
  afterEach(() => {
    server.resetHandlers();
    failOnUnservedRequests();
  });
  afterAll(() => {
    server.close();
    failOnUnservedRequests();
  });

  return server;
}

/**
 * Former name of {@link setupMsw}, kept only while branches written before the
 * rename land.
 *
 * @deprecated Use `setupMsw`. The react-hooks lint rule reads a `use` prefix as
 * a React hook, which this is not. Remove this alias once no test calls it.
 */
export const useMsw = setupMsw;
