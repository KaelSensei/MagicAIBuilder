"use client";
/**
 * Client side of the AI deck build: posts the request, reads the NDJSON build
 * stream through guarded events, and exposes progress and the finished list.
 * Progress is kept as the step the server named (`lib/ai/build-step.ts`), and a
 * failed build as its kind (`lib/ai/build-failure.ts`), never as server or
 * thrown text, so the wizard words both in the player's language.
 */
import { useState, useCallback, useRef } from "react";
import type {
  BuildEvent,
  BuildRequest,
  BuildSource,
  DeckCorrection,
  DeckRemovalReason,
} from "@/app/api/ai/build/types";
import {
  DeckBuildRefusedError,
  DeckBuildServerError,
  DeckBuildUnreachableError,
  deckBuildFailureLogLevel,
  deckBuildFailureOf,
  type DeckBuildFailure,
} from "@/lib/ai/build-failure";
import { isBuildStep, type BuildStep } from "@/lib/ai/build-step";
import {
  readAiCallDenialResponse,
  type AiCallDenial,
} from "@/lib/ai/usage/denial";
import { readNdjsonEvents } from "@/lib/async/ndjson-lines";
import { parseBracketLevel } from "@/lib/constants/brackets";
import { isRecord } from "@/lib/guards";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export interface BuildCard {
  name: string;
  category: string;
  /** Copies of this card. Only basic lands ever exceed 1. */
  quantity: number;
}

/**
 * What a completed build produced.
 *
 * `build()` returns this instead of only the card list because the caller runs
 * inside an async closure: reading `state.commander` after awaiting would read
 * the render-time snapshot, which is always null.
 */
export interface BuildResult {
  commander: string | null;
  cards: BuildCard[];
  source: BuildSource;
  /** What the server's card-data check changed in the model's list, for the player to see. */
  corrections: readonly DeckCorrection[];
}

export interface AIDeckBuildState {
  /** The step the build last named; null before its first status event this client can read. */
  step: BuildStep | null;
  commander: string | null;
  cards: BuildCard[];
  totalCards: number | null;
  source: BuildSource | null;
  isLoading: boolean;
  /** Why the last build failed; null while it runs, and after a success or a cancellation. */
  failure: DeckBuildFailure | null;
  /** Why the server refused the build before calling a model, if it did. */
  denial: AiCallDenial | null;
}

export type AIDeckBuildParams = BuildRequest;

const EMPTY_STATE: AIDeckBuildState = {
  step: null,
  commander: null,
  cards: [],
  totalCards: null,
  source: null,
  isLoading: false,
  failure: null,
  denial: null,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
type BuildAcc = {
  commander: string | null;
  cards: BuildCard[];
  step: BuildStep | null;
  totalCards: number | null;
  source: BuildSource | null;
  corrections: readonly DeckCorrection[];
};

/** Total copies accumulated so far, so the progress bar counts cards not entries. */
export function countCopies(cards: readonly BuildCard[]): number {
  return cards.reduce((sum, c) => sum + c.quantity, 0);
}

// ---------------------------------------------------------------------------
// Build stream events
// ---------------------------------------------------------------------------
type CardEvent = Extract<BuildEvent, { type: "card" }>;

/**
 * A build event as this client accepts it off the wire.
 *
 * Commander and error events need every field they carry. A status event
 * needs a step this client knows, and its English `message` is never read: a
 * status event from a server that predates steps, or naming a step added
 * since, is skipped, so the wizard keeps the last step it can word. A card's
 * `quantity` and every field of `done` stay `unknown` here: a server that
 * predates them sends none, and the reader falls back as if a field it cannot
 * read were absent, so a `done` event always completes the build.
 */
type ReceivedBuildEvent =
  | Exclude<BuildEvent, { type: "status" | "card" | "done" }>
  | { readonly type: "status"; readonly step: BuildStep }
  | (Omit<CardEvent, "quantity"> & { readonly quantity?: unknown })
  | {
      readonly type: "done";
      readonly totalCards?: unknown;
      readonly source?: unknown;
      readonly corrections?: unknown;
    };

/** Every reason the server gives for removing copies; the key set is checked against the type. */
const REMOVAL_REASONS: Readonly<Record<DeckRemovalReason, true>> = {
  unknown_card: true,
  outside_color_identity: true,
  banned: true,
  not_legal: true,
  extra_copies: true,
  commander_in_list: true,
  over_size: true,
};

/**
 * Accepts one parsed NDJSON line as a build event.
 *
 * @param value - parsed line
 * @returns whether the value is an event of a known type with the fields it needs
 */
function isBuildEvent(value: unknown): value is ReceivedBuildEvent {
  if (!isRecord(value)) return false;
  switch (value.type) {
    case "status":
      return isBuildStep(value.step);
    case "error":
      return typeof value.message === "string";
    case "commander":
      return typeof value.name === "string";
    case "card":
      return (
        typeof value.name === "string" && typeof value.category === "string"
      );
    case "done":
      return true;
    default:
      return false;
  }
}

/** A Game Changer removal names an official bracket and that bracket's limit (I-02 5.1). */
function isGameChangerRemoval(value: Readonly<Record<string, unknown>>) {
  return (
    typeof value.bracket === "number" &&
    parseBracketLevel(value.bracket) !== null &&
    typeof value.limit === "number"
  );
}

/**
 * True when a correction is one the wizard can explain to the player.
 *
 * @param value - one entry of the done event's `corrections`
 * @returns whether it names a card, a count and a reason of its action
 */
function isDeckCorrection(value: unknown): value is DeckCorrection {
  if (!isRecord(value)) return false;
  if (typeof value.name !== "string" || typeof value.quantity !== "number")
    return false;
  if (value.action === "added") return value.reason === "fill_to_size";
  if (value.action !== "removed") return false;
  if (value.reason === "preview") return typeof value.releasesOn === "string";
  if (value.reason === "game_changer") return isGameChangerRemoval(value);
  return (
    typeof value.reason === "string" &&
    Object.hasOwn(REMOVAL_REASONS, value.reason)
  );
}

/**
 * Copies of one card event; a missing or unreadable count means one copy, as
 * a server that predates the quantity field sends none.
 */
function copiesOf(quantity: unknown): number {
  return typeof quantity === "number"
    ? Math.max(1, Math.floor(quantity || 1))
    : 1;
}

/** Records the done event's totals, falling back for each field it cannot read. */
function applyDone(
  event: Extract<ReceivedBuildEvent, { type: "done" }>,
  acc: BuildAcc
): void {
  const { totalCards, source, corrections } = event;
  acc.totalCards =
    typeof totalCards === "number" ? totalCards : countCopies(acc.cards);
  acc.source = source === "ai" || source === "demo" ? source : "ai";
  acc.corrections = Array.isArray(corrections)
    ? corrections.filter(isDeckCorrection)
    : [];
}

/**
 * Applies one build event to the accumulator.
 *
 * Progress is published after each status and commander event, after every
 * fifth card, and after done.
 *
 * @param event - guarded build event
 * @param acc - accumulator updated in place
 * @param onUpdate - publishes the accumulator
 * @returns true once the done event has been applied
 * @throws DeckBuildServerError with the server's line on an error event
 */
function applyBuildEvent(
  event: ReceivedBuildEvent,
  acc: BuildAcc,
  onUpdate: (acc: BuildAcc) => void
): boolean {
  switch (event.type) {
    case "status":
      acc.step = event.step;
      onUpdate(acc);
      return false;
    case "commander":
      acc.commander = event.name;
      onUpdate(acc);
      return false;
    case "card":
      acc.cards.push({
        name: event.name,
        category: event.category,
        quantity: copiesOf(event.quantity),
      });
      if (acc.cards.length % 5 === 0) onUpdate(acc);
      return false;
    case "done":
      applyDone(event, acc);
      onUpdate(acc);
      return true;
    case "error":
      throw new DeckBuildServerError(event.message);
    default: {
      const unhandled: never = event;
      return unhandled;
    }
  }
}

/**
 * Reads a NDJSON build stream until its done event.
 *
 * The last event is read even when the stream ends without a line break after
 * it; a line that is not a build event is skipped.
 *
 * @throws Error when the stream ends before its done event, or on an error event
 */
async function processBuildStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onUpdate: (acc: BuildAcc) => void,
): Promise<BuildAcc> {
  const acc: BuildAcc = {
    commander: null,
    cards: [],
    step: null,
    totalCards: null,
    source: null,
    corrections: [],
  };

  for await (const event of readNdjsonEvents(reader, isBuildEvent)) {
    if (applyBuildEvent(event, acc, onUpdate)) return acc;
  }

  // Falling out of the loop means the stream ended without a "done" event, so
  // the response was cut short (function timeout, dropped connection). Surface
  // it instead of importing a half deck the user would have to repair by hand.
  throw new Error("The AI build ended early");
}

/**
 * Posts the build request: the one step where a failure means the server
 * could not be reached.
 *
 * @param params - the player's answers
 * @param signal - cancels the request
 * @returns the route's response, whatever its status
 * @throws DeckBuildUnreachableError when `fetch` rejected without an answer;
 *   the abort's own error when the build was cancelled, so it stays silent
 */
async function postBuildRequest(
  params: AIDeckBuildParams,
  signal: AbortSignal
): Promise<Response> {
  const body = JSON.stringify(params);
  try {
    return await fetch("/api/ai/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new DeckBuildUnreachableError(error);
  }
}

/**
 * Runs one AI deck build at a time.
 *
 * `build` resolves to the finished build, or to null when there is none: the
 * build failed (`state.failure` says why, and `state.denial` too when the
 * server refused it before a model ran), or `reset` or a newer build cancelled
 * it, which sets neither and logs nothing.
 *
 * @returns the build's progress, `build` and `reset`
 */
export function useAIDeckBuild() {
  const [state, setState] = useState<AIDeckBuildState>(EMPTY_STATE);

  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(EMPTY_STATE);
  }, []);

  const build = useCallback(
    async (params: AIDeckBuildParams): Promise<BuildResult | null> => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      setState({ ...EMPTY_STATE, isLoading: true });

      try {
        const response = await postBuildRequest(params, abort.signal);

        if (!response.ok) {
          const denial = (await readAiCallDenialResponse(response)) ?? null;
          setState((prev) => ({ ...prev, denial }));
          throw new DeckBuildRefusedError(response.status, denial);
        }
        if (!response.body) throw new Error("No response body");

        const acc = await processBuildStream(response.body.getReader(), (a) => {
          setState((prev) => ({
            ...prev,
            step: a.step,
            commander: a.commander,
            cards: [...a.cards],
            totalCards: a.totalCards,
            source: a.source,
          }));
        });

        setState((prev) => ({
          ...prev,
          commander: acc.commander,
          cards: [...acc.cards],
          totalCards: acc.totalCards,
          source: acc.source,
          isLoading: false,
        }));

        return {
          commander: acc.commander,
          cards: acc.cards,
          source: acc.source ?? "ai",
          corrections: acc.corrections,
        };
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return null;
        const level = deckBuildFailureLogLevel(err);
        logger[level]("AI deck build failed", "useAIDeckBuild", err);
        const failure = deckBuildFailureOf(err);
        setState((prev) => ({ ...prev, isLoading: false, failure }));
        return null;
      }
    },
    [],
  );

  return { state, build, reset };
}
