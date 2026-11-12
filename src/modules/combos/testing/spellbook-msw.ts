/**
 * MSW handlers that stand in for Commander Spellbook's `find-my-combos`
 * endpoint in tests of the combos context (ADR 0005: HTTP is replaced with
 * MSW, never with a `fetch` stub).
 *
 * Used by the adapter's replay test and by its run of the `ComboSource`
 * contract. Each handler answers every request until the test file's MSW
 * server resets, except `spellbookNeverAnswers`, which takes one request.
 *
 * @module combos/testing/spellbook-msw
 */
import { delay, http, HttpResponse, type JsonBodyType } from "msw";
import { vi } from "vitest";
import { SPELLBOOK_FIND_MY_COMBOS_URL } from "@/modules/combos/infrastructure/find-my-combos";

/** How a handler answers, and what it does with each request it sees. */
export interface SpellbookAnswerOptions {
  /** HTTP status of the answer; 200 unless given. */
  readonly status?: number;
  /** Called with a copy of every request the handler serves, in order. */
  readonly onRequest?: (request: Request) => void;
}

/**
 * Spellbook answering every `find-my-combos` request with `body` as JSON.
 *
 * @param body - the JSON body, usually the recorded fixture or a variation of it
 */
export function spellbookAnswers(
  body: JsonBodyType,
  { status = 200, onRequest }: SpellbookAnswerOptions = {}
) {
  return http.post(SPELLBOOK_FIND_MY_COMBOS_URL, ({ request }) => {
    onRequest?.(request.clone());
    return HttpResponse.json(body, { status });
  });
}

/**
 * Spellbook taking one request and never answering it.
 *
 * The adapter's own 10-second `AbortSignal.timeout` is swapped, once, for a
 * signal this handler fires when the request arrives, so the test goes
 * through fetch's real abort path without waiting. MSW 3 no longer patches
 * timers (tdd-with-ai.md, "Network in tests"). The swap is a `vi.spyOn`: the
 * calling test file must run `vi.restoreAllMocks()` after each test.
 *
 * @param onRequest - called with a copy of the request this handler swallows
 */
export function spellbookNeverAnswers(onRequest?: (request: Request) => void) {
  const adapterTimeout = new AbortController();
  vi.spyOn(AbortSignal, "timeout").mockReturnValueOnce(adapterTimeout.signal);
  return http.post(
    SPELLBOOK_FIND_MY_COMBOS_URL,
    async ({ request }) => {
      onRequest?.(request.clone());
      adapterTimeout.abort(
        new DOMException(
          "The operation was aborted due to timeout",
          "TimeoutError"
        )
      );
      await delay("infinite");
    },
    { once: true }
  );
}
