/**
 * The entries, policy and report of `formPods` (I-41 slice 1).
 *
 * A night forms pods. It has no standings, points or results. The effective
 * bracket is already on the entry: `pairingBasis` records whether that bracket
 * was the player's declaration or the higher of declaration and estimate, and
 * this check does not recompute it.
 *
 * @module store-nights/form-pods-types
 */

/** A Commander bracket, 1 through 5. */
export type Bracket = 1 | 2 | 3 | 4 | 5;

/** One checked-in player. A play-together group is never split across pods. */
export interface PodEntry {
  readonly id: string;
  /** The bracket the policy already resolved. */
  readonly bracket: Bracket;
  /** Players who must sit together, such as a Two-Headed Giant team. */
  readonly playTogetherGroup?: string;
}

/** Which uneven table a store prefers after it has made as many tables of four as it can. */
export type UnevenPodSize = 3 | 5;

/**
 * How the entry's bracket was chosen. The check reads `PodEntry.bracket` and
 * does not recompute it, so changing only this field does not move anyone.
 */
export type PairingBasis = "declared" | "higherOfBoth";

/** The night's pairing rules. The same policy and entries always give the same pods. */
export interface PodPolicy {
  /** Pod sizes the store allows. The usual set is 3, 4 and 5; 2 is optional. */
  readonly allowedSizes: readonly number[];
  /** Used when two seatings have the same number of tables of four. */
  readonly unevenSize: UnevenPodSize;
  /** Highest bracket minus lowest bracket allowed inside one pod. */
  readonly maxBracketSpread: number;
  /** Brackets that never share a table with a different bracket. */
  readonly dedicatedBrackets: readonly Bracket[];
  readonly pairingBasis: PairingBasis;
  /** With `round`, breaks a tie the same way on every machine. */
  readonly nightId: string;
  readonly round: number;
}

/** A pod from earlier in the night. Pairs from it are avoided when the scores tie on spread. */
export interface PriorPod {
  readonly entryIds: readonly string[];
}

/** Why a checked-in player has no seat. */
export type WaitingReason =
  | "below-smallest-pod"
  | "bracket-spread"
  | "dedicated-bracket"
  | "play-together-group";

/** One table. `entryIds` are sorted, and `spread` is the highest bracket minus the lowest. */
export interface FormedPod {
  readonly entryIds: readonly string[];
  readonly spread: number;
}

/** A player left out, with the reason an organiser can read. */
export interface WaitingEntry {
  readonly entryId: string;
  readonly reason: WaitingReason;
}

/** The pods and the waiting list for one round. */
export interface FormedNight {
  readonly pods: readonly FormedPod[];
  readonly waiting: readonly WaitingEntry[];
}
