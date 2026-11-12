/**
 * Pins the public API of the rules reference context: the runtime names each
 * entry point exports (ADR 0002). Code outside the context may import only
 * these, so a name added or dropped here is an API change to review, not a
 * side effect of an internal edit. Types are erased at runtime; `tsc` checks
 * them.
 */
import { describe, expect, it } from "vitest";

/** The runtime export names of a module namespace, sorted. */
function exportNames(namespace: object): readonly string[] {
  return Object.keys(namespace).toSorted((a, b) => a.localeCompare(b, "en"));
}

describe("the rules reference entry points", () => {
  it("index.ts publishes the rules search and nothing else at runtime", async () => {
    expect(exportNames(await import("@/modules/rules-reference"))).toEqual([
      "searchComprehensiveRules",
    ]);
  });

  it("server.ts publishes the bundled rules loader and nothing else", async () => {
    expect(
      exportNames(await import("@/modules/rules-reference/server"))
    ).toEqual(["loadComprehensiveRules"]);
  });
});
