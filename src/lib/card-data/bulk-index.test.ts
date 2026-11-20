/**
 * Reading Scryfall's `/bulk-data` index into the descriptors of the files I-67 reads, from the
 * index recorded on 2026-11-20. Solitary: the reader is a function of the parsed body.
 *
 * @module card-data/bulk-index.test
 */
import { describe, expect, it } from "vitest";
import { parseBulkIndex } from "./bulk-index";
import { recordedBulkIndex } from "./testing/recorded-bulk-files";

/** One entry of the index, in the shape Scryfall serves. */
function anEntry(
  fields: Readonly<Record<string, unknown>>
): Readonly<Record<string, unknown>> {
  return {
    object: "bulk_data",
    type: "rulings",
    updated_at: "2026-11-20T10:00:34.717+00:00",
    jsonl_download_uri:
      "https://data.scryfall.io/rulings/rulings-20261120100034.jsonl.gz",
    compressed_size: 5508481,
    ...fields,
  };
}

describe("parseBulkIndex", () => {
  it("returns one descriptor per file I-67 reads, and ignores the other files", () => {
    expect(parseBulkIndex(recordedBulkIndex())).toEqual({
      kind: "parsed",
      files: [
        {
          type: "oracle_cards",
          updatedAt: "2026-11-20T10:02:03.416+00:00",
          downloadUri:
            "https://data.scryfall.io/oracle-cards/oracle-cards-20261120100203.jsonl.gz",
          size: 25540722,
          contentEncoding: "gzip",
        },
        {
          type: "default_cards",
          updatedAt: "2026-11-20T10:06:19.060+00:00",
          downloadUri:
            "https://data.scryfall.io/default-cards/default-cards-20261120100619.jsonl.gz",
          size: 81290006,
          contentEncoding: "gzip",
        },
        {
          type: "rulings",
          updatedAt: "2026-11-20T10:00:34.717+00:00",
          downloadUri:
            "https://data.scryfall.io/rulings/rulings-20261120100034.jsonl.gz",
          size: 5508481,
          contentEncoding: "gzip",
        },
      ],
    });
  });

  it("ignores a file type it does not know rather than failing", () => {
    const index = {
      object: "list",
      data: [anEntry({ type: "card_backs" }), anEntry({})],
    };

    expect(parseBulkIndex(index)).toMatchObject({
      kind: "parsed",
      files: [{ type: "rulings" }],
    });
  });

  it("describes a file served without a .gz suffix as not compressed", () => {
    const index = {
      data: [
        anEntry({
          jsonl_download_uri: "https://data.scryfall.io/rulings/rulings.jsonl",
        }),
      ],
    };

    expect(parseBulkIndex(index)).toMatchObject({
      kind: "parsed",
      files: [{ contentEncoding: "identity" }],
    });
  });

  it.each([
    ["a body without a data list", { object: "error" }],
    [
      "a file without a download URI",
      { data: [anEntry({ jsonl_download_uri: undefined })] },
    ],
    [
      "a file whose date is not a date",
      { data: [anEntry({ updated_at: "yesterday" })] },
    ],
    [
      "a file whose size is not a number",
      { data: [anEntry({ compressed_size: "5 MB" })] },
    ],
  ])("refuses %s", (_case, body) => {
    expect(parseBulkIndex(body)).toMatchObject({ kind: "invalid" });
  });
});
