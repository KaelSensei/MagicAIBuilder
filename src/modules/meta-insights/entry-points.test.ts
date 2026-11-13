/**
 * Pins the public API of the meta insights context: the runtime names each
 * entry point exports (ADR 0002). Code outside the context may import only
 * these, so a name added or dropped here is an API change to review, not a
 * side effect of an internal edit. Types are erased at runtime; `tsc` checks
 * them. There is no `client.ts` yet: the two hooks have no importer outside
 * the context, and the components are imported by their `ui/` path.
 */
import { describe, expect, it } from "vitest";

/** The runtime export names of a module namespace, sorted. */
function exportNames(namespace: object): readonly string[] {
  return Object.keys(namespace).toSorted((a, b) => a.localeCompare(b, "en"));
}

describe("the meta insights entry points", () => {
  it("index.ts publishes the meta shift differencing and nothing else at runtime", async () => {
    expect(exportNames(await import("@/modules/meta-insights"))).toEqual([
      "computeMetaShifts",
    ]);
  });

  it("server.ts publishes the wired use case, the two fetchers and the snapshot store, nothing else", async () => {
    expect(exportNames(await import("@/modules/meta-insights/server"))).toEqual(
      [
        "DEFAULT_WINDOW_DAYS",
        "fetchEdhrecData",
        "fetchTournamentData",
        "getCommanderMeta",
        "MAX_WINDOW_DAYS",
        "readSnapshotHistory",
        "recordEdhrecSnapshot",
      ]
    );
  });
});
