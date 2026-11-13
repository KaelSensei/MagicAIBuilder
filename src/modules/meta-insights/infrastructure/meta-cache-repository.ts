/**
 * The `MetaCache` table as the `MetaCacheRepository` port: one answer per
 * commander and source, kept for a day, read back through a Zod parse of its
 * `Json` column.
 *
 * An adapter of the meta insights context. Before MI-04 the meta route ran
 * these two Prisma calls itself and cast the stored `Json` to a record; the
 * parse here replaces the casts, so the use case and the route handle typed
 * `CommanderMetaData` only. `server.ts` builds the repository on the shared
 * client; tests build it on `stubPrisma` over the in-memory table
 * (`src/test/meta-cache-db-fake.ts`).
 *
 * @module meta-insights/infrastructure/meta-cache-repository
 */
import "server-only";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { toJsonPayload } from "@/lib/db/json-payload";
import type {
  MetaCacheEntry,
  MetaCacheKey,
  MetaCacheRepository,
} from "@/modules/meta-insights/application/ports";
import type {
  CommanderMetaData,
  EdhrecData,
  MetaSource,
  TournamentData,
} from "@/modules/meta-insights/domain/types";

/**
 * How long a stored answer counts as fresh. EDHREC recomputes its pages about
 * once a day and MTGTop8 lists events as they are reported, so a day keeps
 * the panel current while every viewer of one commander shares one fetch.
 */
export const META_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * The shape of a stored EDHREC answer: `EdhrecData` as `toJsonPayload` wrote
 * it. Optional fields stay optional, so rows written before `sample` existed
 * still read. Unknown keys are dropped, as the typed domain value has none.
 */
const storedEdhrecSchema = z.object({
  cards: z.array(
    z.object({
      name: z.string(),
      inclusion: z.number(),
      sample: z
        .object({ decksWithCard: z.number(), eligibleDecks: z.number() })
        .optional(),
      imageUri: z.string().optional(),
    })
  ),
});

/** The shape of a stored tournament answer: `TournamentData` as `toJsonPayload` wrote it. */
const storedTournamentSchema = z.object({
  decks: z.array(
    z.object({
      name: z.string(),
      player: z.string().optional(),
      event: z.string().optional(),
      date: z.string().optional(),
      placement: z.string().optional(),
      format: z.string().optional(),
      eventLevel: z.number().optional(),
      url: z.string(),
      source: z.enum(["mtgdecks", "mtgtop8"]),
    })
  ),
});

/**
 * @returns the stored `data` as the domain value for `source`, or null when
 *   the row has another shape: a row the adapter cannot read is a miss, as
 *   the port requires.
 */
function parseStoredData(
  source: MetaSource,
  data: unknown
): CommanderMetaData | null {
  if (source === "edhrec") {
    const parsed = storedEdhrecSchema.safeParse(data);
    if (!parsed.success) return null;
    const edhrec: EdhrecData = parsed.data;
    return edhrec;
  }
  const parsed = storedTournamentSchema.safeParse(data);
  if (!parsed.success) return null;
  const tournament: TournamentData = parsed.data;
  return tournament;
}

/**
 * Builds the repository over `client`.
 *
 * `read` looks the row up by its compound unique key and parses its `data`
 * for the key's source. `write` upserts the row with `cachedAt` = `observedAt`
 * and `expiresAt` one `META_CACHE_TTL_MS` later. Both swallow a database
 * error, read as a miss and write as a no-op, because the route did before
 * this adapter existed; B2-12 decides whether to log them.
 *
 * @param client - the Prisma client to run on; `server.ts` passes the shared one
 * @returns the repository, one per client
 */
export function prismaMetaCacheRepository(
  client: PrismaClient
): MetaCacheRepository {
  return {
    read: async (key: MetaCacheKey): Promise<MetaCacheEntry | null> => {
      try {
        const row = await client.metaCache.findUnique({
          where: { commanderSlug_source: key },
        });
        if (!row) return null;
        const data = parseStoredData(key.source, row.data);
        if (!data) return null;
        return { data, cachedAt: row.cachedAt, expiresAt: row.expiresAt };
      } catch {
        // A failed read is a miss; the use case asks the provider (B2-12).
        return null;
      }
    },
    write: async (key, data, observedAt): Promise<void> => {
      const expiresAt = new Date(observedAt.getTime() + META_CACHE_TTL_MS);
      const payload = toJsonPayload(data);
      try {
        await client.metaCache.upsert({
          where: { commanderSlug_source: key },
          create: { ...key, data: payload, cachedAt: observedAt, expiresAt },
          update: { data: payload, cachedAt: observedAt, expiresAt },
        });
      } catch {
        // A failed write is dropped: the answer is still served (B2-12).
      }
    },
  };
}
