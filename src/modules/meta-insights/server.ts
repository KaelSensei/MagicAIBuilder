/**
 * Meta insights context: the server entry point and composition root (ADR 0002).
 *
 * What the two meta routes call: `getCommanderMeta`, wired with the Prisma
 * meta cache, the two providers and the snapshot history, so
 * `GET /api/meta/:slug` holds HTTP concerns only; and, for the history route,
 * `readSnapshotHistory` with its window constants. The fetchers and
 * `recordEdhrecSnapshot` stay published for callers that want one provider
 * without the cache. The snapshot store and the cache repository are
 * `server-only`, and so is this file: a client import of it fails the build.
 *
 * @module meta-insights/server
 */
import "server-only";

import { prisma } from "@/lib/db/prisma";
import { makeGetCommanderMeta } from "@/modules/meta-insights/application/get-commander-meta";
import {
  fetchEdhrecData,
  fetchTournamentData,
} from "@/modules/meta-insights/infrastructure/fetch";
import { prismaMetaCacheRepository } from "@/modules/meta-insights/infrastructure/meta-cache-repository";
import { metaProvider } from "@/modules/meta-insights/infrastructure/meta-provider";
import {
  DEFAULT_WINDOW_DAYS,
  MAX_WINDOW_DAYS,
  readSnapshotHistory,
  recordEdhrecSnapshot,
} from "@/modules/meta-insights/infrastructure/snapshots";

export type {
  CommanderMetaResult,
  GetCommanderMeta,
  GetCommanderMetaQuery,
  MetaFetchFailure,
} from "@/modules/meta-insights/application/get-commander-meta";

export {
  DEFAULT_WINDOW_DAYS,
  fetchEdhrecData,
  fetchTournamentData,
  MAX_WINDOW_DAYS,
  readSnapshotHistory,
  recordEdhrecSnapshot,
};

/**
 * The use case over the shared Prisma client, the two providers, the EDHREC
 * snapshot history and the system clock. One instance per server process,
 * like the client behind it.
 */
export const getCommanderMeta = makeGetCommanderMeta({
  cache: prismaMetaCacheRepository(prisma),
  provider: metaProvider,
  history: {
    recordEdhrec: (commanderSlug, data) =>
      recordEdhrecSnapshot(commanderSlug, data),
  },
  clock: { now: () => new Date() },
});
