"use client";
/**
 * useMetaAnalysis — fetches EDHRec + tournament meta for a given commander.
 * Lazy: only fetches when commanderName is provided and the hook is triggered.
 */
import { useCallback, useRef, useState } from "react";
import { isNonEmptyString, isRecord } from "@/lib/guards";
import { commanderToSlug } from "@/lib/meta/commander-slug";
import type { EdhrecData, TournamentData } from "@/lib/meta/types";

type MetaSource = "edhrec" | "tournament";

interface MetaApiResponse extends Partial<EdhrecData>, Partial<TournamentData> {
  _meta?: {
    cached: boolean;
    stale?: boolean;
    cachedAt?: string;
    observedAt?: string;
  };
  error?: string;
}

export interface MetaState {
  edhrec: MetaApiResponse | null;
  tournament: MetaApiResponse | null;
  isLoadingEdhrec: boolean;
  isLoadingTournament: boolean;
  errorEdhrec: string | null;
  errorTournament: string | null;
  sourceHealth: Record<"edhrec" | "tournament", MetaSourceHealth>;
}

export interface MetaSourceHealth {
  readonly status: "idle" | "available" | "unavailable";
  readonly attempts: number;
}

/**
 * Longest wait for one meta source. Longer than the 15 s deck deadlines because
 * an uncached request makes the server fetch EDHREC or tournament data first.
 */
export const META_FETCH_TIMEOUT_MS = 30_000;

const INITIAL_STATE: MetaState = {
  edhrec: null,
  tournament: null,
  isLoadingEdhrec: false,
  isLoadingTournament: false,
  errorEdhrec: null,
  errorTournament: null,
  sourceHealth: {
    edhrec: { status: "idle", attempts: 0 },
    tournament: { status: "idle", attempts: 0 },
  },
};

/**
 * Accepts a JSON object as a meta payload.
 *
 * @param value - parsed response body
 * @returns whether the body is a non-array object
 */
function isMetaApiResponse(value: unknown): value is MetaApiResponse {
  return isRecord(value);
}

/**
 * Error text for a meta response, or null when the payload can be shown.
 *
 * @param payload - parsed body
 * @param status - HTTP status
 * @returns the message to surface, or null on success
 */
function metaErrorMessage(payload: MetaApiResponse, status: number): string | null {
  if (isNonEmptyString(payload.error)) return payload.error;
  if (status < 200 || status >= 300) return `HTTP ${status}`;
  return null;
}

/**
 * Message stored when a fetch throws.
 *
 * @param error - rejection reason
 * @returns a short failure string
 */
function thrownMetaMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to load meta";
}

/**
 * Copies source health with a new status for one source.
 *
 * @param prev - current meta state
 * @param source - source to update
 * @param status - next health status
 * @returns the next health map
 */
function healthWithStatus(
  prev: MetaState,
  source: MetaSource,
  status: MetaSourceHealth["status"]
): MetaState["sourceHealth"] {
  return {
    ...prev.sourceHealth,
    [source]: { ...prev.sourceHealth[source], status },
  };
}

/**
 * Marks one source as loading and counts the attempt.
 *
 * @param prev - current meta state
 * @param source - source that just started
 * @returns the next state
 */
function beginSourceLoad(prev: MetaState, source: MetaSource): MetaState {
  const sourceHealth = {
    ...prev.sourceHealth,
    [source]: {
      status: prev.sourceHealth[source].status,
      attempts: prev.sourceHealth[source].attempts + 1,
    },
  };
  if (source === "edhrec") {
    return { ...prev, isLoadingEdhrec: true, errorEdhrec: null, sourceHealth };
  }
  return { ...prev, isLoadingTournament: true, errorTournament: null, sourceHealth };
}

/**
 * Stores a successful payload for one source.
 *
 * @param prev - current meta state
 * @param source - source that answered
 * @param payload - response body
 * @returns the next state
 */
function finishSourceLoad(
  prev: MetaState,
  source: MetaSource,
  payload: MetaApiResponse
): MetaState {
  const sourceHealth = healthWithStatus(prev, source, "available");
  if (source === "edhrec") {
    return { ...prev, edhrec: payload, isLoadingEdhrec: false, sourceHealth };
  }
  return { ...prev, tournament: payload, isLoadingTournament: false, sourceHealth };
}

/**
 * Records a failed source without touching the other one.
 *
 * @param prev - current meta state
 * @param source - source that failed
 * @param message - error shown to the panel
 * @returns the next state
 */
function failSourceLoad(prev: MetaState, source: MetaSource, message: string): MetaState {
  const sourceHealth = healthWithStatus(prev, source, "unavailable");
  if (source === "edhrec") {
    return { ...prev, isLoadingEdhrec: false, errorEdhrec: message, sourceHealth };
  }
  return { ...prev, isLoadingTournament: false, errorTournament: message, sourceHealth };
}

/**
 * Loads EDHREC and tournament meta for one commander, on demand.
 *
 * Overlapping requests for the same source keep only the latest response.
 * An older reply cannot replace a newer commander or a newer refresh.
 *
 * @param commanderName - commander to analyse, or null to no-op fetches
 * @returns the source state plus `fetchAll` and `fetchSource`
 */
export function useMetaAnalysis(commanderName: string | null) {
  const [state, setState] = useState<MetaState>(INITIAL_STATE);
  const requestIds = useRef<Record<MetaSource, number>>({ edhrec: 0, tournament: 0 });

  const fetchSource = useCallback(
    async (source: MetaSource, refresh = false) => {
      if (!commanderName) return;
      const requestId = requestIds.current[source] + 1;
      requestIds.current[source] = requestId;
      const slug = commanderToSlug(commanderName);
      const stillCurrent = () => requestIds.current[source] === requestId;

      setState((prev) => beginSourceLoad(prev, source));

      try {
        const url = `/api/meta/${encodeURIComponent(slug)}?source=${source}${refresh ? "&refresh=true" : ""}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(META_FETCH_TIMEOUT_MS) });
        const parsed: unknown = await res.json();
        if (!stillCurrent()) return;

        const payload = isMetaApiResponse(parsed) ? parsed : {};
        const message = metaErrorMessage(payload, res.status);
        if (message !== null) throw new Error(message);

        setState((prev) => finishSourceLoad(prev, source, payload));
      } catch (err) {
        if (!stillCurrent()) return;
        setState((prev) => failSourceLoad(prev, source, thrownMetaMessage(err)));
      }
    },
    [commanderName]
  );

  const fetchAll = useCallback(
    (refresh = false) => {
      void fetchSource("edhrec", refresh);
      void fetchSource("tournament", refresh);
    },
    [fetchSource]
  );

  return { ...state, fetchAll, fetchSource };
}
