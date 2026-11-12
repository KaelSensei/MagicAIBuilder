"use client";
import { useState, useRef, useCallback } from "react";
import type { Deck } from "@/lib/deck/types";
import type { DeckStats, BracketScore } from "@/lib/deck/analysis-types";
import { detectArchetypes } from "@/lib/ai/archetypes";
import type { Archetype } from "@/lib/ai/archetypes";
import { deckCategoryCounts, hashDeckState, buildSuggestPayload } from "@/lib/ai/suggest-payload";
import { processStream } from "@/lib/ai/suggestion-stream";
import type { AIAnalysisOptions, AISuggestionResult } from "@/lib/ai/suggestion-types";
import {
  readAiCallDenialResponse,
  type AiCallDenial,
} from "@/lib/ai/usage/denial";

export type { Archetype } from "@/lib/ai/archetypes";
export type {
  AIAnalysisOptions,
  AISuggestionResult,
  CardAlternative,
  CardRemoval,
  CardSuggestion,
} from "@/lib/ai/suggestion-types";

/**
 * Runs one assistant analysis and keeps the latest streamed result.
 *
 * An unchanged deck reuses the previous answer unless an archetype override
 * forces a new request.
 *
 * @returns the suggestion state and the actions that change it
 */
export function useAISuggestions() {
  const [result, setResult] = useState<AISuggestionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [denial, setDenial] = useState<AiCallDenial | null>(null);
  const [detectedArchetype, setDetectedArchetype] = useState<Archetype | null>(null);
  const [analysedAt, setAnalysedAt] = useState<Date | null>(null);
  const [ignoredSuggestions, setIgnoredSuggestions] = useState<Set<string>>(new Set());

  const lastHash = useRef<string | null>(null);
  const lastResult = useRef<AISuggestionResult | null>(null);

  const ignoreSuggestion = useCallback((name: string) => {
    setIgnoredSuggestions((prev) => new Set([...prev, name]));
  }, []);

  const clearIgnored = useCallback(() => {
    setIgnoredSuggestions(new Set());
  }, []);

  const analyze = useCallback(
    async (
      deck: Deck,
      stats: DeckStats,
      bracketScore: BracketScore | null,
      options?: AIAnalysisOptions
    ) => {
      const bracket = bracketScore?.overall ?? deck.targetBracket;
      const hash = hashDeckState(deck, stats, bracket, options);

      if (hash === lastHash.current && lastResult.current && !options?.archetypeOverride) {
        setResult(lastResult.current);
        setDenial(null);
        return;
      }

      const cardNames = deck.cards.map((card) => card.name);
      const auto = detectArchetypes({
        cardNames,
        categories: deckCategoryCounts(stats),
        detectedThemes: stats.themes?.map((theme) => theme.name),
      });
      setDetectedArchetype(options?.archetypeOverride ?? auto[0] ?? null);

      setIsLoading(true);
      setError(null);
      setDenial(null);
      setResult({
        suggestions: [],
        removals: [],
        analysis: "",
        provider: "mock",
      });

      try {
        const payload = buildSuggestPayload(deck, stats, bracketScore, bracket, options);
        const response = await fetch("/api/ai/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(60000),
        });

        if (!response.ok) {
          setDenial((await readAiCallDenialResponse(response)) ?? null);
          throw new Error(`AI request failed (${response.status})`);
        }
        if (!response.body) throw new Error("No response body");

        const acc = await processStream(response.body.getReader(), (current) => {
          setResult({
            suggestions: [...current.suggestions],
            removals: [...current.removals],
            analysis: current.analysis,
            provider: current.provider,
          });
        });
        lastHash.current = hash;
        lastResult.current = {
          suggestions: acc.suggestions,
          removals: acc.removals,
          analysis: acc.analysis,
          provider: acc.provider,
        };
        setAnalysedAt(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const invalidateCache = useCallback(() => {
    lastHash.current = null;
    lastResult.current = null;
  }, []);

  return {
    result,
    isLoading,
    error,
    /** Why the server refused the last analysis before calling a model. */
    denial,
    analyze,
    invalidateCache,
    detectedArchetype,
    analysedAt,
    ignoredSuggestions,
    ignoreSuggestion,
    clearIgnored,
  };
}
