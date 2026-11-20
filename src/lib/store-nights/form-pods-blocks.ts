/**
 * Players who must be seated together, and the pairs who already shared a table.
 *
 * Store nights. A play-together group, including a Two-Headed Giant team, is one
 * block: the search never splits it. A block that cannot legally be one pod
 * waits as a whole.
 *
 * @module store-nights/form-pods-blocks
 */

import type {
  Bracket,
  PodEntry,
  PodPolicy,
  PriorPod,
  WaitingReason,
} from "./form-pods-types";

/** One unsplittable set of players. */
export interface Block {
  readonly id: number;
  readonly entries: readonly PodEntry[];
  readonly size: number;
  readonly minBracket: number;
  readonly maxBracket: number;
  /** Set when the block can never sit as part of a legal pod. */
  readonly invalid: WaitingReason | null;
}

/**
 * Groups play-together entries into blocks and leaves everyone else alone.
 * Blocks are ordered by their lowest id.
 *
 * @param entries - the players still to be seated this round
 * @param policy - sizes, spread and dedicated brackets that can make a block unseatable
 */
export function buildBlocks(
  entries: readonly PodEntry[],
  policy: PodPolicy
): readonly Block[] {
  const grouped = new Map<string, PodEntry[]>();
  const alone: PodEntry[] = [];
  for (const entry of entries) {
    const group = entry.playTogetherGroup;
    if (group === undefined) {
      alone.push(entry);
      continue;
    }
    const members = grouped.get(group);
    if (members === undefined) grouped.set(group, [entry]);
    else members.push(entry);
  }
  const blocks = [
    ...alone.map((entry) => toBlock([entry], policy)),
    ...[...grouped.values()].map((members) => toBlock(members, policy)),
  ];
  return blocks
    .map((block, index) => ({ ...block, id: index }))
    .sort((left, right) => lowestId(left).localeCompare(lowestId(right), "en"));
}

/** Unordered pairs that already shared a pod, keyed for a set lookup. */
export function repeatPairs(
  priorPods: readonly PriorPod[]
): ReadonlySet<string> {
  const pairs = new Set<string>();
  for (const pod of priorPods) addPodPairs(pairs, pod.entryIds);
  return pairs;
}

function addPodPairs(pairs: Set<string>, entryIds: readonly string[]): void {
  const ids = [...entryIds].sort((left, right) =>
    left.localeCompare(right, "en")
  );
  for (let left = 0; left < ids.length; left += 1) {
    for (let right = left + 1; right < ids.length; right += 1) {
      const key = pairKey(ids[left], ids[right]);
      if (key !== null) pairs.add(key);
    }
  }
}

/**
 * The key of an unordered pair. Null when either id is missing, which a sparse
 * read can produce; a real id pair is never null.
 */
export function pairKey(
  left: string | undefined,
  right: string | undefined
): string | null {
  if (left === undefined || right === undefined) return null;
  if (left.localeCompare(right, "en") <= 0) return `${left}\u0000${right}`;
  return `${right}\u0000${left}`;
}

function toBlock(entries: readonly PodEntry[], policy: PodPolicy): Block {
  const ordered = [...entries].sort((left, right) =>
    left.id.localeCompare(right.id, "en")
  );
  let minBracket = ordered[0]?.bracket ?? 1;
  let maxBracket = minBracket;
  for (const entry of ordered) {
    minBracket = Math.min(minBracket, entry.bracket);
    maxBracket = Math.max(maxBracket, entry.bracket);
  }
  return {
    id: 0,
    entries: ordered,
    size: ordered.length,
    minBracket,
    maxBracket,
    invalid: blockProblem(ordered, policy),
  };
}

function blockProblem(
  entries: readonly PodEntry[],
  policy: PodPolicy
): WaitingReason | null {
  let minBracket = entries[0]?.bracket ?? 1;
  let maxBracket = minBracket;
  for (const entry of entries) {
    minBracket = Math.min(minBracket, entry.bracket);
    maxBracket = Math.max(maxBracket, entry.bracket);
  }
  const maxSize = policy.allowedSizes.reduce(
    (max, size) => Math.max(max, size),
    0
  );
  if (entries.length > maxSize) return "play-together-group";
  if (maxBracket - minBracket > policy.maxBracketSpread)
    return "bracket-spread";
  if (mixesDedicated(entries, policy.dedicatedBrackets))
    return "dedicated-bracket";
  return null;
}

function mixesDedicated(
  entries: readonly PodEntry[],
  dedicated: readonly Bracket[]
): boolean {
  const first = entries[0];
  if (first === undefined) return false;
  const mixed = entries.some((entry) => entry.bracket !== first.bracket);
  if (!mixed) return false;
  return entries.some((entry) =>
    dedicated.some((bracket) => bracket === entry.bracket)
  );
}

function lowestId(block: Block): string {
  return block.entries[0]?.id ?? "";
}

/** A table made of blocks: sorted ids and the bracket spread. */
export interface SeatedPod {
  readonly entryIds: readonly string[];
  readonly spread: number;
  readonly size: number;
  readonly minBracket: number;
  readonly maxBracket: number;
}

/** A table made of blocks. */
export function podFromBlocks(blocks: readonly Block[]): SeatedPod {
  let minBracket = blocks[0]?.minBracket ?? 0;
  let maxBracket = blocks[0]?.maxBracket ?? 0;
  const ids: string[] = [];
  for (const block of blocks) {
    minBracket = Math.min(minBracket, block.minBracket);
    maxBracket = Math.max(maxBracket, block.maxBracket);
    for (const entry of block.entries) ids.push(entry.id);
  }
  ids.sort((left, right) => left.localeCompare(right, "en"));
  return {
    entryIds: ids,
    spread: maxBracket - minBracket,
    size: ids.length,
    minBracket,
    maxBracket,
  };
}
