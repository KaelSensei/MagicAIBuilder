"use client";
/**
 * Stores how a playtest run went: the POST to the sessions route, the staling
 * of the deck's cached history, and the in-flight / failed state the result bar
 * renders.
 *
 * Playtest context, browser side. `RecordResultBar` is its only caller today.
 * The deck version is not sent: the route snapshots the saved deck itself when
 * it stores the run, so the browser cannot file a run under a stale version.
 *
 * @module hooks/useRecordPlaytestSession
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { logger } from "@/lib/logger";
import type {
  SessionDifficulty,
  SessionResult,
} from "@/lib/playtest/session-enums";

import { playtestHistoryKey } from "./usePlaytestHistory";

/**
 * A finished run as the result bar's form holds it, before any cleaning.
 *
 * The counts come straight from the engine. The three free-form fields keep
 * the form's raw values: an empty difficulty means the player did not say,
 * and the notes may carry the whitespace the player typed around them.
 */
export interface PlaytestRunDraft {
  readonly result: SessionResult;
  readonly turns: number;
  readonly mulliganCount: number;
  readonly cardsSeen: number;
  readonly additionalCardsSeen: number;
  readonly difficulty: SessionDifficulty | "";
  readonly notes: string;
  readonly proposedChange: string;
}

/** What the result bar needs to drive and render the recording. */
export interface RecordPlaytestSession {
  /** Stores the run. Fire and forget: the outcome arrives through the two flags. */
  readonly record: (draft: PlaytestRunDraft) => void;
  /** The result whose request is in flight, or null when none is. */
  readonly pendingResult: SessionResult | null;
  /** True after a request failed, until the next attempt starts. */
  readonly failed: boolean;
}

/**
 * The body the sessions route accepts for a draft.
 *
 * An optional field is omitted rather than sent empty: `parseSessionInput`
 * rejects `""` for `difficulty`, and an empty note is "no note", not a note.
 */
function toSessionRequestBody(draft: PlaytestRunDraft) {
  const notes = draft.notes.trim();
  const proposedChange = draft.proposedChange.trim();
  return {
    result: draft.result,
    turns: draft.turns,
    mulliganCount: draft.mulliganCount,
    cardsSeen: draft.cardsSeen,
    additionalCardsSeen: draft.additionalCardsSeen,
    ...(draft.difficulty === "" ? {} : { difficulty: draft.difficulty }),
    ...(notes === "" ? {} : { notes }),
    ...(proposedChange === "" ? {} : { proposedChange }),
  };
}

/**
 * Records a playtest run for `deckId` and tells the caller once it is stored.
 *
 * On success the deck's cached history is invalidated first, so the history
 * panel shows the run the next time it opens, and only then is `onRecorded`
 * called. On a refused request or a network error nothing is invalidated,
 * `onRecorded` is not called and `failed` turns true, so the caller can keep
 * the modal open: closing would discard a result the player just gave.
 *
 * @param deckId - the deck the run was played with
 * @param onRecorded - called once per stored run, after the history is invalidated
 */
export function useRecordPlaytestSession(
  deckId: string,
  onRecorded: () => void
): RecordPlaytestSession {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (draft: PlaytestRunDraft): Promise<void> => {
      const response = await fetch(`/api/decks/${deckId}/playtest-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSessionRequestBody(draft)),
      });
      if (!response.ok) throw new Error(`record failed: ${response.status}`);
      await queryClient.invalidateQueries({
        queryKey: playtestHistoryKey(deckId),
      });
    },
    onSuccess: onRecorded,
    onError: (error) => {
      logger.error(
        "Failed to record playtest session",
        "useRecordPlaytestSession",
        error
      );
    },
  });

  return {
    record: mutation.mutate,
    pendingResult: mutation.isPending ? mutation.variables.result : null,
    failed: mutation.isError,
  };
}
