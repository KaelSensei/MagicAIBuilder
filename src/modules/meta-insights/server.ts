/**
 * Meta insights context: the server entry point (ADR 0002).
 *
 * What the two meta routes call: the EDHREC and MTGTop8 fetchers, and the
 * `MetaSnapshot` store that retains one EDHREC distribution per commander per
 * day and reads it back over a window. The route still owns the `MetaCache`
 * read-through and its Prisma calls; MI-04 moves that into a use case wired
 * here. The snapshot store is `server-only`, and so is this file: a client
 * import of it fails the build.
 *
 * @module meta-insights/server
 */
import "server-only";

export {
  fetchEdhrecData,
  fetchTournamentData,
} from "@/modules/meta-insights/infrastructure/fetch";
export {
  DEFAULT_WINDOW_DAYS,
  MAX_WINDOW_DAYS,
  readSnapshotHistory,
  recordEdhrecSnapshot,
} from "@/modules/meta-insights/infrastructure/snapshots";
