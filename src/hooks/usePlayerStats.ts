"use client";
/**
 * Reads one year of the signed-in player's statistics from
 * `GET /api/user/stats` (I-60 slice 2), and owns the query key TanStack Query
 * caches them under.
 *
 * Deck analysis, browser side. The `/stats` page renders the current year
 * in-process and hands it over as initial data, so only another year the
 * player picks, or a retry, reaches the route.
 *
 * @module hooks/usePlayerStats
 */
import { useQuery } from "@tanstack/react-query";
import { withRequestDeadline } from "@/lib/async/request-deadline";
import type { PlayerStatsReport } from "@/lib/deck/player-stats-report";

/**
 * How long a year's report is reused before it is read again. The counts
 * change only when the player saves a deck, so a few minutes is safe.
 */
const STATS_STALE_MS = 5 * 60_000;

/**
 * The TanStack Query key of one year's report.
 *
 * @param year - the calendar year
 */
export function playerStatsKey(year: number) {
  return ["player-stats", year] as const;
}

/**
 * The caller's statistics for one year.
 *
 * @param year - the calendar year to show
 * @param initialReport - the report the page rendered on the server, or null
 *   when that read failed; used only for its own year
 * @returns the react-query result; an error carries no detail the page shows
 */
export function usePlayerStats(
  year: number,
  initialReport: PlayerStatsReport | null
) {
  return useQuery({
    queryKey: playerStatsKey(year),
    queryFn: () => fetchPlayerStats(year),
    initialData: initialReport?.year === year ? initialReport : undefined,
    staleTime: STATS_STALE_MS,
    retry: false,
  });
}

/**
 * Reads one year from the route; any non-2xx answer is an error, and so is a
 * read still unanswered after the request deadline (I-04), so the page offers
 * its retry instead of loading forever.
 */
function fetchPlayerStats(year: number): Promise<PlayerStatsReport> {
  return withRequestDeadline(async (signal) => {
    const response = await fetch(`/api/user/stats?year=${year}`, { signal });
    if (!response.ok) {
      throw new Error(`Player stats failed (${response.status})`);
    }
    const report: PlayerStatsReport = await response.json();
    return report;
  });
}
