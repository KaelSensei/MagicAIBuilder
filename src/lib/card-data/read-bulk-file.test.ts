// @vitest-environment node
/**
 * Reading one bulk file against the last run (I-67 2.1 and 2.3): a file that has not changed
 * is skipped, and the report carries the totals the run report records. The body is a recorded
 * excerpt served from memory.
 *
 * @module card-data/read-bulk-file.test
 */
import { describe, expect, it } from "vitest";
import type { BulkFileDescriptor, BulkObject, LastBulkRun } from "./bulk-file";
import { readBulkFile, type OpenBulkBody } from "./read-bulk-file";
import {
  recordedBulkLines,
  recordedBulkText,
  streamOf,
} from "./testing/recorded-bulk-files";

const RULINGS: BulkFileDescriptor = {
  type: "rulings",
  updatedAt: "2026-11-20T10:00:34.717+00:00",
  downloadUri:
    "https://data.scryfall.io/rulings/rulings-20261120100034.jsonl.gz",
  size: 5508481,
  contentEncoding: "identity",
};

/** A body opener over the recorded Rulings excerpt that counts how often it is opened. */
function recordedRulings(): {
  readonly open: OpenBulkBody;
  readonly opened: () => number;
} {
  let opened = 0;
  const open: OpenBulkBody = async () => {
    opened += 1;
    return {
      kind: "opened",
      body: streamOf([recordedBulkText("rulings")]),
      gzip: false,
    };
  };
  return { open, opened: () => opened };
}

/** Reads the Rulings excerpt against `lastRun`, keeping what the sink received. */
async function readRulings(
  lastRun: LastBulkRun | null,
  open: OpenBulkBody = recordedRulings().open
) {
  const objects: BulkObject[] = [];
  const report = await readBulkFile({
    descriptor: RULINGS,
    lastRun,
    open,
    onObject: (object) => objects.push(object),
  });
  return { report, objects };
}

describe("readBulkFile", () => {
  it("reads a new file through and reports it loaded, with its totals", async () => {
    const { report, objects } = await readRulings(null);

    expect(report).toMatchObject({
      status: "loaded",
      type: "rulings",
      updatedAt: RULINGS.updatedAt,
      bytes: new TextEncoder().encode(recordedBulkText("rulings")).byteLength,
      objects: recordedBulkLines("rulings").length,
      warnings: [],
    });
    expect(report.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(objects).toHaveLength(recordedBulkLines("rulings").length);
  });

  it("a matching hash skips the file", async () => {
    const first = await readRulings(null);
    const lastRun = {
      updatedAt: "2026-11-19T10:00:31.000+00:00",
      sha256: first.report.sha256 ?? "",
    };

    const { report } = await readRulings(lastRun);

    expect(report).toMatchObject({
      status: "skipped",
      reason: { kind: "same_content" },
      sha256: first.report.sha256,
    });
  });

  it.each([
    ["the same", RULINGS.updatedAt],
    ["a later", "2026-11-21T10:00:00.000+00:00"],
  ])(
    "skips a file whose last run read %s date, without downloading it",
    async (_case, updatedAt) => {
      const body = recordedRulings();

      const { report, objects } = await readRulings(
        { updatedAt, sha256: "a".repeat(64) },
        body.open
      );

      expect(report).toMatchObject({
        status: "skipped",
        reason: { kind: "not_newer" },
        sha256: "a".repeat(64),
        bytes: 0,
        objects: 0,
      });
      expect(objects).toEqual([]);
      expect(body.opened()).toBe(0);
    }
  );

  it("reports a file the source refused as failed, with the refusal", async () => {
    const refused: OpenBulkBody = async () => ({
      kind: "refused",
      reason: { kind: "http_status", status: 503 },
    });

    const { report } = await readRulings(null, refused);

    expect(report).toMatchObject({
      status: "failed",
      reason: { kind: "http_status", status: 503 },
      sha256: null,
      bytes: 0,
      objects: 0,
    });
  });

  it("reports a file that fails a line guard as failed, with the line", async () => {
    const [first] = recordedBulkLines("rulings");
    const broken: OpenBulkBody = async () => ({
      kind: "opened",
      body: streamOf([`${first}\n{"object":"ruling"}\n`]),
      gzip: false,
    });

    const { report } = await readRulings(null, broken);

    expect(report).toMatchObject({
      status: "failed",
      reason: { kind: "missing_field", line: 2 },
      objects: 1,
    });
  });
});
