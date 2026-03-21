"use client";
import { useState, useCallback, useRef } from "react";
import type { BuildEvent, BuildRequest } from "@/app/api/ai/build/route";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export interface BuildCard {
  name: string;
  category: string;
}

export interface AIDeckBuildState {
  statusMessages: string[];
  commander: string | null;
  cards: BuildCard[];
  totalCards: number | null;
  isLoading: boolean;
  error: string | null;
}

export type AIDeckBuildParams = BuildRequest;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
type BuildAcc = {
  commander: string | null;
  cards: BuildCard[];
  messages: string[];
};

/** Reads a NDJSON build stream and applies events, calling onUpdate after each state change. */
async function processBuildStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onUpdate: (acc: BuildAcc) => void,
): Promise<BuildCard[] | null> {
  const decoder = new TextDecoder();
  const acc: BuildAcc = { commander: null, cards: [], messages: [] };
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let event: BuildEvent;
      try { event = JSON.parse(trimmed) as BuildEvent; } catch { continue; }

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
          acc.cards.push({ name: event.name, category: event.category });
          if (acc.cards.length % 5 === 0) onUpdate(acc);
          break;
        case "done":
          onUpdate(acc);
          return acc.cards;
        case "error":
          throw new Error(event.message);
      }
    }
  }
  return acc.cards;
}

export function useAIDeckBuild() {
  const [state, setState] = useState<AIDeckBuildState>({
    statusMessages: [],
    commander: null,
    cards: [],
    totalCards: null,
    isLoading: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      statusMessages: [],
      commander: null,
      cards: [],
      totalCards: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const build = useCallback(
    async (params: AIDeckBuildParams): Promise<BuildCard[] | null> => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      setState({
        statusMessages: [],
        commander: null,
        cards: [],
        totalCards: null,
        isLoading: true,
        error: null,
      });

      try {
        const response = await fetch("/api/ai/build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
          signal: abort.signal,
        });

        if (!response.ok) throw new Error(`Build request failed (${response.status})`);
        if (!response.body) throw new Error("No response body");

        const cards = await processBuildStream(response.body.getReader(), (acc) => {
          setState((prev) => ({
            ...prev,
            statusMessages: [...acc.messages],
            commander: acc.commander,
            cards: [...acc.cards],
          }));
        });

        setState((prev) => ({ ...prev, cards: cards ?? [], isLoading: false }));
        return cards;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return null;
        const message = err instanceof Error ? err.message : "Unknown error";
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        return null;
      }
    },
    []
  );

  return { state, build, reset };
}
