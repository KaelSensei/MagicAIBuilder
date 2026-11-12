import { describe, expect, it } from "vitest";
import { processStream, type SuggestionStreamAcc } from "./suggestion-stream";

const ANALYSIS =
  '{"type":"analysis","content":"Short on protection.","provider":"anthropic"}';
const SWAN_SONG =
  '{"type":"suggestion","data":{"name":"Swan Song","reason":"Protects Talrand.","category":"protection","priority":"high"}}';
const OPT_REMOVAL =
  '{"type":"removal","data":{"name":"Opt","reason":"Weakest cantrip."}}';
const DONE = '{"type":"done"}';

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

/** Runs the reader and keeps a copy of each published state. */
async function read(chunks: readonly (string | Uint8Array)[]) {
  const published: SuggestionStreamAcc[] = [];
  const result = await processStream(readerOf(chunks), (acc) =>
    published.push(structuredClone(acc))
  );
  return { result, published };
}

describe("processStream", () => {
  it("publishes after the analysis, each suggestion and each removal, but not after done", async () => {
    const { result, published } = await read([
      `${ANALYSIS}\n${SWAN_SONG}\n${OPT_REMOVAL}\n${DONE}\n`,
    ]);

    expect(published).toHaveLength(3);
    expect(result).toEqual({
      analysis: "Short on protection.",
      provider: "anthropic",
      suggestions: [
        {
          name: "Swan Song",
          reason: "Protects Talrand.",
          category: "protection",
          priority: "high",
        },
      ],
      removals: [{ name: "Opt", reason: "Weakest cantrip." }],
    });
  });

  it("joins a line split across reads, even inside a multi-byte character", async () => {
    const line = new TextEncoder().encode(
      '{"type":"removal","data":{"name":"Lim-Dûl\'s Vault","reason":"Slow."}}\n'
    );
    // "û" is two bytes in UTF-8; cut between them.
    const cut = line.indexOf(0xc3) + 1;

    const { result } = await read([line.slice(0, cut), line.slice(cut)]);

    expect(result.removals).toEqual([
      { name: "Lim-Dûl's Vault", reason: "Slow." },
    ]);
  });

  it("skips blank lines, lines that are not JSON, unknown events and events missing a field", async () => {
    const { result, published } = await read([
      [
        "",
        "not json",
        '{"type":"heartbeat"}',
        '{"type":"analysis","content":"x","provider":"gemini"}',
        '{"type":"suggestion","data":{"name":"Swan Song","reason":"r","category":"protection","priority":"urgent"}}',
        '{"type":"removal","data":{"name":"Opt"}}',
        '{"type":"error"}',
        DONE,
        "",
      ].join("\n"),
    ]);

    expect(published).toEqual([]);
    expect(result).toEqual({
      analysis: "",
      provider: "mock",
      suggestions: [],
      removals: [],
    });
  });

  it("rejects with the error event's message after publishing what came before it", async () => {
    const published: number[] = [];

    await expect(
      processStream(
        readerOf([
          `${ANALYSIS}\n${SWAN_SONG}\n{"type":"error","message":"AI suggestion failed"}\n`,
        ]),
        (acc) => published.push(acc.suggestions.length)
      )
    ).rejects.toThrow("AI suggestion failed");
    expect(published).toEqual([0, 1]);
  });

  it("applies a last event that has no line break after it and publishes it", async () => {
    const { result, published } = await read([`${ANALYSIS}\n${OPT_REMOVAL}`]);

    expect(result.analysis).toBe("Short on protection.");
    expect(result.removals).toEqual([
      { name: "Opt", reason: "Weakest cantrip." },
    ]);
    expect(published).toHaveLength(2);
  });

  it("decodes a multi-byte character split across the last two reads of a final line without a line break", async () => {
    const line = new TextEncoder().encode(
      '{"type":"removal","data":{"name":"Lim-Dûl\'s Vault","reason":"Slow."}}'
    );
    // "û" is two bytes in UTF-8; cut between them, and end the stream there.
    const cut = line.indexOf(0xc3) + 1;

    const { result } = await read([line.slice(0, cut), line.slice(cut)]);

    expect(result.removals).toEqual([
      { name: "Lim-Dûl's Vault", reason: "Slow." },
    ]);
  });

  it("ignores an incomplete JSON tail and keeps the events applied before it", async () => {
    const { result, published } = await read([
      `${ANALYSIS}\n${SWAN_SONG}\n{"type":"removal","data":{"name":"Op`,
    ]);

    expect(published).toHaveLength(2);
    expect(result.analysis).toBe("Short on protection.");
    expect(result.suggestions).toHaveLength(1);
    expect(result.removals).toEqual([]);
  });
});
