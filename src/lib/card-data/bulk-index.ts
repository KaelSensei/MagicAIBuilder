/**
 * Reads Scryfall's bulk-data index (`GET /bulk-data`) into one descriptor per file I-67 reads.
 *
 * Shape recorded on 2026-11-20 (`fixtures/bulk-data-index-v1.json`): each entry has `type`,
 * `updated_at`, `jsonl_download_uri` and `compressed_size`. The JSON Lines files are gzip; the
 * index no longer carries `download_uri`, `size` or `content_encoding`
 * (https://scryfall.com/docs/api/bulk-data, read 2026-11-20). A file type the reader does not
 * read is ignored, so a new Scryfall file never fails a run.
 *
 * Pure: a parsed body in, descriptors out.
 *
 * @module card-data/bulk-index
 */
import "server-only";
import { isNonEmptyString, isRecord } from "@/lib/guards";
import {
  BULK_FILE_TYPES,
  type BulkFileDescriptor,
  type BulkFileType,
  type ContentEncoding,
} from "./bulk-file";

/** The index read: its descriptors, or why it cannot be trusted. */
export type BulkIndexParse =
  | { readonly kind: "parsed"; readonly files: readonly BulkFileDescriptor[] }
  | { readonly kind: "invalid"; readonly detail: string };

/** Narrows an index `type` to a file the reader reads. */
function isBulkFileType(value: unknown): value is BulkFileType {
  return BULK_FILE_TYPES.some((type) => type === value);
}

/** `gzip` when the file's path ends in `.gz`, as every JSON Lines file Scryfall lists does. */
function encodingOf(downloadUri: string): ContentEncoding {
  return new URL(downloadUri).pathname.endsWith(".gz") ? "gzip" : "identity";
}

/** True when `value` is an absolute http(s) URL. */
function isHttpUrl(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/** Reads one entry of a known type; a string naming the bad field otherwise. */
function toDescriptor(
  type: BulkFileType,
  entry: Readonly<Record<string, unknown>>
): BulkFileDescriptor | string {
  const {
    updated_at: updatedAt,
    jsonl_download_uri: downloadUri,
    compressed_size: size,
  } = entry;
  if (!isNonEmptyString(updatedAt) || Number.isNaN(Date.parse(updatedAt))) {
    return `${type}: updated_at is not a date`;
  }
  if (!isHttpUrl(downloadUri))
    return `${type}: jsonl_download_uri is not a URL`;
  if (typeof size !== "number" || !Number.isFinite(size))
    return `${type}: compressed_size is not a number`;
  return {
    type,
    updatedAt,
    downloadUri,
    size,
    contentEncoding: encodingOf(downloadUri),
  };
}

/**
 * Reads the index body into the descriptors of Oracle Cards, Default Cards and Rulings, in
 * index order.
 *
 * @param body - the parsed JSON body of `GET /bulk-data`
 * @returns the descriptors, or `invalid` when the body or an entry of a known type is malformed
 */
export function parseBulkIndex(body: unknown): BulkIndexParse {
  if (!isRecord(body) || !Array.isArray(body.data)) {
    return { kind: "invalid", detail: "the body has no data list" };
  }
  const files: BulkFileDescriptor[] = [];
  for (const entry of body.data) {
    if (!isRecord(entry) || !isBulkFileType(entry.type)) continue;
    const descriptor = toDescriptor(entry.type, entry);
    if (typeof descriptor === "string")
      return { kind: "invalid", detail: descriptor };
    files.push(descriptor);
  }
  return { kind: "parsed", files };
}
