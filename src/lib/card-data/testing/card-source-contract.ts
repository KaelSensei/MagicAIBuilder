/**
 * The shared contract of the `CardSource` port (ADR 0005: one suite per owned port, run against
 * the fake and the real adapter). Each case is a behaviour sentence and a check over a fresh
 * source that serves the recorded index and excerpts of 2026-11-20. Callers:
 * `in-memory-card-source.test.ts` and `../scryfall-card-source.test.ts`.
 *
 * What it leaves to the adapter's own suite: headers, the 429 pause, HTTP failures and
 * decompression, which the fake has no counterpart for.
 *
 * @module card-data/testing/card-source-contract
 */
import { expect } from "vitest";
import {
  BULK_FILE_TYPES,
  type BulkFileDescriptor,
  type BulkObject,
} from "@/lib/card-data/bulk-file";
import type { CardSource } from "@/lib/card-data/card-source";
import { recordedBulkLines } from "./recorded-bulk-files";

/** One expectation of the contract. */
export interface CardSourceContractCase {
  /** The test name each caller registers the case under. */
  readonly name: string;
  /** Exercises a fresh source and asserts; rejects on a broken contract. */
  readonly run: (source: CardSource) => Promise<void>;
}

/** The files the source lists; fails the case when it cannot list them. */
async function listed(
  source: CardSource
): Promise<readonly BulkFileDescriptor[]> {
  const listing = await source.listBulkFiles();
  if (listing.status !== "listed")
    throw new Error(`the source listed nothing: ${listing.reason.kind}`);
  return listing.files;
}

/** Reads one file from scratch, keeping what the sink received. */
async function readFresh(source: CardSource, descriptor: BulkFileDescriptor) {
  const objects: BulkObject[] = [];
  const report = await source.readBulkFile({
    descriptor,
    lastRun: null,
    onObject: (object) => objects.push(object),
  });
  return { report, objects };
}

/** The cases every `CardSource` must pass. */
export const CARD_SOURCE_CONTRACT_CASES: readonly CardSourceContractCase[] = [
  {
    name: "lists Oracle Cards, Default Cards and Rulings, each with its date",
    run: async (source) => {
      const files = await listed(source);
      expect(files.map((file) => file.type)).toEqual(BULK_FILE_TYPES);
      for (const file of files)
        expect(Number.isNaN(Date.parse(file.updatedAt))).toBe(false);
    },
  },
  {
    name: "reads each file through, handing on one object per line",
    run: async (source) => {
      const reads = await Promise.all(
        (await listed(source)).map((file) => readFresh(source, file))
      );
      for (const { report, objects } of reads) {
        const lines = recordedBulkLines(report.type).length;
        expect(report).toMatchObject({
          status: "loaded",
          objects: lines,
          warnings: [],
        });
        expect(report.sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(objects).toHaveLength(lines);
      }
    },
  },
  {
    name: "skips a file the last run read at the same date, handing on nothing",
    run: async (source) => {
      const [file] = await listed(source);
      const objects: BulkObject[] = [];
      const report = await source.readBulkFile({
        descriptor: file,
        lastRun: { updatedAt: file.updatedAt, sha256: "0".repeat(64) },
        onObject: (object) => objects.push(object),
      });
      expect(report).toMatchObject({
        status: "skipped",
        reason: { kind: "not_newer" },
        bytes: 0,
      });
      expect(objects).toEqual([]);
    },
  },
  {
    name: "skips a newer file whose bytes hash as the last run's",
    run: async (source) => {
      const [file] = await listed(source);
      const first = await readFresh(source, file);
      const report = await source.readBulkFile({
        descriptor: file,
        lastRun: {
          updatedAt: "2000-01-01T00:00:00.000+00:00",
          sha256: first.report.sha256 ?? "",
        },
        onObject: () => undefined,
      });
      expect(report).toMatchObject({
        status: "skipped",
        reason: { kind: "same_content" },
        sha256: first.report.sha256,
        objects: first.report.objects,
      });
    },
  },
];
