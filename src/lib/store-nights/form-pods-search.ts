/**
 * Choosing which blocks share a table.
 *
 * Store nights. Among legal seatings the order is: most players seated, then
 * the most tables of four, then the most tables of the store's uneven size,
 * then the smallest total bracket spread, then the fewest pairs who already
 * sat together, then a hash of the night, the round and the ids. A pool where
 * every player is the same bracket and nobody has sat together is decided by
 * the size pattern alone. Any other pool of at most twelve players is searched.
 * A larger mixed pool is filled from the lowest bracket upward; that fill is
 * deterministic and still legal, and it is not claimed to be the optimum.
 *
 * @module store-nights/form-pods-search
 */

import {
  pairKey,
  podFromBlocks,
  type Block,
  type SeatedPod,
} from "./form-pods-blocks";
import { seatByPattern } from "./form-pods-pattern";
import type { PodPolicy } from "./form-pods-types";

/** The pods and the blocks left over for one pool of players. */
export interface PoolSeating {
  readonly pods: readonly SeatedPod[];
  readonly waiting: readonly Block[];
}

interface SearchContext {
  readonly policy: PodPolicy;
  readonly repeats: ReadonlySet<string>;
  readonly allowed: ReadonlySet<number>;
}

interface Rated {
  readonly pods: readonly SeatedPod[];
  readonly waiting: readonly Block[];
  readonly seated: number;
  readonly fours: number;
  readonly preferred: number;
  readonly spread: number;
  readonly repeats: number;
  readonly tie: number;
}

const EXHAUSTIVE_LIMIT = 12;

/**
 * Seats one pool. Dedicated brackets are already split out by the caller.
 *
 * @param blocks - unsplittable groups that can legally sit somewhere
 * @param context - the policy, the pairs to avoid, and the allowed sizes
 */
export function seatPool(
  blocks: readonly Block[],
  context: SearchContext
): PoolSeating {
  if (blocks.length === 0) return { pods: [], waiting: [] };
  const patterned = seatByPattern(blocks, context);
  if (patterned !== null) return patterned;
  const rated =
    blocks.reduce((sum, block) => sum + block.size, 0) <= EXHAUSTIVE_LIMIT
      ? search(blocks, context)
      : fillInOrder(blocks, context);
  return { pods: rated.pods, waiting: rated.waiting };
}

/** The context `seatPool` reads. Built once per night by `formPods`. */
export function searchContext(
  policy: PodPolicy,
  repeats: ReadonlySet<string>
): SearchContext {
  return { policy, repeats, allowed: new Set(policy.allowedSizes) };
}

function search(blocks: readonly Block[], context: SearchContext): Rated {
  let best: Rated | null = null;
  const visit = (
    remaining: readonly Block[],
    pods: readonly SeatedPod[],
    waiting: readonly Block[]
  ): void => {
    const seated = pods.reduce((sum, pod) => sum + pod.size, 0);
    const rest = remaining.reduce((sum, block) => sum + block.size, 0);
    if (best !== null && seated + rest < best.seated) return;
    const first = remaining[0];
    if (first === undefined) {
      const candidate = rate(pods, waiting, context);
      if (best === null || better(candidate, best)) best = candidate;
      return;
    }
    const tail = remaining.slice(1);
    for (const choice of combinations(first, tail, context)) {
      const used = new Set(choice.map((block) => block.id));
      visit(
        tail.filter((block) => !used.has(block.id)),
        [...pods, podFromBlocks(choice)],
        waiting
      );
    }
    visit(tail, pods, [...waiting, first]);
  };
  visit(blocks, [], []);
  return best ?? rate([], blocks, context);
}

function fillInOrder(blocks: readonly Block[], context: SearchContext): Rated {
  const open = [...blocks].sort(
    (left, right) => left.minBracket - right.minBracket
  );
  const pods: SeatedPod[] = [];
  const waiting: Block[] = [];
  while (open.length > 0) {
    const first = open[0];
    if (first === undefined) break;
    const choice = pickFill(
      combinations(first, open.slice(1), context),
      context
    );
    if (choice === undefined) {
      waiting.push(first);
      open.shift();
      continue;
    }
    const used = new Set(choice.map((block) => block.id));
    pods.push(podFromBlocks(choice));
    for (let index = open.length - 1; index >= 0; index -= 1) {
      const block = open[index];
      if (block !== undefined && used.has(block.id)) open.splice(index, 1);
    }
  }
  return rate(pods, waiting, context);
}

function pickFill(
  choices: readonly (readonly Block[])[],
  context: SearchContext
): readonly Block[] | undefined {
  let best: readonly Block[] | undefined;
  let bestScore = -1;
  for (const choice of choices) {
    const size = choice.reduce((sum, block) => sum + block.size, 0);
    const score =
      (size === 4 ? 100 : 0) +
      (size === context.policy.unevenSize ? 10 : 0) +
      size;
    if (score > bestScore) {
      best = choice;
      bestScore = score;
    }
  }
  return best;
}

function combinations(
  first: Block,
  others: readonly Block[],
  context: SearchContext
): readonly (readonly Block[])[] {
  const found: Block[][] = [];
  const chosen: Block[] = [];
  const grow = (state: {
    start: number;
    size: number;
    low: number;
    high: number;
  }): void => {
    if (context.allowed.has(state.size)) found.push([first, ...chosen]);
    for (let index = state.start; index < others.length; index += 1) {
      const block = others[index];
      if (block === undefined) continue;
      const nextSize = state.size + block.size;
      if (nextSize > maxAllowed(context)) continue;
      const nextLow = Math.min(state.low, block.minBracket);
      const nextHigh = Math.max(state.high, block.maxBracket);
      if (nextHigh - nextLow > context.policy.maxBracketSpread) continue;
      chosen.push(block);
      grow({ start: index + 1, size: nextSize, low: nextLow, high: nextHigh });
      chosen.pop();
    }
  };
  grow({
    start: 0,
    size: first.size,
    low: first.minBracket,
    high: first.maxBracket,
  });
  return found;
}

function rate(
  pods: readonly SeatedPod[],
  waiting: readonly Block[],
  context: SearchContext
): Rated {
  let fours = 0;
  let preferred = 0;
  let spread = 0;
  let repeats = 0;
  let seated = 0;
  for (const pod of pods) {
    seated += pod.size;
    spread += pod.spread;
    if (pod.size === 4) fours += 1;
    if (pod.size === context.policy.unevenSize) preferred += 1;
    repeats += pairRepeats(pod.entryIds, context.repeats);
  }
  return {
    pods,
    waiting,
    seated,
    fours,
    preferred,
    spread,
    repeats,
    tie: seatingHash(pods, context.policy),
  };
}

function pairRepeats(
  ids: readonly string[],
  repeats: ReadonlySet<string>
): number {
  let count = 0;
  for (let left = 0; left < ids.length; left += 1) {
    for (let right = left + 1; right < ids.length; right += 1) {
      const key = pairKey(ids[left], ids[right]);
      if (key !== null && repeats.has(key)) count += 1;
    }
  }
  return count;
}

function better(next: Rated, current: Rated): boolean {
  if (next.seated !== current.seated) return next.seated > current.seated;
  if (next.fours !== current.fours) return next.fours > current.fours;
  if (next.preferred !== current.preferred)
    return next.preferred > current.preferred;
  if (next.spread !== current.spread) return next.spread < current.spread;
  if (next.repeats !== current.repeats) return next.repeats < current.repeats;
  return next.tie < current.tie;
}

function seatingHash(pods: readonly SeatedPod[], policy: PodPolicy): number {
  const body = pods
    .map((pod) => pod.entryIds.join(","))
    .sort((left, right) => left.localeCompare(right, "en"))
    .join("|");
  let hash = 0x811c9dc5;
  const text = `${policy.nightId}:${policy.round}:${body}`;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function maxAllowed(context: SearchContext): number {
  let max = 0;
  for (const size of context.allowed) max = Math.max(max, size);
  return max;
}
