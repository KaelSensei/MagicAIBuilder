/**
 * The loading state of the two meta sources, EDHREC and MTGTop8, and the
 * three transitions a request takes it through: begin, finish, fail.
 *
 * Meta-insights context, client side. `useMetaAnalysis` owns the request and
 * calls these as `setState` reducers; the panel reads the result to render a
 * list, a spinner, an error or a "source unavailable" caveat per source. The
 * two sources are independent: a transition on one never reads or writes the
 * other, so a failed MTGTop8 search leaves the EDHREC list on screen. Pure
 * functions over readonly data, no React, no I/O.
 *
 * @module meta-insights/client/meta-source-state
 */
import type { MetaApiResponse } from "@/modules/meta-insights/client/meta-api-response";

/** The two halves of the meta route, one request each. */
export type MetaSource = "edhrec" | "tournament";

/**
 * What the panel knows about a source's reachability.
 *
 * `idle` until the first request, then whatever the last answer said.
 * `attempts` counts every request started, refreshes included, so the panel
 * can tell a first failure from a persistent one.
 */
export interface MetaSourceHealth {
  readonly status: "idle" | "available" | "unavailable";
  readonly attempts: number;
}

/**
 * Both sources' payload, loading flag, error text and health, as the panel
 * destructures them. A payload survives a later failure or a refresh in
 * flight: the panel keeps showing the last good list with the error beside it.
 */
export interface MetaState {
  readonly edhrec: MetaApiResponse | null;
  readonly tournament: MetaApiResponse | null;
  readonly isLoadingEdhrec: boolean;
  readonly isLoadingTournament: boolean;
  readonly errorEdhrec: string | null;
  readonly errorTournament: string | null;
  readonly sourceHealth: Readonly<Record<MetaSource, MetaSourceHealth>>;
}

/** Nothing requested yet: no payload, no error, both sources idle at zero attempts. */
export const INITIAL_META_STATE: MetaState = {
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

/** Copies the health map with a new status for one source, attempts untouched. */
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
 * A request for `source` just started: the source is loading, its previous
 * error is cleared and the attempt is counted.
 *
 * The health status is kept, not reset to `idle`: a refresh after a failure
 * still reads `unavailable` until the new answer arrives. The payload is kept
 * too, so a refresh does not blank the list.
 */
export function beginSourceLoad(
  prev: MetaState,
  source: MetaSource
): MetaState {
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
  return {
    ...prev,
    isLoadingTournament: true,
    errorTournament: null,
    sourceHealth,
  };
}

/**
 * `source` answered: the payload replaces the previous one, loading ends and
 * the source is `available`. The error stays as `beginSourceLoad` left it, `null`.
 */
export function finishSourceLoad(
  prev: MetaState,
  source: MetaSource,
  payload: MetaApiResponse
): MetaState {
  const sourceHealth = healthWithStatus(prev, source, "available");
  if (source === "edhrec") {
    return { ...prev, edhrec: payload, isLoadingEdhrec: false, sourceHealth };
  }
  return {
    ...prev,
    tournament: payload,
    isLoadingTournament: false,
    sourceHealth,
  };
}

/**
 * `source` failed: the message is stored, loading ends and the source is
 * `unavailable`. The previous payload, if any, is kept so the panel can show
 * the last good list next to the error.
 */
export function failSourceLoad(
  prev: MetaState,
  source: MetaSource,
  message: string
): MetaState {
  const sourceHealth = healthWithStatus(prev, source, "unavailable");
  if (source === "edhrec") {
    return {
      ...prev,
      isLoadingEdhrec: false,
      errorEdhrec: message,
      sourceHealth,
    };
  }
  return {
    ...prev,
    isLoadingTournament: false,
    errorTournament: message,
    sourceHealth,
  };
}
