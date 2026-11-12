// @vitest-environment node
/**
 * Runs the `ComboSource` contract against `spellbookComboSource`, the
 * Commander Spellbook adapter, with MSW in place of the network: the recorded
 * `find-my-combos` answer for the success case, and an HTTP error, a network
 * error, a body of another shape and a request never answered for the
 * failure kinds. With the fake's run of the same suite, this is what lets the
 * use case tests trust the fake (ADR 0005).
 *
 * The node environment matches where the adapter runs: it is `server-only`
 * and is called by `POST /api/combos`.
 */
import { afterEach, describe, vi } from "vitest";
import { http, HttpResponse } from "msw";

import type { DeckCombosFailure } from "@/modules/combos/application/ports";
import {
  SPELLBOOK_FIND_MY_COMBOS_URL,
  spellbookComboSource,
} from "@/modules/combos/infrastructure/find-my-combos";
import { FIND_MY_COMBOS_RECORDED } from "@/modules/combos/infrastructure/fixtures/find-my-combos-v1";
import {
  describeComboSourceContract,
  type ComboSourceHarness,
} from "@/modules/combos/testing/combo-source-contract";
import {
  spellbookAnswers,
  spellbookNeverAnswers,
} from "@/modules/combos/testing/spellbook-msw";
import { setupMsw } from "@/test/msw";

/** The recording with its `included` bucket emptied: a deck Spellbook knows no combo for. */
const RECORDED_WITHOUT_COMBOS = {
  ...FIND_MY_COMBOS_RECORDED,
  results: { ...FIND_MY_COMBOS_RECORDED.results, included: [] },
};

/** One upstream cause for each failure the port reports. */
function spellbookFailing(failure: DeckCombosFailure) {
  switch (failure.kind) {
    case "failed":
      return failure.status === null
        ? http.post(SPELLBOOK_FIND_MY_COMBOS_URL, () => HttpResponse.error())
        : spellbookAnswers(
            { detail: "Upstream error" },
            { status: failure.status }
          );
    case "unexpected-body":
      // A page of variants: valid JSON, but not the deck-level shape.
      return spellbookAnswers({ count: 0, results: [] });
    case "timeout":
      return spellbookNeverAnswers();
    default: {
      const unreachable: never = failure;
      throw new Error(`no upstream cause for ${JSON.stringify(unreachable)}`);
    }
  }
}

describe("Spellbook adapter — ComboSource contract", () => {
  // No default handler: a case that forgot to say what Spellbook answers fails loudly.
  const server = setupMsw();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** @returns a harness whose upstream is the MSW server of this file */
  function spellbookHarness(): ComboSourceHarness {
    return {
      source: spellbookComboSource,
      upstreamListsTheRecordedCombos: () =>
        server.use(spellbookAnswers(FIND_MY_COMBOS_RECORDED)),
      upstreamListsNoCombo: () =>
        server.use(spellbookAnswers(RECORDED_WITHOUT_COMBOS)),
      upstreamFails: (failure) => server.use(spellbookFailing(failure)),
    };
  }

  describeComboSourceContract(spellbookHarness);
});
