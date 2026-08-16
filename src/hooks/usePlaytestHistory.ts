"use client";
import { useQuery } from "@tanstack/react-query";

import type { PlaytestSession } from "@/lib/playtest/analytics";
import type { SessionSummary } from "@/lib/playtest/session-input";

export interface PlaytestHistory {
  readonly sessions: readonly PlaytestSession[];
  readonly summary: SessionSummary;
}

/**
 * The caller's recorded playtests for a deck, with their aggregate summary.
 *
 * The route answers 404 for a deck the caller does not own — including one that
 * simply is not theirs — so a miss is a normal outcome here rather than an
 * error worth retrying or surfacing.
 *
 * @param deckId - deck to read history for, or null to skip the query
 */
export function usePlaytestHistory(deckId: string | null) {
  return useQuery({
    queryKey: ["playtest", "history", deckId],
    queryFn: async (): Promise<PlaytestHistory | null> => {
      const response = await fetch(`/api/decks/${deckId}/playtest-sessions`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!deckId,
    retry: false,
  });
}
