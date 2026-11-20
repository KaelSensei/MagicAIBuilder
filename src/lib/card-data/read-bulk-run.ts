/**
 * One run of the bulk reader: list the source's files, then read them one after the other, so
 * at most one file streams at a time (I-67 2.3). A 429 on any request ends the run: every file
 * after it is reported skipped without a request (I-67 8.2).
 *
 * It writes nothing. The scheduled job (slice 3) calls it and the loader (slice 2) consumes the
 * objects and reports.
 *
 * @module card-data/read-bulk-run
 */
import "server-only";
import { forEachSequential } from "@/lib/async/sequential";
import type {
  BulkFileDescriptor,
  BulkFileReport,
  BulkFileType,
  BulkObject,
  LastBulkRun,
  SourceFailure,
} from "./bulk-file";
import type { CardSource } from "./card-source";

/** What a run reads from, what the last run recorded, and where the objects go. */
export interface BulkRunInput {
  readonly source: CardSource;
  /** The last run's record of each file; a file absent here is read whatever its date. */
  readonly lastRuns: ReadonlyMap<BulkFileType, LastBulkRun>;
  /** Receives each valid object with the file it came from. */
  readonly onObject: (file: BulkFileType, object: BulkObject) => void;
}

/** A run's result: one report per listed file, or why the files could not be listed. */
export type BulkRunReport =
  | { readonly status: "read"; readonly files: readonly BulkFileReport[] }
  | { readonly status: "failed"; readonly reason: SourceFailure };

/** The pause a 429 started. */
type RateLimit = Extract<SourceFailure, { readonly kind: "rate_limited" }>;

/** The report of a file the run did not ask for, because an earlier request got a 429. */
function stoppedByRateLimit(
  descriptor: BulkFileDescriptor,
  pause: RateLimit
): BulkFileReport {
  return {
    type: descriptor.type,
    updatedAt: descriptor.updatedAt,
    sha256: null,
    bytes: 0,
    objects: 0,
    warnings: [],
    status: "skipped",
    reason: pause,
  };
}

/**
 * Reads every file the source lists, in its order, one at a time.
 *
 * @returns a report per listed file, or the source's failure to list them
 */
export async function readBulkRun(input: BulkRunInput): Promise<BulkRunReport> {
  const listing = await input.source.listBulkFiles();
  if (listing.status === "failed") return listing;

  const files: BulkFileReport[] = [];
  let pause: RateLimit | null = null;
  await forEachSequential(listing.files, async (descriptor) => {
    if (pause !== null) {
      files.push(stoppedByRateLimit(descriptor, pause));
      return;
    }
    const report = await input.source.readBulkFile({
      descriptor,
      lastRun: input.lastRuns.get(descriptor.type) ?? null,
      onObject: (object) => input.onObject(descriptor.type, object),
    });
    files.push(report);
    if (report.status === "failed" && report.reason.kind === "rate_limited")
      pause = report.reason;
  });
  return { status: "read", files };
}
