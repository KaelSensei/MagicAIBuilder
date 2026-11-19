/**
 * The cleaning every player-typed deck or snapshot name gets before it is
 * stored.
 *
 * Deck-building context, pure domain rule (master plan DB-01, server audit
 * S3.5). Callers: `POST /api/decks` (deck names) and the snapshot use cases
 * in `snapshot-use-cases.ts` (snapshot names). Deck import keeps its own
 * stricter `sanitizeName` in `import.ts`, which also drops control
 * characters.
 *
 * @module deck/display-name
 */

/**
 * An HTML tag of at most 200 characters. The bounded quantifier keeps the
 * match linear on hostile input (no ReDoS); a longer "tag" is left as text.
 */
const HTML_TAG = /<[^>]{0,200}>/g;

/**
 * Cleans a name a player typed: strips HTML tags, trims the ends, then cuts
 * the result to `maxLength` characters.
 *
 * The cut comes after the trim, as both routes did before this rule was
 * shared, so a cut can leave a trailing space. An empty result means the
 * name held nothing but tags and spaces; the caller refuses it.
 *
 * @param raw - The name as submitted.
 * @param maxLength - The longest name the caller stores, in UTF-16 units.
 * @returns The cleaned name, possibly empty.
 */
export function sanitizeDisplayName(raw: string, maxLength: number): string {
  return raw.replaceAll(HTML_TAG, "").trim().slice(0, maxLength);
}
