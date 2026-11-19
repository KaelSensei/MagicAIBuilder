import { describe, expect, it } from "vitest";
import { readNdjsonEvents, readNdjsonLines } from "./ndjson-lines";

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

/** The event shape the `readNdjsonEvents` tests accept: a `{ "n": <number> }` object. */
interface Numbered {
  readonly n: number;
}

function isNumbered(value: unknown): value is Numbered {
  return (
    typeof value === "object" &&
    value !== null &&
    "n" in value &&
    typeof value.n === "number"
  );
}

async function collectEvents(
  chunks: readonly (string | Uint8Array)[]
): Promise<Numbered[]> {
  const events: Numbered[] = [];
  for await (const event of readNdjsonEvents(readerOf(chunks), isNumbered)) {
    events.push(event);
  }
  return events;
}

describe("readNdjsonEvents", () => {
  it("yields each line the guard accepts, in order, including a last line without a line break", async () => {
    expect(await collectEvents(['{"n":1}\n{"n":', '2}\n{"n":3}'])).toEqual([
      { n: 1 },
      { n: 2 },
      { n: 3 },
    ]);
  });

  it("skips blank lines, lines that are not JSON and values the guard refuses", async () => {
    expect(
      await collectEvents([
        '\n   \n{"n":1}\nnot json\n{"n":"2"}\n[1]\nnull\n{"n":4}\n',
      ])
    ).toEqual([{ n: 1 }, { n: 4 }]);
  });

  it("accepts a line wrapped in spaces or ended by a carriage return", async () => {
    expect(await collectEvents(['  {"n":1}  \r\n{"n":2}\r\n'])).toEqual([
      { n: 1 },
      { n: 2 },
    ]);
  });

  it("stops reading when the consumer leaves the loop early", async () => {
    const seen: Numbered[] = [];
    const events = readNdjsonEvents(
      readerOf(['{"n":1}\n{"n":2}\n{"n":3}\n']),
      isNumbered
    );
    for await (const event of events) {
      seen.push(event);
      if (event.n === 2) break;
    }
    expect(seen).toEqual([{ n: 1 }, { n: 2 }]);
  });
});
