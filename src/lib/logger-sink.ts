/**
 * The contract between the logger facade and its structured sink.
 *
 * `logger.ts` ships to the browser and must stay free of Node-only code, while
 * the production server writes JSON lines through Pino (`logger-json-sink.ts`).
 * Both sides need the payload shape and the sink's method set, so they live
 * here, in a module that imports nothing: the facade can import it statically
 * from any runtime, and the sink can implement it without a cycle back into
 * the facade.
 *
 * @module logger-sink
 */

/** Everything that rides alongside `level` / `time` / `msg` on a JSON line. */
export interface LogPayload {
  readonly context?: string;
  readonly meta?: readonly unknown[];
  readonly err?: Error;
}

/**
 * What the facade asks of a structured sink: one method per level it emits,
 * taking the payload first and the message second, as Pino does.
 *
 * Pino's `Logger` satisfies this shape directly; a test may hand the facade a
 * recording sink instead.
 */
export interface LogSink {
  readonly info: (payload: LogPayload, message: string) => void;
  readonly warn: (payload: LogPayload, message: string) => void;
  readonly error: (payload: LogPayload, message: string) => void;
}

/**
 * Builds the structured payload for one log event.
 *
 * Keys with nothing to say are omitted rather than emitted empty, and an
 * `Error` promoted to `err` (the key Pino's serialiser reads stacks from) is
 * removed from `meta` so it is not serialised twice.
 *
 * @param context - originating route or function, e.g. `"GET /api/decks"`
 * @param meta - extra values passed by the call site
 * @param err - the error being reported, if any
 * @returns the payload object, possibly empty
 */
export function toLogPayload(
  context: string | undefined,
  meta: readonly unknown[],
  err?: Error
): LogPayload {
  const rest = err === undefined ? meta : meta.filter((value) => value !== err);
  return {
    ...(context !== undefined && { context }),
    ...(rest.length > 0 && { meta: rest }),
    ...(err !== undefined && { err }),
  };
}
