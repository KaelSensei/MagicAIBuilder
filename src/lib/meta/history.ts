/**
 * Meta shifts over time — differencing two EDHRec snapshots of one commander.
 *
 * `MetaCache` holds a single row per (commander, source) and overwrites it on
 * every refresh, so the previous distribution was destroyed the moment a newer
 * one arrived. `MetaSnapshot` retains one row per commander per day instead;
 * this module turns a series of them into a readable "what moved" report.
 *
 * **The list is truncated, and that governs the whole design.** EDHRec is read
 * through `collectMetaCardsFromEdhrecLists`, which stops at 20 cards. A card
 * missing from a snapshot is therefore *not* a card at 0% inclusion — it is a
 * card below that snapshot's cut-off, at an inclusion nobody recorded. Reporting
 * it as a fall from 78% to zero would invent a collapse out of a ranking change.
 * So an appearance and a disappearance are their own variants, carrying a
 * **bound** rather than a delta: a card that entered rose by *at least*
 * `current - cutoff(baseline)`, because its unseen baseline sat below that
 * cut-off. The bound is real arithmetic, not a guess, and it is what ranks
 * those variants against the exactly-measured ones.
 */

import type { MetaCard } from "./fetch";

/** Inclusion points below which a movement is noise rather than a shift. */
const STEADY_BAND = 0.01;

export interface MetaSnapshotInput {
  /** UTC midnight of the day the snapshot was captured. */
  readonly capturedOn: Date;
  readonly cards: readonly MetaCard[];
}

/**
 * One card's movement between two snapshots.
 *
 * `rose` / `fell` / `steady` carry an exact `delta`; the two variants where the
 * card is listed at only one end carry a bound instead, because the other end
 * was never recorded — see the module note on truncation.
 */
export type MeasuredShiftKind = "rose" | "fell" | "steady";

/**
 * Distributive on purpose: `MeasuredShift<"rose" | "fell" | "steady">` expands
 * to three separate union members, so `switch (shift.kind)` narrows each one
 * away and an exhaustive `never` guard actually reaches `never`. Written as a
 * single member with a union `kind`, it would not.
 */
type MeasuredShift<K extends MeasuredShiftKind> = K extends MeasuredShiftKind
  ? {
      readonly kind: K;
      readonly name: string;
      readonly baseline: number;
      readonly current: number;
      /** `current - baseline`, in inclusion points. */
      readonly delta: number;
    }
  : never;

export type MetaShift =
  | MeasuredShift<MeasuredShiftKind>
  | {
      readonly kind: "entered";
      readonly name: string;
      readonly current: number;
      /** Lower bound on the true rise: the baseline was below the cut-off. */
      readonly deltaAtLeast: number;
    }
  | {
      readonly kind: "left";
      readonly name: string;
      readonly baseline: number;
      /** Upper bound on the true fall, negative: the card is below the cut-off now. */
      readonly deltaAtMost: number;
    };

export interface MetaShiftReport {
  readonly baselineCapturedOn: Date;
  readonly currentCapturedOn: Date;
  /** Whole days between the two snapshots compared. */
  readonly spanDays: number;
  /** Every movement, most significant first. */
  readonly shifts: readonly MetaShift[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * UTC midnight of the day `date` falls in — the snapshot's identity.
 *
 * Truncating in UTC and not in the server's zone keeps a snapshot's day stable
 * across deploys and regions: a local-midnight key would move the boundary when
 * the runtime's zone changes, and two rows for one day would then compare a
 * commander against itself.
 */
export function toCaptureDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** The lowest inclusion a snapshot listed — the truncation cut-off. */
function cutoff(cards: readonly MetaCard[]): number {
  let lowest = Number.POSITIVE_INFINITY;
  for (const card of cards) {
    if (card.inclusion < lowest) lowest = card.inclusion;
  }
  return Number.isFinite(lowest) ? lowest : 0;
}

/** How far a shift moved, whatever variant it is — the ranking key. */
export function shiftMagnitude(shift: MetaShift): number {
  switch (shift.kind) {
    case "rose":
    case "fell":
    case "steady":
      return Math.abs(shift.delta);
    case "entered":
      return Math.abs(shift.deltaAtLeast);
    case "left":
      return Math.abs(shift.deltaAtMost);
    default: {
      const exhaustive: never = shift;
      return exhaustive;
    }
  }
}

function measuredKind(delta: number): MeasuredShiftKind {
  if (delta > STEADY_BAND) return "rose";
  if (delta < -STEADY_BAND) return "fell";
  return "steady";
}

function byInclusion(cards: readonly MetaCard[]): ReadonlyMap<string, number> {
  const index = new Map<string, number>();
  for (const card of cards) {
    // A duplicated name would otherwise let the later entry silently win.
    if (!index.has(card.name)) index.set(card.name, card.inclusion);
  }
  return index;
}

function diffSnapshots(
  baseline: MetaSnapshotInput,
  current: MetaSnapshotInput
): MetaShift[] {
  const before = byInclusion(baseline.cards);
  const after = byInclusion(current.cards);
  const baselineCutoff = cutoff(baseline.cards);
  const currentCutoff = cutoff(current.cards);
  const shifts: MetaShift[] = [];

  for (const [name, currentInclusion] of after) {
    const baselineInclusion = before.get(name);
    if (baselineInclusion === undefined) {
      shifts.push({
        kind: "entered",
        name,
        current: currentInclusion,
        deltaAtLeast: Math.max(0, currentInclusion - baselineCutoff),
      });
      continue;
    }
    const delta = currentInclusion - baselineInclusion;
    shifts.push({
      kind: measuredKind(delta),
      name,
      baseline: baselineInclusion,
      current: currentInclusion,
      delta,
    });
  }

  for (const [name, baselineInclusion] of before) {
    if (after.has(name)) continue;
    shifts.push({
      kind: "left",
      name,
      baseline: baselineInclusion,
      deltaAtMost: Math.min(0, currentCutoff - baselineInclusion),
    });
  }

  return shifts;
}

/**
 * Compare the newest snapshot against the oldest one inside `windowDays`.
 *
 * Returns `null` when there is nothing to compare — fewer than two snapshots,
 * or only one distinct day inside the window. A one-snapshot commander is the
 * normal state of a freshly recorded commander, not an error: history accrues
 * from ordinary traffic, so the first visit can only ever establish a baseline.
 *
 * The baseline is the *oldest* snapshot still inside the window rather than the
 * immediately preceding one, so the report answers "what moved over this
 * period" and not "what moved since the last visit" — a commander looked at
 * twice in one week would otherwise report a two-day window as if it were the
 * whole one.
 *
 * @param snapshots - any order; only `capturedOn` and `cards` are read
 * @param windowDays - how far back the baseline may sit, counted from the newest snapshot
 */
export function computeMetaShifts(
  snapshots: readonly MetaSnapshotInput[],
  windowDays: number
): MetaShiftReport | null {
  if (snapshots.length < 2 || windowDays <= 0) return null;

  const ordered = [...snapshots].toSorted(
    (a, b) => a.capturedOn.getTime() - b.capturedOn.getTime()
  );
  const current = ordered[ordered.length - 1];
  const earliestAllowed = current.capturedOn.getTime() - windowDays * MS_PER_DAY;
  const baseline = ordered.find(
    (snapshot) => snapshot.capturedOn.getTime() >= earliestAllowed
  );

  if (!baseline || baseline.capturedOn.getTime() >= current.capturedOn.getTime()) {
    return null;
  }

  const shifts = diffSnapshots(baseline, current).toSorted(
    (a, b) => shiftMagnitude(b) - shiftMagnitude(a) || a.name.localeCompare(b.name)
  );

  return {
    baselineCapturedOn: baseline.capturedOn,
    currentCapturedOn: current.capturedOn,
    spanDays: Math.round(
      (current.capturedOn.getTime() - baseline.capturedOn.getTime()) / MS_PER_DAY
    ),
    shifts,
  };
}
