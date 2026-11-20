/**
 * Reads one bulk file from its byte stream (I-67 2.3): hashes and counts the bytes as received,
 * decompresses them when asked, splits them into lines and checks each line (I-67 5.1), handing
 * every valid object to a sink as it goes. The file is never held whole in memory: at most one
 * read chunk and one line are.
 *
 * Server-only: it hashes with `node:crypto`, which can digest a stream piece by piece.
 *
 * @module card-data/bulk-stream
 */
import "server-only";
import { createHash } from "node:crypto";
import { readNdjsonLines } from "@/lib/async/ndjson-lines";
import type {
  BulkFileType,
  BulkLineProblem,
  BulkObjectSink,
  UnknownFieldWarning,
} from "./bulk-file";
import { checkBulkLine } from "./line-guards";

/** A bulk file's body and how to read it. */
export interface BulkStreamInput {
  /** The bytes as received from the network. */
  readonly body: ReadableStream<Uint8Array>;
  readonly fileType: BulkFileType;
  /** True when the bytes are gzip and must be decompressed before parsing. */
  readonly gzip: boolean;
  /** Receives each valid object in file order, including those before a failing line. */
  readonly onObject: BulkObjectSink;
}

/** Why a stream failed: a line guard, or bytes that could not be read or decompressed. */
export type BulkStreamFailure =
  BulkLineProblem | { readonly kind: "unreadable_stream" };

/** Totals of the bytes received and the objects handed on. */
interface BulkStreamTotals {
  /** SHA-256 of the bytes received, lower-case hex. */
  readonly sha256: string;
  readonly bytes: number;
  readonly objects: number;
  readonly warnings: readonly UnknownFieldWarning[];
}

/** What reading a stream gives: every line passed, or the first reason it stopped. */
export type BulkStreamOutcome = BulkStreamTotals &
  (
    | { readonly status: "parsed" }
    | { readonly status: "failed"; readonly reason: BulkStreamFailure }
  );

/** Counts and hashes the bytes that flow through it, passing them on unchanged. */
function byteTap(): {
  readonly stream: TransformStream<Uint8Array, Uint8Array<ArrayBuffer>>;
  readonly totals: () => { readonly sha256: string; readonly bytes: number };
} {
  const hash = createHash("sha256");
  let bytes = 0;
  const stream = new TransformStream<Uint8Array, Uint8Array<ArrayBuffer>>({
    transform(chunk, controller) {
      hash.update(chunk);
      bytes += chunk.byteLength;
      controller.enqueue(overArrayBuffer(chunk));
    },
  });
  return { stream, totals: () => ({ sha256: hash.digest("hex"), bytes }) };
}

/**
 * The same bytes as a view over a plain `ArrayBuffer`, the only kind `DecompressionStream`
 * accepts. A network chunk already is one, so this copies only a chunk over shared memory.
 */
function overArrayBuffer(chunk: Uint8Array): Uint8Array<ArrayBuffer> {
  return chunk.buffer instanceof ArrayBuffer
    ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
    : new Uint8Array(chunk);
}

/** The text bytes of a received body: gunzipped when `gzip`, as received otherwise. */
function decoded(
  received: ReadableStream<Uint8Array<ArrayBuffer>>,
  gzip: boolean
): ReadableStream<Uint8Array> {
  if (!gzip) return received;
  const compressed: ReadableStream<BufferSource> = received;
  return compressed.pipeThrough(new DecompressionStream("gzip"));
}

/** Checks lines one by one, counting objects and noting each unknown field once. */
function lineChecker(fileType: BulkFileType, onObject: BulkObjectSink) {
  let line = 0;
  let objects = 0;
  const firstLineOfField = new Map<string, number>();

  function accept(text: string): BulkLineProblem | null {
    line += 1;
    // Scryfall writes no blank line; one would carry nothing to check or hand on.
    if (text.trim() === "") return null;
    const checked = checkBulkLine({ text, line, fileType });
    if (checked.kind !== "valid") return checked;
    for (const field of checked.unknownFields) {
      if (!firstLineOfField.has(field)) firstLineOfField.set(field, line);
    }
    onObject(checked.object);
    objects += 1;
    return null;
  }

  const warnings = (): readonly UnknownFieldWarning[] =>
    [...firstLineOfField].map(([field, first]) => ({ field, line: first }));

  return { accept, objects: () => objects, warnings };
}

/** Reads every line through `accept` until one fails it or the stream ends. */
async function readLines(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  accept: (text: string) => BulkLineProblem | null
): Promise<BulkStreamFailure | null> {
  try {
    for await (const text of readNdjsonLines(reader)) {
      const problem = accept(text);
      if (problem !== null) return problem;
    }
    return null;
  } catch {
    return { kind: "unreadable_stream" };
  }
}

/**
 * Reads a bulk file from its body, line by line.
 *
 * The first failing line stops the read and cancels the body: one bad line fails the whole
 * file (I-67 5.1). The hash and byte count cover the bytes received up to then.
 *
 * @returns the totals, and `parsed` or the reason the file failed
 */
export async function readBulkStream(
  input: BulkStreamInput
): Promise<BulkStreamOutcome> {
  const tap = byteTap();
  const received = input.body.pipeThrough(tap.stream);
  const reader = decoded(received, input.gzip).getReader();
  const checker = lineChecker(input.fileType, input.onObject);

  const failure = await readLines(reader, checker.accept);
  if (failure !== null) await reader.cancel().catch(() => undefined);

  const totals = {
    ...tap.totals(),
    objects: checker.objects(),
    warnings: checker.warnings(),
  };
  return failure === null
    ? { ...totals, status: "parsed" }
    : { ...totals, status: "failed", reason: failure };
}
