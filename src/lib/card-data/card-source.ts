/**
 * The `CardSource` port: where I-67's card data comes from. The slice 2 loader consumes it; the
 * Scryfall adapter (`scryfall-card-source.ts`) and the in-memory fake
 * (`testing/in-memory-card-source.ts`) implement it, and both run the shared contract suite
 * (`testing/card-source-contract.ts`).
 *
 * A source reads; it never writes. MTGJSON (slice 13) and the exit drill's adapter (slice 15)
 * are later implementations of the same port.
 *
 * @module card-data/card-source
 */
import "server-only";
import type {
  BulkFileDescriptor,
  BulkFileReport,
  BulkObjectSink,
  LastBulkRun,
  SourceFailure,
} from "./bulk-file";

/** The files a source offers, or why it could not list them. */
export type BulkIndexOutcome =
  | { readonly status: "listed"; readonly files: readonly BulkFileDescriptor[] }
  | { readonly status: "failed"; readonly reason: SourceFailure };

/** One file to read, what the last run recorded for it, and where its objects go. */
export interface BulkFileRequest {
  readonly descriptor: BulkFileDescriptor;
  /** null when no run has read this file yet. */
  readonly lastRun: LastBulkRun | null;
  /** Receives every valid object read; only a `loaded` report means they are to be applied. */
  readonly onObject: BulkObjectSink;
}

/** Where bulk card data is read from. */
export interface CardSource {
  /** Lists the files of Oracle Cards, Default Cards and Rulings the source holds now. */
  readonly listBulkFiles: () => Promise<BulkIndexOutcome>;
  /**
   * Reads one listed file, or skips it when it matches `lastRun`. Resolves with the file's
   * report for a refused request or a bad line alike; it does not reject.
   */
  readonly readBulkFile: (request: BulkFileRequest) => Promise<BulkFileReport>;
}
