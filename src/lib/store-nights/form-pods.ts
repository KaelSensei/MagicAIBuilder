/**
 * Forms the pods for one round of a casual Commander night (I-41 slice 1).
 *
 * Store nights. `formPods` is pure: the same entries, policy and earlier pods
 * return the same tables, and it never calls `Math.random`. Sizes come first
 * (the most tables of four, then the store's uneven size), and a player who
 * fits no allowed size or no table within the bracket spread waits with a
 * reason. A dedicated bracket never shares a table. A play-together group,
 * including a Two-Headed Giant team, is never split (Wizards, 2025-06-20,
 * https://magic.wizards.com/en/news/announcements/commander-play-featuring-sealed-and-two-headed-giant).
 * Not responsible for: check-in, the store, or moving a player by hand.
 *
 * @module store-nights/form-pods
 */

import {
  buildBlocks,
  repeatPairs,
  type Block,
  type SeatedPod,
} from "./form-pods-blocks";
import { searchContext, seatPool } from "./form-pods-search";
import type {
  FormedNight,
  FormedPod,
  PodEntry,
  PodPolicy,
  PriorPod,
  WaitingReason,
} from "./form-pods-types";

export type {
  Bracket,
  FormedNight,
  FormedPod,
  PairingBasis,
  PodEntry,
  PodPolicy,
  PriorPod,
  UnevenPodSize,
  WaitingEntry,
  WaitingReason,
} from "./form-pods-types";

/**
 * Seats every entry in a legal pod or leaves them waiting with a reason.
 *
 * @param entries - players checked in for this round, each with an effective bracket
 * @param policy - allowed sizes, spread, dedicated brackets and the tie-break
 * @param priorPods - tables from earlier rounds of the same night; their pairs are avoided
 * @returns pods with sorted ids, and a waiting list sorted by id
 */
export function formPods(
  entries: readonly PodEntry[],
  policy: PodPolicy,
  priorPods: readonly PriorPod[]
): FormedNight {
  const blocks = buildBlocks(entries, policy);
  const context = searchContext(policy, repeatPairs(priorPods));
  const seated: SeatedPod[] = [];
  const waiting: Block[] = [];
  for (const pool of poolsOf(blocks, policy).values()) {
    const result = seatPool(pool, context);
    seated.push(...result.pods);
    waiting.push(...result.waiting);
  }
  for (const block of blocks) {
    if (block.invalid !== null) waiting.push(block);
  }
  return {
    pods: seated
      .map((pod) => ({ entryIds: pod.entryIds, spread: pod.spread }))
      .sort((left, right) => firstId(left).localeCompare(firstId(right), "en")),
    waiting: waiting
      .flatMap((block) =>
        block.entries.map((entry) => ({
          entryId: entry.id,
          reason: waitingReason(block, seated, policy),
        }))
      )
      .sort((left, right) => left.entryId.localeCompare(right.entryId, "en")),
  };
}

function poolsOf(
  blocks: readonly Block[],
  policy: PodPolicy
): Map<string, Block[]> {
  const pools = new Map<string, Block[]>();
  for (const block of blocks) {
    if (block.invalid !== null) continue;
    const key = poolKey(block, policy);
    const pool = pools.get(key);
    if (pool === undefined) pools.set(key, [block]);
    else pool.push(block);
  }
  return pools;
}

function poolKey(block: Block, policy: PodPolicy): string {
  if (
    block.minBracket === block.maxBracket &&
    policy.dedicatedBrackets.some((bracket) => bracket === block.minBracket)
  ) {
    return `dedicated:${block.minBracket}`;
  }
  return "open";
}

function waitingReason(
  block: Block,
  pods: readonly SeatedPod[],
  policy: PodPolicy
): WaitingReason {
  if (block.invalid !== null) return block.invalid;
  const blockedBySpread = pods.some((pod) => {
    const nextSize = pod.size + block.size;
    if (!policy.allowedSizes.includes(nextSize)) return false;
    const spread =
      Math.max(pod.maxBracket, block.maxBracket) -
      Math.min(pod.minBracket, block.minBracket);
    return spread > policy.maxBracketSpread;
  });
  if (blockedBySpread) return "bracket-spread";
  const smallest = policy.allowedSizes.reduce(
    (min, size) => Math.min(min, size),
    Number.POSITIVE_INFINITY
  );
  if (block.size < smallest) return "below-smallest-pod";
  return "bracket-spread";
}

function firstId(pod: FormedPod): string {
  return pod.entryIds[0] ?? "";
}
