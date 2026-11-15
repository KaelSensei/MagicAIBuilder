/**
 * The production server's structured sink: one JSON line per event via Pino.
 *
 * This is the only module of the logger that imports `pino`, a Node library.
 * `logger.ts` loads it through a `require` that runs only on the Node runtime
 * of a production build, so a browser bundle never resolves this file. Keep
 * it that way: a static import of this module from a shared or client module
 * would put pino back into every client chunk.
 *
 * The line carries `level` (as its label), `time` (ISO 8601), `msg`, and the
 * `LogPayload` keys: `context`, `meta` and `err` with a serialised stack. This
 * is what makes Vercel logs searchable after the fact; a console `printf` line
 * is not.
 *
 * @module logger-json-sink
 */

import pino, { type DestinationStream } from "pino";
import type { LogSink } from "./logger-sink";

/**
 * Creates the JSON sink.
 *
 * @param destination - where lines go; defaults to Pino's own stdout stream, as
 *   the server wants. Tests pass a recording destination to read the lines back.
 * @returns a sink whose three methods each write one JSON line
 */
export function createJsonSink(destination?: DestinationStream): LogSink {
  return pino(
    {
      timestamp: pino.stdTimeFunctions.isoTime,
      // pid/hostname say nothing on serverless — every invocation differs.
      base: undefined,
      formatters: { level: (label) => ({ level: label }) },
      serializers: { err: pino.stdSerializers.err },
    },
    destination
  );
}
