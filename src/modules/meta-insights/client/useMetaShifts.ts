"use client";
/**
 * What moved in a commander's EDHREC distribution, read from the retained
 * snapshots.
 *
 * Meta-insights context, `client/`. Reads `GET /api/meta/:slug/history`,
 * which serves only retained snapshots and makes no upstream request, so this
 * is cheap and independent of EDHREC being reachable. `report: null` is the
 * ordinary answer for a commander with fewer than two recorded days, not an
 * error: `snapshotCount` tells the two apart. `useMetaPanel` calls
 * `fetchShifts` once the EDHREC answer is in, because that answer is what
 * writes today's snapshot; `MetaTrendsView` calls it on mount.
 *
 * @module meta-insights/client/useMetaShifts
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { commanderToSlug } from "@/lib/meta/commander-slug";
import type { MetaShift } from "@/modules/meta-insights/domain/history";

/** The window the panel asks for; the API caps it at a year. */
export const SHIFT_WINDOW_DAYS = 90;

/** `MetaShiftReport` as it survives JSON — the two dates arrive as ISO strings. */
export interface MetaShiftReportJson {
  readonly baselineCapturedOn: string;
  readonly currentCapturedOn: string;
  readonly spanDays: number;
  readonly shifts: readonly MetaShift[];
}

/** The history read as the panel renders it: the report, its evidence count, and the request's state. */
export interface MetaShiftsState {
  /** Null until two recorded days exist inside the window, or while nothing has been read. */
  readonly report: MetaShiftReportJson | null;
  /** How many days were recorded inside the window — 0 or 1 explains a null report. */
  readonly snapshotCount: number;
  readonly isLoading: boolean;
  readonly error: string | null;
}

interface HistoryApiResponse {
  report?: MetaShiftReportJson | null;
  snapshotCount?: number;
  error?: string;
}

const IDLE: MetaShiftsState = {
  report: null,
  snapshotCount: 0,
  isLoading: false,
  error: null,
};

/** Longest wait for meta history, matching the other 15 s loading deadlines. */
export const META_SHIFTS_TIMEOUT_MS = 15_000;

/**
 * The meta shifts of one commander, read on demand.
 *
 * `fetchShifts` asks for the panel's window ({@link SHIFT_WINDOW_DAYS}) and
 * keeps the newest answer only: an older request that resolves last is
 * ignored, and a commander change discards whatever was pending and returns
 * the state to idle. `reset` does the same on demand. A null commander makes
 * `fetchShifts` a no-op.
 *
 * @param commanderName - the commander whose history to read, or null for none
 * @returns the state plus `fetchShifts` and `reset`
 */
export function useMetaShifts(commanderName: string | null) {
  const [state, setState] = useState<MetaShiftsState>(IDLE);
  const requestVersion = useRef(0);

  useEffect(() => {
    requestVersion.current += 1;
    setState(IDLE);
    return () => { requestVersion.current += 1; };
  }, [commanderName]);

  const fetchShifts = useCallback(async () => {
    if (!commanderName) return;
    const slug = commanderToSlug(commanderName);
    const version = ++requestVersion.current;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await fetch(
        `/api/meta/${encodeURIComponent(slug)}/history?days=${SHIFT_WINDOW_DAYS}`,
        { signal: AbortSignal.timeout(META_SHIFTS_TIMEOUT_MS) }
      );
      const data = (await res.json()) as HistoryApiResponse;
      if (version !== requestVersion.current) return;

      if (!res.ok || data.error) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setState({
        report: data.report ?? null,
        snapshotCount: data.snapshotCount ?? 0,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      if (version !== requestVersion.current) return;
      setState({
        ...IDLE,
        error: err instanceof Error ? err.message : "Failed to load meta shifts",
      });
    }
  }, [commanderName]);

  const reset = useCallback(() => {
    requestVersion.current += 1;
    setState(IDLE);
  }, []);

  return { ...state, fetchShifts, reset };
}
