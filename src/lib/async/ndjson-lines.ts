/**
 * Line reader for a streamed NDJSON body.
 *
 * Shared by the suggestion and deck-build stream readers so both split lines,
 * join a line cut across reads and flush the tail the same way.
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
