import { describe, it, expect } from "vitest";
import { createJsonSink } from "./logger-json-sink";
import { toLogPayload } from "./logger-sink";

/** `2026-11-13T07:10:00.000Z`: what `Date#toISOString` produces. */
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/** A Pino destination that keeps every written line in memory. */
function recordingDestination() {
  const lines: string[] = [];
  return {
    lines,
    write(line: string): void {
      lines.push(line);
    },
  };
}

/** @returns the parsed JSON objects of every line written so far */
function parsedLines(
  lines: readonly string[]
): readonly Record<string, unknown>[] {
  return lines.map((line): Record<string, unknown> => JSON.parse(line));
}

// These tests pin the line shape the production server emits today, which
// Vercel log search and alerts depend on: a key renamed here is a dashboard
// that stops matching.
describe("createJsonSink", () => {
  it("writes one JSON line per event with the level as a label, an ISO time, the message and the context", () => {
    const destination = recordingDestination();
    const sink = createJsonSink(destination);

    sink.info(toLogPayload("GET /api/decks", []), "listed decks");

    expect(destination.lines).toHaveLength(1);
    expect(destination.lines[0].endsWith("\n")).toBe(true);
    expect(parsedLines(destination.lines)[0]).toEqual({
      level: "info",
      time: expect.stringMatching(ISO_TIMESTAMP),
      msg: "listed decks",
      context: "GET /api/decks",
    });
  });

  it("keeps pid and hostname out of the line, since every serverless invocation differs", () => {
    const destination = recordingDestination();

    createJsonSink(destination).warn(
      toLogPayload(undefined, []),
      "rate limited"
    );

    const [line] = parsedLines(destination.lines);
    expect(line).not.toHaveProperty("pid");
    expect(line).not.toHaveProperty("hostname");
    expect(line.level).toBe("warn");
  });

  it("carries meta values under a searchable key", () => {
    const destination = recordingDestination();

    createJsonSink(destination).info(
      toLogPayload("addCard", [{ id: "abc" }, 3]),
      "card added"
    );

    expect(parsedLines(destination.lines)[0].meta).toEqual([{ id: "abc" }, 3]);
  });

  it("serialises the error under err with its type, message and stack", () => {
    const destination = recordingDestination();
    const cause = new Error("write conflict");

    createJsonSink(destination).error(
      toLogPayload("addCard", ["detail", cause], cause),
      "Unexpected error"
    );

    const [line] = parsedLines(destination.lines);
    expect(line.level).toBe("error");
    expect(line.msg).toBe("Unexpected error");
    expect(line.meta).toEqual(["detail"]);
    expect(line.err).toMatchObject({
      type: "Error",
      message: "write conflict",
      stack: expect.stringContaining("write conflict"),
    });
  });
});
