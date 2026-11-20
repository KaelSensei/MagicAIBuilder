// @vitest-environment node
/**
 * The streaming parser of a bulk file and its line guards (I-67 2.3 and 5.1), fed the recorded
 * excerpts as byte streams. Solitary: the parser is a function of a stream.
 *
 * @module card-data/bulk-stream.test
 */
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  BULK_FILE_TYPES,
  type BulkFileType,
  type BulkObject,
} from "./bulk-file";
import { readBulkStream, type BulkStreamOutcome } from "./bulk-stream";
import {
  chunksOf,
  recordedBulkLines,
  recordedBulkText,
  streamOf,
  withoutField,
} from "./testing/recorded-bulk-files";

/** Joins lines into a JSON Lines body, each line ended by `\n` as Scryfall writes them. */
function jsonLines(lines: readonly string[]): string {
  return lines.map((line) => `${line}\n`).join("");
}

describe("readBulkStream", () => {
  it("a Default Cards line without oracle_id fails the file and names line 3", async () => {
    const lines = [...recordedBulkLines("default_cards")];
    lines[2] = withoutField(lines[2], "oracle_id");
    const objects: BulkObject[] = [];

    const outcome = await readBulkStream({
      body: streamOf([jsonLines(lines)]),
      fileType: "default_cards",
      gzip: false,
      onObject: (object) => objects.push(object),
    });

    expect(outcome).toMatchObject({
      status: "failed",
      reason: { kind: "missing_field", line: 3, field: "oracle_id" },
    });
    expect(objects).toHaveLength(2);
  });

  it.each([
    { encoding: "plain", gzip: false },
    { encoding: "gzip", gzip: true },
  ])(
    "a $encoding file split across chunks parses the same objects",
    async ({ gzip }) => {
      const text = recordedBulkText("default_cards");
      const encoded = new TextEncoder().encode(text);
      const bytes = gzip ? new Uint8Array(gzipSync(encoded)) : encoded;
      const whole = await read({
        chunks: [bytes],
        fileType: "default_cards",
        gzip,
      });

      // 7 bytes per chunk: every line, and the multi-byte characters inside them, are cut.
      const split = await read({
        chunks: chunksOf(bytes, 7),
        fileType: "default_cards",
        gzip,
      });

      expect(split.objects).toEqual(whole.objects);
      expect(split.objects).toHaveLength(
        recordedBulkLines("default_cards").length
      );
      expect(split.outcome).toEqual(whole.outcome);
    }
  );

  it.each(BULK_FILE_TYPES)(
    "every line of the recorded %s excerpt passes its guards",
    async (type) => {
      const { objects, outcome } = await read({
        chunks: [recordedBulkText(type)],
        fileType: type,
        gzip: false,
      });

      expect(outcome).toMatchObject({ status: "parsed", warnings: [] });
      expect(objects).toHaveLength(recordedBulkLines(type).length);
    }
  );

  it("accepts a reversible card that names its Oracle card on each face only", async () => {
    const reversible =
      recordedBulkLines("default_cards").find((line) =>
        line.includes('"layout":"reversible_card"')
      ) ?? "";
    const card: unknown = JSON.parse(reversible);
    expect(card).not.toHaveProperty("oracle_id");
    expect(card).toHaveProperty(["card_faces", 0, "oracle_id"]);

    const { outcome } = await read({
      chunks: [`${reversible}\n`],
      fileType: "default_cards",
      gzip: false,
    });

    expect(outcome).toMatchObject({ status: "parsed", objects: 1 });
  });

  it("warns once per unknown top-level field, with its first line, and still parses the file", async () => {
    const [first, second, third] = recordedBulkLines("rulings");
    const withNewField = (line: string, value: number): string =>
      line.replace(/^\{/, `{"rule_number":${value},`);

    const { outcome } = await read({
      chunks: [
        jsonLines([first, withNewField(second, 1), withNewField(third, 2)]),
      ],
      fileType: "rulings",
      gzip: false,
    });

    expect(outcome).toMatchObject({
      status: "parsed",
      objects: 3,
      warnings: [{ field: "rule_number", line: 2 }],
    });
  });

  it("fails the file on a malformed JSON line and names it", async () => {
    const [first, second] = recordedBulkLines("oracle_cards");

    const { outcome } = await read({
      chunks: [jsonLines([first, second.slice(0, -1)])],
      fileType: "oracle_cards",
      gzip: false,
    });

    expect(outcome).toMatchObject({
      status: "failed",
      reason: { kind: "malformed_json", line: 2 },
    });
  });

  it("fails a Rulings file whose line has no comment", async () => {
    const [first] = recordedBulkLines("rulings");

    const { outcome } = await read({
      chunks: [jsonLines([withoutField(first, "comment")])],
      fileType: "rulings",
      gzip: false,
    });

    expect(outcome).toMatchObject({
      status: "failed",
      reason: { kind: "missing_field", line: 1, field: "comment" },
    });
  });

  it("reports the SHA-256 and byte count of the bytes received, before decompression", async () => {
    const compressed = new Uint8Array(gzipSync(recordedBulkText("rulings")));

    const { outcome } = await read({
      chunks: chunksOf(compressed, 512),
      fileType: "rulings",
      gzip: true,
    });

    expect(outcome).toMatchObject({
      status: "parsed",
      sha256: createHash("sha256").update(compressed).digest("hex"),
      bytes: compressed.byteLength,
    });
  });

  it("fails the file when the bytes are not the gzip they claim to be", async () => {
    const { outcome } = await read({
      chunks: [recordedBulkText("rulings")],
      fileType: "rulings",
      gzip: true,
    });

    expect(outcome).toMatchObject({
      status: "failed",
      reason: { kind: "unreadable_stream" },
    });
  });
});

/** Reads `chunks` as one bulk file and keeps what the sink received. */
async function read(input: {
  readonly chunks: readonly (string | Uint8Array)[];
  readonly fileType: BulkFileType;
  readonly gzip: boolean;
}): Promise<{
  readonly objects: readonly BulkObject[];
  readonly outcome: BulkStreamOutcome;
}> {
  const objects: BulkObject[] = [];
  const outcome = await readBulkStream({
    body: streamOf(input.chunks),
    fileType: input.fileType,
    gzip: input.gzip,
    onObject: (object) => objects.push(object),
  });
  return { objects, outcome };
}
