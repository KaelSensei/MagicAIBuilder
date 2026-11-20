/**
 * Reads one bulk file against what the last run recorded for it (I-67 2.1 and 2.3): a file
 * whose `updated_at` is not newer is skipped before any download; a downloaded file whose
 * SHA-256 equals the last run's is skipped once read. Everything else is read through the line
 * guards and reported `loaded` or `failed`.
 *
 * Shared by every `CardSource`: an implementation supplies only how a body is opened, so the
 * Scryfall adapter and the in-memory fake skip, count and fail files the same way.
 *
 * @module card-data/read-bulk-file
 */
import "server-only";
import type {
  BulkFileDescriptor,
  BulkFileReport,
  BulkObjectSink,
  LastBulkRun,
  SourceFailure,
} from "./bulk-file";
import { readBulkStream } from "./bulk-stream";

/** A body ready to read, or the source's refusal to give one. */
export type OpenedBulkBody =
  | {
      readonly kind: "opened";
      readonly body: ReadableStream<Uint8Array>;
      /** True when the bytes are gzip and must be decompressed. */
      readonly gzip: boolean;
    }
  | { readonly kind: "refused"; readonly reason: SourceFailure };

/** Opens the body of the file being read; called at most once, and only when it must be read. */
export type OpenBulkBody = () => Promise<OpenedBulkBody>;

/** One file to read, what the last run recorded for it, and where its objects go. */
export interface ReadBulkFileInput {
  readonly descriptor: BulkFileDescriptor;
  /** null when no run has read this file yet. */
  readonly lastRun: LastBulkRun | null;
  readonly open: OpenBulkBody;
  /** Receives every valid object read; only a `loaded` report means they are to be applied. */
  readonly onObject: BulkObjectSink;
}

/**
 * True when `updatedAt` is later than the last run's. An unparsable date counts as newer: a
 * wasted download is cheaper than a missed update.
 */
function isNewer(updatedAt: string, lastRun: LastBulkRun): boolean {
  const current = Date.parse(updatedAt);
  const previous = Date.parse(lastRun.updatedAt);
  if (Number.isNaN(current) || Number.isNaN(previous)) return true;
  return current > previous;
}

/** The report of a file nothing was received for. */
function emptyTotals(descriptor: BulkFileDescriptor, sha256: string | null) {
  return {
    type: descriptor.type,
    updatedAt: descriptor.updatedAt,
    sha256,
    bytes: 0,
    objects: 0,
    warnings: [],
  };
}

/**
 * Reads one bulk file, or skips it when the last run already read the same file.
 *
 * @returns the file's report; never rejects for a refused request or a bad line, which the
 *   report carries
 */
export async function readBulkFile(
  input: ReadBulkFileInput
): Promise<BulkFileReport> {
  const { descriptor, lastRun } = input;
  if (lastRun !== null && !isNewer(descriptor.updatedAt, lastRun)) {
    return {
      ...emptyTotals(descriptor, lastRun.sha256),
      status: "skipped",
      reason: { kind: "not_newer" },
    };
  }

  const opened = await input.open();
  if (opened.kind === "refused") {
    return {
      ...emptyTotals(descriptor, null),
      status: "failed",
      reason: opened.reason,
    };
  }

  const outcome = await readBulkStream({
    body: opened.body,
    fileType: descriptor.type,
    gzip: opened.gzip,
    onObject: input.onObject,
  });
  const totals = {
    type: descriptor.type,
    updatedAt: descriptor.updatedAt,
    sha256: outcome.sha256,
    bytes: outcome.bytes,
    objects: outcome.objects,
    warnings: outcome.warnings,
  };
  if (outcome.status === "failed")
    return { ...totals, status: "failed", reason: outcome.reason };
  if (lastRun?.sha256 === outcome.sha256) {
    return { ...totals, status: "skipped", reason: { kind: "same_content" } };
  }
  return { ...totals, status: "loaded" };
}
