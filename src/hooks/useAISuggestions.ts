"use client";
import { useState, useRef, useCallback } from "react";
import type { Deck, DeckStats, BracketScore } from "@/lib/deck/types";
import type { StreamEvent } from "@/app/api/ai/suggest/route";

export interface CardSuggestion {
  name: string;
  reason: string;
  category: string;
  priority: "high" | "medium" | "low";
}

export interface CardRemoval {
  name: string;
  reason: string;
}

export interface AISuggestionResult {
  suggestions: CardSuggestion[];
  removals: CardRemoval[];
  analysis: string;
  provider: "anthropic" | "openai" | "mock";
}

function hashDeckState(deck: Deck, stats: DeckStats, bracket: number): string {
  const cardNames = deck.cards.map((c) => c.name).sort((a, b) => a.localeCompare(b)).join(",");
  const commander = deck.commander?.name ?? "";
  const partner = deck.partner?.name ?? "";
  return `${commander}|${partner}|${bracket}|${deck.targetBracket}|${deck.budget ?? ""}|${cardNames}`;
}

function buildSuggestPayload(deck: Deck, stats: DeckStats, bracketScore: BracketScore | null, bracket: number) {
  return {
    commanderName: deck.commander?.name ?? null,
    partnerName: deck.partner?.name ?? null,
    colorIdentity: [
      ...(deck.commander?.colorIdentity ?? []),
      ...(deck.partner?.colorIdentity ?? []),
    ].filter((v, i, a) => a.indexOf(v) === i),
    cardNames: deck.cards.map((c) => c.name),
    categories: {
      ramp: stats.ramp,
      draw: stats.draw,
      removal: stats.removal,
      boardWipe: stats.boardWipes,
      creatures: stats.creatures,
      lands: stats.lands,
    },
    avgCmc: stats.avgCmc,
    bracket,
    bracketDimensions: bracketScore?.dimensions,
    bracketWarnings: bracketScore?.warnings,
    targetBracket: deck.targetBracket,
    budget: deck.budget,
    gameChangersCount: stats.gameChangersCount,
    gameChangersList: stats.gameChangersList,
    detectedThemes: stats.themes?.map((t) => t.name),
  };
}

type StreamAcc = {
  suggestions: CardSuggestion[];
  removals: CardRemoval[];
  analysis: string;
  provider: AISuggestionResult["provider"];
};

function applyStreamEvent(event: StreamEvent, acc: StreamAcc): boolean {
  switch (event.type) {
    case "analysis":
      acc.analysis = event.content;
      acc.provider = event.provider;
      return true;
    case "suggestion":
      acc.suggestions.push(event.data);
      return true;
    case "removal":
      acc.removals.push(event.data);
      return true;
    case "done":
      return false;
    case "error":
      throw new Error(event.message);
  }
}

export function useAISuggestions() {
  const [result, setResult] = useState<AISuggestionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastHash = useRef<string | null>(null);
  const lastResult = useRef<AISuggestionResult | null>(null);

  const analyze = useCallback(async (
    deck: Deck,
    stats: DeckStats,
    bracketScore: BracketScore | null,
  ) => {
    const bracket = bracketScore?.overall ?? deck.targetBracket;
    const hash = hashDeckState(deck, stats, bracket);

    if (hash === lastHash.current && lastResult.current) {
      setResult(lastResult.current);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult({ suggestions: [], removals: [], analysis: "", provider: "mock" });

    try {
      const payload = buildSuggestPayload(deck, stats, bracketScore, bracket);

      const response = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) throw new Error(`AI request failed (${response.status})`);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const acc: StreamAcc = { suggestions: [], removals: [], analysis: "", provider: "mock" };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          let event: StreamEvent;
          try { event = JSON.parse(trimmed) as StreamEvent; } catch { continue; }
          if (applyStreamEvent(event, acc)) {
            setResult({ suggestions: [...acc.suggestions], removals: [...acc.removals], analysis: acc.analysis, provider: acc.provider });
          }
        }
      }
      lastHash.current = hash;
      lastResult.current = { suggestions: acc.suggestions, removals: acc.removals, analysis: acc.analysis, provider: acc.provider };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const invalidateCache = useCallback(() => {
    lastHash.current = null;
    lastResult.current = null;
  }, []);

  return { result, isLoading, error, analyze, invalidateCache };
}
