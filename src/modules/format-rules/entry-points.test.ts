/**
 * Pins the public API of the format rules context: the runtime names its entry
 * point exports (ADR 0002). Code outside the context may import only these, so
 * a name added or dropped here is an API change to review, not a side effect
 * of an internal edit. Types are erased at runtime; `tsc` checks them.
 */
import { describe, expect, it } from "vitest";

/** The runtime export names of a module namespace, sorted. */
function exportNames(namespace: object): readonly string[] {
  return Object.keys(namespace).toSorted((a, b) => a.localeCompare(b, "en"));
}

describe("the format rules entry points", () => {
  it("index.ts publishes the side-deck check, the deck size rule, the rulebreaker table and the league allowance", async () => {
    expect(exportNames(await import("@/modules/format-rules"))).toEqual([
      "checkRoundAllowance",
      "checkSideDeck",
      "deckConstructionExceptions",
      "deckSizeRule",
      "deckSizeStatus",
      "isIdentityExempt",
      "liftsMaximumDeckSize",
      "rulebreakerAdmission",
      "RULEBREAKERS",
      "RULEBREAKERS_SOURCE",
      "RULEBREAKERS_VERSION",
    ]);
  });
});
