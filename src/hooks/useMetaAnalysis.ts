"use client";
/**
 * useMetaAnalysis — fetches EDHRec + tournament meta for a given commander.
 * Lazy: only fetches when commanderName is provided and the hook is triggered.
 */
import { useCallback, useState } from "react";
import { commanderToSlug } from "@/lib/meta/fetch";
import type { EdhrecData, TournamentData } from "@/lib/meta/fetch";

interface MetaApiResponse extends Partial<EdhrecData>, Partial<TournamentData> {
  _meta?: { cached: boolean; stale?: boolean; cachedAt?: string };
  error?: string;
}

export interface MetaState {
  edhrec: (EdhrecData & { _meta?: NonNullable<MetaApiResponse["_meta"]> }) | null;
  tournament:
    | (TournamentData & { _meta?: NonNullable<MetaApiResponse["_meta"]> })
    | null;
  isLoadingEdhrec: boolean;
  isLoadingTournament: boolean;
  errorEdhrec: string | null;
  errorTournament: string | null;
}

export function useMetaAnalysis(commanderName: string | null) {
  const [state, setState] = useState<MetaState>({
    edhrec: null,
    tournament: null,
    isLoadingEdhrec: false,
    isLoadingTournament: false,
    errorEdhrec: null,
    errorTournament: null,
  });

  const fetchSource = useCallback(
    async (source: "edhrec" | "tournament", refresh = false) => {
      if (!commanderName) return;
      const slug = commanderToSlug(commanderName);
      const isEdhrec = source === "edhrec";

      setState((prev) => ({
        ...prev,
        [isEdhrec ? "isLoadingEdhrec" : "isLoadingTournament"]: true,
        [isEdhrec ? "errorEdhrec" : "errorTournament"]: null,
      }));

      try {
        const url = `/api/meta/${encodeURIComponent(slug)}?source=${source}${refresh ? "&refresh=true" : ""}`;
        const res = await fetch(url);
        const data = (await res.json()) as MetaApiResponse;

        if (!res.ok || data.error) {
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        setState((prev) => ({
          ...prev,
          [isEdhrec ? "edhrec" : "tournament"]: data,
          [isEdhrec ? "isLoadingEdhrec" : "isLoadingTournament"]: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          [isEdhrec ? "isLoadingEdhrec" : "isLoadingTournament"]: false,
          [isEdhrec ? "errorEdhrec" : "errorTournament"]:
            err instanceof Error ? err.message : "Failed to load meta",
        }));
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
