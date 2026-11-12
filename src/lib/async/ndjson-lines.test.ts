import { describe, expect, it } from "vitest";
import { readNdjsonLines } from "./ndjson-lines";

/** A body reader that yields `chunks` one read at a time, as a network stream does. */
function readerOf(
  chunks: readonly (string | Uint8Array)[]
): ReadableStreamDefaultReader<Uint8Array> {
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
  }).getReader();
}

async function collect(
  chunks: readonly (string | Uint8Array)[]
): Promise<string[]> {
  const lines: string[] = [];
  for await (const line of readNdjsonLines(readerOf(chunks))) lines.push(line);
  return lines;
}

describe("readNdjsonLines", () => {
  it("yields each line once, without its line break, and nothing for a trailing line break", async () => {
    expect(await collect(['{"a":1}\n{"b":', "2}\n"])).toEqual([
      '{"a":1}',
      '{"b":2}',
    ]);
  });

  it("yields the last line when the stream ends without a line break", async () => {
    expect(await collect(['{"a":1}\n{"b":2}'])).toEqual(['{"a":1}', '{"b":2}']);
  });

  it("decodes a multi-byte character split across the last two reads", async () => {
    const bytes = new TextEncoder().encode("Lim-Dûl");
    const cut = bytes.indexOf(0xc3) + 1;

    expect(await collect([bytes.slice(0, cut), bytes.slice(cut)])).toEqual([
      "Lim-Dûl",
    ]);
  });

  it("stops reading when the consumer leaves the loop early", async () => {
    const seen: string[] = [];
    for await (const line of readNdjsonLines(readerOf(["one\ntwo\nthree\n"]))) {
      seen.push(line);
      if (line === "two") break;
    }
    expect(seen).toEqual(["one", "two"]);
  });
});
