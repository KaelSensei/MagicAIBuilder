/**
 * Meta shifts over time: differencing two EDHREC snapshots of one commander.
 *
 * Meta-insights context, `domain/`: pure functions over readonly data, with
 * no I/O (ADR 0003). `infrastructure/snapshots.ts` reads and writes the
 * snapshots, the history route calls {@link computeMetaShifts} on them, and
 * the panel's shift rows and the trends view render the result.
 *
 * `MetaCache` holds a single row per (commander, source) and overwrites it on
 * every refresh, so the previous distribution was destroyed the moment a newer
 * one arrived. `MetaSnapshot` retains one row per commander per day instead;
 * this module turns a series of them into a readable "what moved" report.
 *
 * **The list is truncated, and that governs the whole design.** The EDHREC
 * adapter (`infrastructure/edhrec.ts`) keeps the top 20 cards. A card
 * missing from a snapshot is therefore *not* a card at 0% inclusion — it is a
 * card below that snapshot's cut-off, at an inclusion nobody recorded. Reporting
 * it as a fall from 78% to zero would invent a collapse out of a ranking change.
 * So an appearance and a disappearance are their own variants, carrying a
 * **bound** rather than a delta: a card that entered rose by *at least*
 * `current - cutoff(baseline)` when the baseline fills the top 20. A shorter
 * list has no exclusion cut-off, so its missing-card bound is zero. The bound
 * is real arithmetic, not a guess, and it is what ranks
 * those variants against the exactly-measured ones.
 *
 * @module meta-insights/domain/history
 */

import type { MetaCard } from "./types";

/** Inclusion points below which a movement is noise rather than a shift. */
const STEADY_BAND = 0.01;

/** Only a full top-20 list establishes an exclusion cut-off. */
const META_TOP_LIMIT = 20;

/** One day's EDHREC list for a commander, as `readSnapshotHistory` hands it over. */
export interface MetaSnapshotInput {
  /** UTC midnight of the day the snapshot was captured. */
  readonly capturedOn: Date;
  /** The list as recorded: at most the top 20, possibly fewer, never a card at 0 %. */
  readonly cards: readonly MetaCard[];
}

/** The kinds of movement measured exactly, a card being listed at both ends. */
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

/**
 * One card's movement between two snapshots.
 *
 * `rose`, `fell` and `steady` carry an exact `delta`; `entered` and `left`,
 * where the card is listed at only one end, carry a bound instead, because
 * the other end was never recorded (see the module note on truncation). A
 * `steady` movement is within {@link STEADY_BAND} of zero.
 */
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

/** What moved between the oldest usable snapshot of the window and the newest one. */
export interface MetaShiftReport {
  /** The baseline's day: the oldest non-empty snapshot inside the window. */
  readonly baselineCapturedOn: Date;
  /** The newest snapshot's day. */
  readonly currentCapturedOn: Date;
  /** Whole days between the two snapshots compared. */
  readonly spanDays: number;
  /** Every movement, most significant first. */
  readonly shifts: readonly MetaShift[];
}

/** How confidently the view can describe one top-20 movement. */
export type MetaTrendCertainty = "exact" | "at-least" | "at-most";

/** A trend row suitable for rendering without inventing an unobserved value. */
export interface MetaTrendViewRow {
  readonly name: string;
  readonly certainty: MetaTrendCertainty;
  /** Absolute movement in inclusion points, exact or bounded by `certainty`. */
  readonly magnitude: number;
}

/**
 * A rendering model for EDHREC trend data.
 *
 * The source publishes only a top-20 list. Entries and exits therefore cannot
 * report exact movement: the card was present below the unobserved cut-off, not
 * necessarily absent. Consumers render `certainty` alongside `magnitude`.
 */
export interface MetaTrendView {
  readonly sourceLimit: number;
  readonly uncertainty: string;
  readonly rows: readonly MetaTrendViewRow[];
}

const TOP_TWENTY_UNCERTAINTY =
  "EDHREC only publishes the top 20 cards; entries and exits are bounds, not exact changes.";

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
function cutoff(inclusions: ReadonlyMap<string, number>): number {
  let lowest = Number.POSITIVE_INFINITY;
  for (const inclusion of inclusions.values()) {
    if (inclusion < lowest) lowest = inclusion;
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

/**
 * Builds an uncertainty-aware rendering model from a measured meta report.
 *
 * @param report - the comparison returned by {@link computeMetaShifts}
 * @returns rows that distinguish exact measurements from top-20 bounds, or null without evidence
 */
export function buildMetaTrendView(
  report: Pick<MetaShiftReport, "shifts"> | null
): MetaTrendView | null {
  if (!report) return null;

  const rows = report.shifts.map((shift): MetaTrendViewRow => {
    switch (shift.kind) {
      case "rose":
      case "fell":
      case "steady":
        return { name: shift.name, certainty: "exact", magnitude: Math.abs(shift.delta) };
      case "entered":
        return { name: shift.name, certainty: "at-least", magnitude: shift.deltaAtLeast };
      case "left":
        return { name: shift.name, certainty: "at-most", magnitude: Math.abs(shift.deltaAtMost) };
      default: {
        const exhaustive: never = shift;
        return exhaustive;
      }
    }
  });

  return { sourceLimit: META_TOP_LIMIT, uncertainty: TOP_TWENTY_UNCERTAINTY, rows };
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
  const baselineCutoff = before.size === META_TOP_LIMIT ? cutoff(before) : null;
  const currentCutoff = after.size === META_TOP_LIMIT ? cutoff(after) : null;
  const shifts: MetaShift[] = [];

  for (const [name, currentInclusion] of after) {
    const baselineInclusion = before.get(name);
    if (baselineInclusion === undefined) {
      shifts.push({
        kind: "entered",
        name,
        current: currentInclusion,
        deltaAtLeast: baselineCutoff === null ? 0 : Math.max(0, currentInclusion - baselineCutoff),
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
      deltaAtMost: currentCutoff === null ? 0 : Math.min(0, currentCutoff - baselineInclusion),
    });
  }

  return shifts;
}

/**
 * Compare the newest snapshot against the oldest one inside `windowDays`.
 *
 * Returns `null` when there is nothing to compare — fewer than two snapshots,
 * only one distinct day inside the window, an empty current snapshot, or no
 * non-empty baseline. An empty list has no measured cut-off and cannot
 * establish a trend bound.
 * A one-snapshot commander is the
 * normal state of a freshly recorded commander, not an error: history accrues
 * from ordinary traffic, so the first visit can only ever establish a baseline.
 *
 * The baseline is the *oldest non-empty* snapshot still inside the window rather than the
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
  const current = ordered.at(-1);
  if (!current) return null;
  const earliestAllowed = current.capturedOn.getTime() - windowDays * MS_PER_DAY;
  const baseline = ordered.find(
    (snapshot) => snapshot.capturedOn.getTime() >= earliestAllowed && snapshot.cards.length > 0
  );

  if (!baseline || baseline.capturedOn.getTime() >= current.capturedOn.getTime()) {
    return null;
  }

  if (current.cards.length === 0) return null;

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
