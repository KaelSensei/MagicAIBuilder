"use client";
import { useState, useCallback, useRef } from "react";
import type {
  BuildEvent,
  BuildRequest,
  BuildSource,
} from "@/app/api/ai/build/types";

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
}

export interface AIDeckBuildState {
  statusMessages: string[];
  commander: string | null;
  cards: BuildCard[];
  totalCards: number | null;
  source: BuildSource | null;
  isLoading: boolean;
  error: string | null;
}

export type AIDeckBuildParams = BuildRequest;

const EMPTY_STATE: AIDeckBuildState = {
  statusMessages: [],
  commander: null,
  cards: [],
  totalCards: null,
  source: null,
  isLoading: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
type BuildAcc = {
  commander: string | null;
  cards: BuildCard[];
  messages: string[];
  totalCards: number | null;
  source: BuildSource | null;
};

/** Total copies accumulated so far, so the progress bar counts cards not entries. */
export function countCopies(cards: readonly BuildCard[]): number {
  return cards.reduce((sum, c) => sum + c.quantity, 0);
}

/**
 * Process a batch of decoded text lines into the accumulator.
 * Returns true when a "done" event was seen, false otherwise.
 */
function processLines(
  lines: string[],
  acc: BuildAcc,
  onUpdate: (acc: BuildAcc) => void,
): boolean {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let event: BuildEvent;
    try {
      event = JSON.parse(trimmed) as BuildEvent;
    } catch {
      continue;
    }
    switch (event.type) {
      case "status":
        acc.messages.push(event.message);
        onUpdate(acc);
        break;
      case "commander":
        acc.commander = event.name;
        onUpdate(acc);
        break;
      case "card":
        acc.cards.push({
          name: event.name,
          category: event.category,
          // Tolerate a server that predates the quantity field.
          quantity: Math.max(1, Math.floor(event.quantity || 1)),
        });
        if (acc.cards.length % 5 === 0) onUpdate(acc);
        break;
      case "done":
        acc.totalCards = event.totalCards ?? countCopies(acc.cards);
        acc.source = event.source ?? "ai";
        onUpdate(acc);
        return true;
      case "error":
        throw new Error(event.message);
    }
  }
  return false;
}

/** Reads a NDJSON build stream chunk by chunk, delegating line processing to processLines. */
async function processBuildStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onUpdate: (acc: BuildAcc) => void,
): Promise<BuildAcc> {
  const decoder = new TextDecoder();
  const acc: BuildAcc = {
    commander: null,
    cards: [],
    messages: [],
    totalCards: null,
    source: null,
  };
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    if (processLines(lines, acc, onUpdate)) return acc;
  }

  // Falling out of the loop means the stream ended without a "done" event, so
  // the response was cut short (function timeout, dropped connection). Surface
  // it instead of importing a half deck the user would have to repair by hand.
  throw new Error("The AI build ended early");
}

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
        const response = await fetch("/api/ai/build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
          signal: abort.signal,
        });

        if (!response.ok)
          throw new Error(`Build request failed (${response.status})`);
        if (!response.body) throw new Error("No response body");

        const acc = await processBuildStream(response.body.getReader(), (a) => {
          setState((prev) => ({
            ...prev,
            statusMessages: [...a.messages],
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
        };
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return null;
        const message = err instanceof Error ? err.message : "Unknown error";
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        return null;
      }
    },
    [],
  );

  return { state, build, reset };
}
