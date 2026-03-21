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

        if (!response.ok) {
          throw new Error(`Build request failed (${response.status})`);
        }
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Accumulated result (avoids stale closures in setState callbacks)
        let accCommander: string | null = null;
        const accCards: BuildCard[] = [];
        const accMessages: string[] = [];

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
            try {
              event = JSON.parse(trimmed) as BuildEvent;
            } catch {
              continue;
            }

            switch (event.type) {
              case "status":
                accMessages.push(event.message);
                setState((prev) => ({
                  ...prev,
                  statusMessages: [...accMessages],
                }));
                break;

              case "commander":
                accCommander = event.name;
                setState((prev) => ({ ...prev, commander: event.name }));
                break;

              case "card":
                accCards.push({ name: event.name, category: event.category });
                // Throttle re-renders — update every 5 cards
                if (accCards.length % 5 === 0) {
                  setState((prev) => ({ ...prev, cards: [...accCards] }));
                }
                break;

              case "done":
                setState((prev) => ({
                  ...prev,
                  cards: [...accCards],
                  totalCards: event.totalCards,
                  isLoading: false,
                }));
                return accCards;

              case "error":
                throw new Error(event.message);
            }
          }
        }

        // Stream ended without "done" — return what we have
        setState((prev) => ({
          ...prev,
          cards: [...accCards],
          commander: accCommander,
          isLoading: false,
        }));
        return accCards;
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
