/**
 * The vocabulary of I-67's bulk reader: which Scryfall bulk files it reads, how the index
 * describes one, and what reading one reports. Types only, with the list of file types.
 *
 * Card catalog context (`docs/engineering/architecture.md`). The reader hands objects on and
 * writes nothing; the slice 2 loader stages them and applies a file only when its report says
 * `loaded` (I-67 3.3, `docs/product/specs/i67-one-card-data-pipeline.md`).
 *
 * @module card-data/bulk-file
 */
import "server-only";

/**
 * A bulk file this initiative reads, by the `type` Scryfall's index gives it. Unique Artwork,
 * All Cards and the tag files are not read (I-67 2.1); Oracle Tags waits for slice 7.
 */
export type BulkFileType = "oracle_cards" | "default_cards" | "rulings";

/** Every {@link BulkFileType}, in the order Scryfall's index lists them (and a run reads them). */
export const BULK_FILE_TYPES: readonly BulkFileType[] = [
  "oracle_cards",
  "default_cards",
  "rulings",
];

/** How a file's bytes are encoded on the wire. */
export type ContentEncoding = "gzip" | "identity";

/** One file of Scryfall's `/bulk-data` index, reduced to what the reader needs. */
export interface BulkFileDescriptor {
  readonly type: BulkFileType;
  /** Scryfall's `updated_at`, an ISO 8601 timestamp: the date every loaded value carries (I-67 1.4). */
  readonly updatedAt: string;
  /** Where the JSON Lines file is downloaded from (`jsonl_download_uri`). */
  readonly downloadUri: string;
  /** The size of the file on the wire, in bytes (`compressed_size`). */
  readonly size: number;
  /** `gzip` when the file is served compressed, as every `.jsonl.gz` file is. */
  readonly contentEncoding: ContentEncoding;
}

/** What the last run recorded for a file: enough to skip it when nothing changed (I-67 2.3). */
export interface LastBulkRun {
  /** The `updated_at` of the file that run read. */
  readonly updatedAt: string;
  /** The SHA-256, lower-case hex, of the bytes that run received. */
  readonly sha256: string;
}

/** One object of a bulk file: a card or a ruling as Scryfall wrote it, checked by the line guards. */
export type BulkObject = Readonly<Record<string, unknown>>;

/** Receives each object of a file as it is parsed, in file order. */
export type BulkObjectSink = (object: BulkObject) => void;

/** A line that fails its whole file (I-67 5.1). `line` counts from 1. */
export type BulkLineProblem =
  | {
      readonly kind: "missing_field";
      readonly line: number;
      readonly field: string;
    }
  | { readonly kind: "malformed_json"; readonly line: number }
  | { readonly kind: "not_an_object"; readonly line: number };

/** A top-level field the guards do not know, reported once per name with the first line it is on. */
export interface UnknownFieldWarning {
  readonly field: string;
  readonly line: number;
}

/** Why a request to Scryfall gave no usable answer. */
export type SourceFailure =
  /** Scryfall answered 429; no request goes out before `retryAt` (epoch ms, I-67 8.2). */
  | { readonly kind: "rate_limited"; readonly retryAt: number }
  | { readonly kind: "http_status"; readonly status: number }
  | { readonly kind: "network" }
  | { readonly kind: "invalid_index"; readonly detail: string };

/** Why a file failed: a request that failed, a body that could not be read, or a line guard. */
export type BulkFileFailure =
  SourceFailure | { readonly kind: "unreadable_stream" } | BulkLineProblem;

/** Why a file was not read through, or read but not to be applied. */
export type BulkSkipReason =
  /** Its `updated_at` is not newer than the last run's; nothing was downloaded. */
  | { readonly kind: "not_newer" }
  /** It was downloaded, and its SHA-256 equals the last run's. */
  | { readonly kind: "same_content" }
  /** An earlier 429 of this run stopped it before any request (I-67 8.2). */
  | { readonly kind: "rate_limited"; readonly retryAt: number };

/** The totals every report carries, whatever its status. */
interface BulkFileTotals {
  readonly type: BulkFileType;
  /** The descriptor's `updated_at`. */
  readonly updatedAt: string;
  /** SHA-256 of the bytes received, lower-case hex; the last run's when nothing was downloaded; null when a request failed. */
  readonly sha256: string | null;
  /** Bytes received, as sent on the wire (before decompression). */
  readonly bytes: number;
  /** Objects handed to the sink. */
  readonly objects: number;
  readonly warnings: readonly UnknownFieldWarning[];
}

/**
 * What reading one file reports (I-67 2.3, 3.4). `loaded` means read in full with every line
 * passing its guards: ready for the loader to apply, not yet written anywhere.
 */
export type BulkFileReport = BulkFileTotals &
  (
    | { readonly status: "loaded" }
    | { readonly status: "skipped"; readonly reason: BulkSkipReason }
    | { readonly status: "failed"; readonly reason: BulkFileFailure }
  );
