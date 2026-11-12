/**
 * Pins the public API of the combos context: the runtime names each entry
 * point exports (ADR 0002). Code outside the context may import only these,
 * so a name added or dropped here is an API change to review, not a side
 * effect of an internal edit. Types are erased at runtime; `tsc` checks them.
 */
import { describe, expect, it } from "vitest";

/** The runtime export names of a module namespace, sorted. */
function exportNames(namespace: object): readonly string[] {
  return Object.keys(namespace).toSorted((a, b) => a.localeCompare(b, "en"));
}

describe("the combos entry points", () => {
  it("index.ts publishes the two-card combo policy, the card-list bounds, its schema and normaliser, and the lookup rate limits", async () => {
    expect(exportNames(await import("@/modules/combos"))).toEqual([
      "COMBO_LOOKUP_WINDOW_MS",
      "COMBO_LOOKUPS_PER_CLIENT",
      "deckComboQuerySchema",
      "isTwoCardInfiniteCombo",
      "MAX_MAIN_CARDS",
      "MAX_QUERY_BODY_BYTES",
      "normalizeDeckComboQuery",
      "SPELLBOOK_CALLS_PER_WINDOW",
    ]);
  });

  it("server.ts publishes the wired combo lookup and nothing else", async () => {
    expect(exportNames(await import("@/modules/combos/server"))).toEqual([
      "lookupDeckCombos",
    ]);
  });

  it("client.ts publishes the hook and the API client it calls", async () => {
    expect(exportNames(await import("@/modules/combos/client"))).toEqual([
      "fetchCombosForDeck",
      "useCombos",
    ]);
  });
});
