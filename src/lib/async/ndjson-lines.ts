/**
 * Reader for a streamed NDJSON body: its lines, and the events they carry.
 *
 * Shared by the suggestion and deck-build stream readers so both split lines,
 * join a line cut across reads, flush the tail and drop a line they cannot
 * trust the same way. Each reader brings its own event guard; this module
 * knows nothing of either event set.
 */

/**
 * Yields the lines of a streamed body one at a time, without their `\n`.
 *
 * A line cut across two reads is joined before it is yielded, including a
 * multi-byte UTF-8 character cut between reads. When the body ends, the
 * decoder is flushed and the remaining text is yielded as the last line, so an
 * event that a server, proxy or relay ends without `\n` is not lost. A trailing
 * `\n` yields nothing extra. Leaving the loop early stops the reads.
 *
 * @param reader - body reader of an `application/x-ndjson` response
 * @returns each line in order, blank lines included
 */
export async function* readNdjsonLines(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<string, void, undefined> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    yield* lines;
  }

  // Flush: a multi-byte character whose last byte never arrives, or the tail
  // of a stream that ended without a line break.
  buffer += decoder.decode();
  if (buffer) yield buffer;
}

/**
 * Yields the events of a streamed body that `isEvent` accepts, in order.
 *
 * Each line is trimmed and parsed as JSON. A blank line, a line that is not
 * JSON (an incomplete tail included) and a value the guard refuses are
 * skipped, never thrown: the server's own error event is how a stream reports
 * failure, and a single unreadable line must not discard the events around
 * it. Line handling is {@link readNdjsonLines}'s, so a last event without
 * `\n` is still read and leaving the loop early stops the reads.
 *
 * @param reader - body reader of an `application/x-ndjson` response
 * @param isEvent - guard for one parsed line; it must check every field the
 *   caller reads, since nothing else validates the server's payload
 * @returns each accepted event in order
 */
export async function* readNdjsonEvents<Event>(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  isEvent: (value: unknown) => value is Event
): AsyncGenerator<Event, void, undefined> {
  for await (const line of readNdjsonLines(reader)) {
    const value = parseJsonLine(line);
    if (isEvent(value)) yield value;
  }
}

/**
 * Parses one NDJSON line.
 *
 * @param line - one line of the body, possibly blank or invalid
 * @returns the parsed value, or `undefined` when the line is blank or not JSON
 */
function parseJsonLine(line: string): unknown {
  const trimmed = line.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}
