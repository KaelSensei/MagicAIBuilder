"use client";
/**
 * useMetaShifts — what moved in a commander's EDHRec distribution.
 *
 * Reads `/api/meta/:slug/history`, which serves only retained snapshots and
 * makes no upstream request, so this is cheap and independent of EDHRec being
 * reachable. `report: null` is the ordinary answer for a commander with fewer
 * than two recorded days, not an error — `snapshotCount` tells the two apart.
 */
import { useCallback, useState } from "react";
import { commanderToSlug } from "@/lib/meta/fetch";
import type { MetaShift } from "@/lib/meta/history";

/** The window the panel asks for; the API caps it at a year. */
export const SHIFT_WINDOW_DAYS = 90;

/** `MetaShiftReport` as it survives JSON — the two dates arrive as ISO strings. */
export interface MetaShiftReportJson {
  readonly baselineCapturedOn: string;
  readonly currentCapturedOn: string;
  readonly spanDays: number;
  readonly shifts: readonly MetaShift[];
}

export interface MetaShiftsState {
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

export function useMetaShifts(commanderName: string | null) {
  const [state, setState] = useState<MetaShiftsState>(IDLE);

  const fetchShifts = useCallback(async () => {
    if (!commanderName) return;
    const slug = commanderToSlug(commanderName);

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const res = await fetch(
        `/api/meta/${encodeURIComponent(slug)}/history?days=${SHIFT_WINDOW_DAYS}`
      );
      const data = (await res.json()) as HistoryApiResponse;

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
      setState({
        ...IDLE,
        error: err instanceof Error ? err.message : "Failed to load meta shifts",
      });
    }
  }, [commanderName]);

  const reset = useCallback(() => setState(IDLE), []);

  return { ...state, fetchShifts, reset };
}
