/**
 * The recorded Scryfall bulk-data index and file excerpts under `../fixtures/`, read for tests,
 * and the stream builders the reader's tests feed them through.
 *
 * Recorded on 2026-11-20 from `https://api.scryfall.com/bulk-data` and the three files it listed
 * (provenance in `../fixtures/README.md`). Test-only: it reads the disk, so nothing in production
 * imports it.
 *
 * @module card-data/testing/recorded-bulk-files
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  BulkFileDescriptor,
  BulkFileType,
} from "@/lib/card-data/bulk-file";
import { parseBulkIndex } from "@/lib/card-data/bulk-index";

/** The excerpt recorded for each file type, under `../fixtures/`. */
const EXCERPT_FILE: Readonly<Record<BulkFileType, string>> = {
  oracle_cards: "oracle-cards-v1.jsonl",
  default_cards: "default-cards-v1.jsonl",
  rulings: "rulings-v1.jsonl",
};

/**
 * Reads one fixture file as UTF-8 text. Resolved from `__dirname`, which Vitest sets in both the
 * `node` and `jsdom` environments; `import.meta.url` is not a file URL under jsdom.
 */
function readFixture(name: string): string {
  return readFileSync(join(__dirname, "..", "fixtures", name), "utf8");
}

/**
 * The recorded excerpt of one bulk file, exactly as Scryfall served it once decompressed: one
 * JSON object per line, each line ended by `\n`.
 */
export function recordedBulkText(type: BulkFileType): string {
  return readFixture(EXCERPT_FILE[type]);
}

/** The lines of {@link recordedBulkText}, without their line breaks. */
export function recordedBulkLines(type: BulkFileType): readonly string[] {
  return recordedBulkText(type)
    .split("\n")
    .filter((line) => line !== "");
}

/** The body of `GET /bulk-data` as recorded, as JSON text. */
export function recordedBulkIndexText(): string {
  return readFixture("bulk-data-index-v1.json");
}

/** The body of `GET /bulk-data` as recorded, parsed but not checked. */
export function recordedBulkIndex(): unknown {
  return JSON.parse(recordedBulkIndexText());
}

/**
 * The descriptors of the recorded index, in index order: Oracle Cards, Default Cards, Rulings.
 *
 * @throws Error if the recorded index no longer parses, which would be a broken fixture
 */
export function recordedDescriptors(): readonly BulkFileDescriptor[] {
  const index = parseBulkIndex(recordedBulkIndex());
  if (index.kind !== "parsed")
    throw new Error(`recorded index: ${index.detail}`);
  return index.files;
}

/** A byte stream that yields `chunks` one read at a time, as a network body does. */
export function streamOf(
  chunks: readonly (string | Uint8Array)[]
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(
          typeof chunk === "string" ? encoder.encode(chunk) : chunk
        );
      }
      controller.close();
    },
  });
}

/** Cuts `bytes` into chunks of `size` bytes, so chunk edges fall inside lines and characters. */
export function chunksOf(
  bytes: Uint8Array,
  size: number
): readonly Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let start = 0; start < bytes.length; start += size) {
    chunks.push(bytes.slice(start, start + size));
  }
  return chunks;
}

/**
 * Rewrites one JSON line without `field` at its top level.
 *
 * @throws Error when the line is not a JSON object, which no recorded line is
 */
export function withoutField(line: string, field: string): string {
  const value: unknown = JSON.parse(line);
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("withoutField: the line is not a JSON object");
  }
  return JSON.stringify(
    Object.fromEntries(Object.entries(value).filter(([key]) => key !== field))
  );
}
