"use client";
/**
 * Loads EDHREC and MTGTop8 meta for one commander, on demand, one request per
 * source.
 *
 * Meta-insights context, client side. This hook owns the request only: the URL
 * of `GET /api/meta/:slug?source=`, the timeout, the JSON parse and the
 * latest-wins guard. The state it returns is driven by the pure transitions in
 * `meta-source-state.ts`, and a body is read with the rules in
 * `meta-api-response.ts`. The meta panel calls `fetchAll` when it first
 * expands and `fetchSource(…, true)` for a refresh. The deck-versus-meta
 * comparison (which popular cards the deck lacks) is not here: the panel does
 * it from `deckCardNames`.
 *
 * The state is held with the commander it was loaded for, and read as
 * {@link INITIAL_META_STATE} for any other commander. So a commander change
 * drops the previous payloads in the same render, with no reset effect that
 * would leave one render showing them under the new name; and a late answer
 * for the previous commander is stored under that commander, never shown as
 * the new one's (B2 fix, 2026-11-13).
 *
 * @module meta-insights/client/useMetaAnalysis
 */
import { useCallback, useRef, useState } from "react";
import { commanderToSlug } from "@/lib/meta/commander-slug";
import {
  isMetaApiResponse,
  metaErrorMessage,
  thrownMetaMessage,
} from "@/modules/meta-insights/client/meta-api-response";
import {
  INITIAL_META_STATE,
  beginSourceLoad,
  failSourceLoad,
  finishSourceLoad,
  type MetaSource,
  type MetaState,
} from "@/modules/meta-insights/client/meta-source-state";

/** The state shape this hook returns, re-exported so `useMetaPanel` types against the hook, not the state machine. */
export type {
  MetaState,
  MetaSourceHealth,
} from "@/modules/meta-insights/client/meta-source-state";

/**
 * Longest wait for one meta source. Longer than the 15 s deck deadlines because
 * an uncached request makes the server fetch EDHREC or tournament data first.
 */
export const META_FETCH_TIMEOUT_MS = 30_000;

/** The source state and the commander it belongs to; no commander before the first request. */
interface CommanderMetaState {
  readonly commanderName: string | null;
  readonly state: MetaState;
}

const NO_COMMANDER_STATE: CommanderMetaState = {
  commanderName: null,
  state: INITIAL_META_STATE,
};

/**
 * Loads EDHREC and tournament meta for one commander, on demand.
 *
 * Overlapping requests for the same source keep only the latest response.
 * An older reply cannot replace a newer commander or a newer refresh. The
 * state belongs to one commander: another commander reads it as untouched.
 *
 * @param commanderName - commander to analyse, or null to no-op fetches
 * @returns the source state plus `fetchAll` and `fetchSource`
 */
export function useMetaAnalysis(commanderName: string | null) {
  const [held, setHeld] = useState(NO_COMMANDER_STATE);
  const requestIds = useRef<Record<MetaSource, number>>({
    edhrec: 0,
    tournament: 0,
  });
  const state =
    held.commanderName === commanderName ? held.state : INITIAL_META_STATE;

  const fetchSource = useCallback(
    async (source: MetaSource, refresh = false) => {
      if (!commanderName) return;
      const requestId = requestIds.current[source] + 1;
      requestIds.current[source] = requestId;
      const slug = commanderToSlug(commanderName);
      const stillCurrent = () => requestIds.current[source] === requestId;
      // A transition applies to this commander's state only: the state held
      // for another commander is replaced, not transitioned.
      const setState = (transition: (prev: MetaState) => MetaState) =>
        setHeld((prev) => ({
          commanderName,
          state: transition(
            prev.commanderName === commanderName
              ? prev.state
              : INITIAL_META_STATE
          ),
        }));

      setState((prev) => beginSourceLoad(prev, source));

      try {
        const url = `/api/meta/${encodeURIComponent(slug)}?source=${source}${refresh ? "&refresh=true" : ""}`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(META_FETCH_TIMEOUT_MS),
        });
        const parsed: unknown = await res.json();
        if (!stillCurrent()) return;

        const payload = isMetaApiResponse(parsed) ? parsed : {};
        const message = metaErrorMessage(payload, res.status);
        if (message !== null) throw new Error(message);

        setState((prev) => finishSourceLoad(prev, source, payload));
      } catch (err) {
        if (!stillCurrent()) return;
        setState((prev) =>
          failSourceLoad(prev, source, thrownMetaMessage(err))
        );
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
