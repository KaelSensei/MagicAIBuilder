/**
 * Stable, case-insensitive ordering of card names for user-facing lists.
 *
 * The bracket report names cards (Game Changers, off-identity cards) and must
 * read the same whatever order the deck rows arrive in.
 *
 * @module deck/sorted-unique-names
 */

/**
 * Deduplicate names and order them case-insensitively, with a case-sensitive tiebreak.
 * @param names - Card names; several printings of one card may repeat a name.
 * @returns Each name once, independent of input order.
 */
export function sortedUniqueNames(names: Iterable<string>): string[] {
  return [...new Set(names)].toSorted(
    (left, right) =>
      left.localeCompare(right, "en", { sensitivity: "base" }) ||
      left.localeCompare(right)
  );
}
