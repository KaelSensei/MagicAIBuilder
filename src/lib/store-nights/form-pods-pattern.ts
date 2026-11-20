/**
 * The size pattern for a pool where every player is the same bracket and no
 * pair has already shared a table. Spread and repeat pairs cannot change the
 * result, so the most players, then the most tables of four, then the store's
 * uneven size, decide it.
 *
 * @module store-nights/form-pods-pattern
 */

import {
  pairKey,
  podFromBlocks,
  type Block,
  type SeatedPod,
} from "./form-pods-blocks";
import type { PodPolicy } from "./form-pods-types";

interface PatternContext {
  readonly policy: PodPolicy;
  readonly repeats: ReadonlySet<string>;
  readonly allowed: ReadonlySet<number>;
}

interface Pattern {
  readonly fours: number;
  readonly preferred: number;
  readonly sizes: readonly number[];
}

/**
 * The pods for a uniform fresh pool, or null when the pool is mixed or a pair
 * has already sat together. Null tells the caller to search.
 *
 * @param blocks - one pool, already free of invalid groups
 * @param context - sizes, the uneven preference, and pairs from earlier rounds
 */
export function seatByPattern(
  blocks: readonly Block[],
  context: PatternContext
): {
  readonly pods: readonly SeatedPod[];
  readonly waiting: readonly Block[];
} | null {
  if (!uniformAndFresh(blocks, context)) return null;
  const pattern = bestPattern(blocks.length, context);
  const pods: SeatedPod[] = [];
  let cursor = 0;
  for (const size of pattern) {
    pods.push(podFromBlocks(blocks.slice(cursor, cursor + size)));
    cursor += size;
  }
  return { pods, waiting: blocks.slice(cursor) };
}

function uniformAndFresh(
  blocks: readonly Block[],
  context: PatternContext
): boolean {
  const bracket = blocks[0]?.minBracket;
  if (bracket === undefined) return false;
  if (blocks.some((block) => block.size !== 1 || block.minBracket !== bracket))
    return false;
  return !hasRepeat(blocks, context.repeats);
}

function hasRepeat(
  blocks: readonly Block[],
  repeats: ReadonlySet<string>
): boolean {
  const ids = blocks.flatMap((block) => block.entries.map((entry) => entry.id));
  for (let left = 0; left < ids.length; left += 1) {
    for (let right = left + 1; right < ids.length; right += 1) {
      const key = pairKey(ids[left], ids[right]);
      if (key !== null && repeats.has(key)) return true;
    }
  }
  return false;
}

function bestPattern(
  count: number,
  context: PatternContext
): readonly number[] {
  const best: Array<Pattern | undefined> = [];
  best[0] = { fours: 0, preferred: 0, sizes: [] };
  for (let seated = 0; seated <= count; seated += 1) {
    const current = best[seated];
    if (current === undefined) continue;
    for (const size of context.allowed) {
      extendPattern({
        best,
        current,
        seated,
        size,
        uneven: context.policy.unevenSize,
        count,
      });
    }
  }
  return choosePattern(best);
}

interface PatternStep {
  readonly best: Array<Pattern | undefined>;
  readonly current: Pattern;
  readonly seated: number;
  readonly size: number;
  readonly uneven: number;
  readonly count: number;
}

function extendPattern(step: PatternStep): void {
  const next = step.seated + step.size;
  if (next > step.count) return;
  const candidate: Pattern = {
    fours: step.current.fours + (step.size === 4 ? 1 : 0),
    preferred: step.current.preferred + (step.size === step.uneven ? 1 : 0),
    sizes: [...step.current.sizes, step.size],
  };
  const existing = step.best[next];
  if (
    existing === undefined ||
    candidate.fours > existing.fours ||
    (candidate.fours === existing.fours &&
      candidate.preferred > existing.preferred)
  ) {
    step.best[next] = candidate;
  }
}

function choosePattern(
  best: ReadonlyArray<Pattern | undefined>
): readonly number[] {
  let sizes: readonly number[] = [];
  let seated = -1;
  let fours = -1;
  let preferred = -1;
  for (let index = 0; index < best.length; index += 1) {
    const pattern = best[index];
    if (pattern === undefined) continue;
    const improved =
      index > seated ||
      (index === seated &&
        (pattern.fours > fours ||
          (pattern.fours === fours && pattern.preferred > preferred)));
    if (!improved) continue;
    sizes = pattern.sizes;
    seated = index;
    fours = pattern.fours;
    preferred = pattern.preferred;
  }
  return sizes;
}
