/**
 * One active player's month of metered usage, from the U-values of I-66 requirement 3.2 (slice 1).
 *
 * Pure. Every input is an assumption until slice 2 measures it, and the monthly report then passes
 * measured values instead (6.7). The result is counted in each resource's billing unit, so the
 * cost model multiplies it by a rate and the limit table divides an allotment by it.
 *
 * Not responsible for: the price of a unit (`price-book`), the cost or the limits
 * (`cost-model`), measuring the inputs (slice 2).
 *
 * @module costs/player-usage
 */
import type { MeteredResource } from "./price-book";

/** The model's inputs: I-66's U-values plus two figures the spec takes from elsewhere. */
export interface UsageAssumptions {
  /** U1 sessions per active player a month */
  readonly sessionsPerPlayer: number;
  /** U2 page views per session */
  readonly pageViewsPerSession: number;
  /** U3 function calls per session */
  readonly functionCallsPerSession: number;
  /** U4 wall time per call, in seconds */
  readonly wallSecondsPerCall: number;
  /** U5 active CPU per call, in seconds */
  readonly activeCpuSecondsPerCall: number;
  /** U6 memory per function instance, in GB */
  readonly instanceMemoryGb: number;
  /** U7 response size per call, in KB */
  readonly responseKbPerCall: number;
  /** U8 static transfer per session, in MB */
  readonly staticMbPerSession: number;
  /** U9 static CDN requests per session */
  readonly staticRequestsPerSession: number;
  /** U10 Speed Insights events per page view */
  readonly speedInsightsEventsPerPageView: number;
  /** U11 print exports per active player a month */
  readonly printExportsPerPlayer: number;
  /** U11 card images in one print export; each is one call to the image proxy */
  readonly imagesPerPrintExport: number;
  /** One proxied card image, in KB: the `normal` JPEG measured at 110.6 KB on 2026-11-10 */
  readonly printImageKb: number;
  /** U12 database bytes per stored account, in MB; storage grows with stored accounts */
  readonly databaseMbPerStoredAccount: number;
  /** U13 database bytes read per call, in KB */
  readonly databaseReadKbPerCall: number;
  /** Share of sessions Sentry records as a replay (`replaysSessionSampleRate`) */
  readonly replaySessionSampleRate: number;
}

/** A month of usage for one active player, in each resource's billing unit. */
export type ResourceUsage = Readonly<Record<MeteredResource, number>>;

/**
 * I-66 3.2's assumed values, as written on 2026-11-10. The replay rate is the 1% the spec read in
 * `src/instrumentation-client.ts`; the code has since set it to 0, which slice 2 measures.
 */
export const ASSUMED_USAGE: UsageAssumptions = {
  sessionsPerPlayer: 8,
  pageViewsPerSession: 5,
  functionCallsPerSession: 40,
  wallSecondsPerCall: 0.25,
  activeCpuSecondsPerCall: 0.025,
  instanceMemoryGb: 2,
  responseKbPerCall: 15,
  staticMbPerSession: 0.5,
  staticRequestsPerSession: 25,
  speedInsightsEventsPerPageView: 1,
  printExportsPerPlayer: 0.25,
  imagesPerPrintExport: 100,
  printImageKb: 110.6,
  databaseMbPerStoredAccount: 0.36,
  databaseReadKbPerCall: 5,
  replaySessionSampleRate: 0.01,
};

const SECONDS_PER_HOUR = 3_600;
const KB_PER_GB = 1_000_000;
const MB_PER_GB = 1_000;

/**
 * One active player's month of usage under the given assumptions (I-66 3.3).
 *
 * Every page call and every proxied print image is one function invocation and one CDN request.
 * Fast Data Transfer carries the static files and everything that crossed the origin. Memory is
 * billed for each call's whole wall time, with no sharing between requests, so it is an upper
 * bound. The database size is per stored account, not per active player.
 *
 * @param assumptions - the U-values, assumed or measured
 * @returns the usage of each metered resource, in its billing unit
 * @throws RangeError when an input is negative or not a finite number: no measurement gives one
 */
export function monthlyUsagePerPlayer(
  assumptions: UsageAssumptions
): ResourceUsage {
  requireMeasurable(assumptions);
  const a = assumptions;
  const pageCalls = a.sessionsPerPlayer * a.functionCallsPerSession;
  const imageCalls = a.printExportsPerPlayer * a.imagesPerPrintExport;
  const invocations = pageCalls + imageCalls;
  const originTransferGb =
    (pageCalls * a.responseKbPerCall + imageCalls * a.printImageKb) / KB_PER_GB;
  return {
    "function-invocations": invocations,
    "active-cpu-hours":
      (invocations * a.activeCpuSecondsPerCall) / SECONDS_PER_HOUR,
    "provisioned-memory-gb-hours":
      (invocations * a.wallSecondsPerCall * a.instanceMemoryGb) /
      SECONDS_PER_HOUR,
    "fast-origin-transfer-gb": originTransferGb,
    "fast-data-transfer-gb":
      (a.sessionsPerPlayer * a.staticMbPerSession) / MB_PER_GB +
      originTransferGb,
    "cdn-requests":
      a.sessionsPerPlayer * a.staticRequestsPerSession + invocations,
    "speed-insights-events":
      a.sessionsPerPlayer *
      a.pageViewsPerSession *
      a.speedInsightsEventsPerPageView,
    "session-replays": a.sessionsPerPlayer * a.replaySessionSampleRate,
    "database-size-mb": a.databaseMbPerStoredAccount,
    "database-egress-gb": (invocations * a.databaseReadKbPerCall) / KB_PER_GB,
  };
}

/** Refuses an input no measurement can produce: negative, infinite or `NaN`. */
function requireMeasurable(assumptions: UsageAssumptions): void {
  for (const [name, value] of Object.entries(assumptions)) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(
        `${name} must be a finite number of zero or more, got ${value}`
      );
    }
  }
}
