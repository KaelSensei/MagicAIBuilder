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
 * error worth retrying or surfacing. Any other failure, including a 500, is a
 * real error and must not look like an empty history.
 *
 * @param deckId - deck to read history for, or null to skip the query
 * @returns the react-query result for that deck's history
 */
export function usePlaytestHistory(deckId: string | null) {
  return useQuery({
    queryKey: ["playtest", "history", deckId],
    queryFn: async (): Promise<PlaytestHistory | null> => {
      const response = await fetch(`/api/decks/${deckId}/playtest-sessions`);
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Playtest history failed (${response.status})`);
      }
      const history: PlaytestHistory = await response.json();
      // JSON carries `createdAt` as an ISO string. Restore the Date the session
      // type promises: the comparison panel orders deck versions by it.
      return {
        ...history,
        sessions: history.sessions.map((session) => ({
          ...session,
          createdAt: new Date(session.createdAt),
        })),
      };
    },
    enabled: !!deckId,
    retry: false,
  });
}
