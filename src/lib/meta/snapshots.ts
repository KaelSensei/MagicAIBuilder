/**
 * Reading and writing the retained EDHRec distribution (`MetaSnapshot`).
 *
 * The history accrues from ordinary traffic: every live EDHRec fetch the meta
 * route already performs is also written here, so no cron job, no scheduled
 * crawl and no extra request to EDHRec. The consequence is that a commander
 * nobody has opened twice has no history, which is why every read path treats
 * "no report" as the normal state rather than a failure.
 */

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import type { EdhrecData } from "./fetch";
import { toCaptureDay, type MetaSnapshotInput } from "./history";

/** How far back the comparison may reach when the caller does not say. */
export const DEFAULT_WINDOW_DAYS = 90;

/** The longest window a caller may ask for. */
export const MAX_WINDOW_DAYS = 365;

/** Snapshots older than this are dropped when the commander is next recorded. */
export const SNAPSHOT_RETENTION_DAYS = 365;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Shape of a stored snapshot's `data` column.
 *
 * Validated on read rather than trusted: the column is `Json`, so a row written
 * by an older shape of `EdhrecData` would otherwise reach `computeMetaShifts`
 * as a half-built object and difference against nothing.
 */
const storedDataSchema = z.object({
  cards: z.array(
    z.object({
      name: z.string().min(1),
      inclusion: z.number().finite(),
    })
  ),
});

/**
 * Record today's EDHRec distribution for a commander.
 *
 * Never throws: the snapshot is a by-product of serving the meta panel, and a
 * failure to retain history must not fail the response the user asked for.
 *
 * **An empty list is not recorded.** `fetchEdhrecData` returns `{ cards: [] }`
 * for a commander EDHRec does not know *and* when the upstream 404s, and the two
 * are indistinguishable here. Storing the empty result would make every card in
 * the previous snapshot read as having left the list — an upstream outage
 * rendered as a meta collapse that never happened.
 */
export async function recordEdhrecSnapshot(
  commanderSlug: string,
  data: EdhrecData,
  now: Date = new Date()
): Promise<void> {
  if (data.cards.length === 0) return;

  const capturedOn = toCaptureDay(now);
  const payload: z.infer<typeof storedDataSchema> = {
    cards: data.cards.map((card) => ({ name: card.name, inclusion: card.inclusion })),
  };

  try {
    await prisma.metaSnapshot.upsert({
      where: { commanderSlug_capturedOn: { commanderSlug, capturedOn } },
      create: { commanderSlug, capturedOn, data: payload },
      update: { data: payload },
    });
    await prisma.metaSnapshot.deleteMany({
      where: {
        commanderSlug,
        capturedOn: { lt: new Date(now.getTime() - SNAPSHOT_RETENTION_DAYS * MS_PER_DAY) },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Snapshot write failed";
    logger.error(message, "recordEdhrecSnapshot", { commanderSlug });
  }
}

/**
 * Every retained snapshot for a commander inside `windowDays`, oldest first.
 *
 * Rows whose stored payload no longer validates are skipped, not fatal: one bad
 * row should cost its own data point and nothing else.
 */
export async function readSnapshotHistory(
  commanderSlug: string,
  windowDays: number,
  now: Date = new Date()
): Promise<readonly MetaSnapshotInput[]> {
  const since = toCaptureDay(new Date(now.getTime() - windowDays * MS_PER_DAY));

  const rows = await prisma.metaSnapshot.findMany({
    where: { commanderSlug, capturedOn: { gte: since } },
    orderBy: { capturedOn: "asc" },
    select: { capturedOn: true, data: true },
  });

  const snapshots: MetaSnapshotInput[] = [];
  for (const row of rows) {
    const parsed = storedDataSchema.safeParse(row.data);
    if (!parsed.success) {
      logger.error("Unreadable snapshot payload", "readSnapshotHistory", {
        commanderSlug,
        capturedOn: row.capturedOn.toISOString(),
      });
      continue;
    }
    snapshots.push({ capturedOn: row.capturedOn, cards: parsed.data.cards });
  }

  return snapshots;
}
