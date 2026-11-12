/**
 * Type guards for untrusted values: parsed JSON bodies, `localStorage`
 * snapshots, provider payloads.
 *
 * Shared kernel: no business meaning, used by every context that reads data
 * it did not type itself. A guard here only narrows; the caller still checks
 * the fields it reads.
 * Not responsible for: schema validation, which Zod does at the API boundary
 * (`lib/validation/*`).
 *
 * @module guards
 */

/**
 * Whether a value is a plain keyed object: not null, not an array.
 *
 * Use it before reading named fields from an untrusted payload. A JSON array
 * is rejected, so a list never passes for a keyed payload.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Whether a value is any non-null object, arrays included.
 *
 * The lenient variant of {@link isRecord}, kept for the parsers that accepted
 * arrays before the guards were shared. Each of them then reads named fields,
 * which an array lacks, so an array still ends up refused or empty there, only
 * with a later error than a non-object gets. Prefer {@link isRecord} in new
 * code.
 */
export function isRecordOrArray(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Whether a value is a string of at least one character.
 *
 * Whitespace counts: `" "` passes. Trim first when a blank string must be
 * rejected.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
