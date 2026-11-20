/**
 * The cards a list gained and the cards it lost, one copy at a time (I-104).
 *
 * Format-rules context, domain layer. Swap counting, the money delta and the
 * pool rule all start from this diff, so a card is not priced and counted as
 * a swap by two different readings of "added".
 * Not responsible for: whether a change is allowed (`league-allowance.ts`).
 *
 * @module format-rules/league-list-diff
 */

import type { LeagueListCard } from "./league-allowance-types";

/** One copy that left or arrived. */
export interface CopyLine {
  readonly name: string;
  readonly basic: boolean;
  readonly commander: boolean;
}

interface TalliedCard extends CopyLine {
  readonly count: number;
}

/**
 * Copies whose count rose go to `in`; copies whose count fell go to `out`.
 * A commander and a deck card of the same name are different copies. Both
 * arrays are sorted by name.
 *
 * @param previous - the list before the change
 * @param next - the list after the change
 */
export function changedCopies(
  previous: readonly LeagueListCard[],
  next: readonly LeagueListCard[]
): { readonly out: readonly CopyLine[]; readonly in: readonly CopyLine[] } {
  const before = tally(previous);
  const after = tally(next);
  const out: CopyLine[] = [];
  const incoming: CopyLine[] = [];
  const buckets = { out, in: incoming };
  for (const key of new Set<string>([...before.keys(), ...after.keys()])) {
    pushChanged(buckets, before.get(key), after.get(key));
  }
  const byName = (left: CopyLine, right: CopyLine) =>
    left.name.localeCompare(right.name, "en");
  buckets.out.sort(byName);
  buckets.in.sort(byName);
  return buckets;
}

/** The first occurrence of each name, in English alphabetical order. */
export function uniqueNames(names: readonly string[]): readonly string[] {
  return [...new Set(names)].sort((left, right) =>
    left.localeCompare(right, "en")
  );
}

function pushChanged(
  buckets: { out: CopyLine[]; in: CopyLine[] },
  left: TalliedCard | undefined,
  right: TalliedCard | undefined
): void {
  const sample = left ?? right;
  if (sample === undefined) return;
  const line: CopyLine = {
    name: sample.name,
    basic: sample.basic,
    commander: sample.commander,
  };
  const removed = (left?.count ?? 0) - (right?.count ?? 0);
  const added = (right?.count ?? 0) - (left?.count ?? 0);
  for (let index = 0; index < removed; index += 1) buckets.out.push(line);
  for (let index = 0; index < added; index += 1) buckets.in.push(line);
}

function tally(cards: readonly LeagueListCard[]): Map<string, TalliedCard> {
  const totals = new Map<string, TalliedCard>();
  for (const card of cards) {
    if (card.count <= 0) continue;
    const commander = card.commander === true;
    const key = `${commander ? "1" : "0"}\u0000${card.name}`;
    const current = totals.get(key);
    totals.set(key, {
      name: card.name,
      basic: (current?.basic ?? false) || card.basic === true,
      commander,
      count: (current?.count ?? 0) + card.count,
    });
  }
  return totals;
}
