/**
 * A string order that is the same on every machine, for hashes, version
 * tokens and comparisons that must not drift.
 *
 * `localeCompare` follows the runtime's locale and its ICU data, so a server
 * and a browser, or two Node.js builds, may order the same strings
 * differently, and a token hashed from that order would differ between them.
 * This order compares UTF-16 code units, as `Array.prototype.sort` does with no
 * comparator, and depends on nothing in the environment. Keep `localeCompare`
 * for text a person reads.
 *
 * @module text/code-unit-order
 */

/**
 * Compares two strings by their UTF-16 code units.
 *
 * @param left - the first string
 * @param right - the second string
 * @returns a negative number when `left` comes first, a positive number when
 *   `right` does, and zero when the strings are equal
 */
export function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
