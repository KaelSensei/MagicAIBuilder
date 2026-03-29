"use client";
import { useState, useRef, useCallback } from "react";
import type { Deck, DeckStats, BracketScore } from "@/lib/deck/types";
import type { StreamEvent } from "@/app/api/ai/suggest/route";
import { detectArchetypes } from "@/lib/ai/archetypes";
import type { Archetype } from "@/lib/ai/archetypes";
export type { Archetype } from "@/lib/ai/archetypes";

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

function buildSuggestPayload(
  deck: Deck,
  stats: DeckStats,
  bracketScore: BracketScore | null,
  bracket: number,
  archetypeOverride?: Archetype | null,
  budgetPerCard?: number | null
) {
  const cardNames = deck.cards.map((c) => c.name);
  const categories = {
    ramp: stats.ramp,
    draw: stats.draw,
    removal: stats.removal,
    boardWipe: stats.boardWipes,
    creatures: stats.creatures,
    lands: stats.lands,
  };
  const detectedThemes = stats.themes?.map((t) => t.name);

  const archetype = archetypeOverride ?? detectArchetypes({
    cardNames,
    categories,
    detectedThemes,
  })[0];

  // Build card price map for budget filtering (server-side)
  const cardPrices: Record<string, number | null> = {};
  for (const card of deck.cards) {
    cardPrices[card.name] = card.price ?? null;
  }

  return {
    commanderName: deck.commander?.name ?? null,
    partnerName: deck.partner?.name ?? null,
    colorIdentity: [
      ...(deck.commander?.colorIdentity ?? []),
      ...(deck.partner?.colorIdentity ?? []),
    ].filter((v, i, a) => a.indexOf(v) === i),
    cardNames,
    categories,
    avgCmc: stats.avgCmc,
    bracket,
    bracketDimensions: bracketScore?.dimensions,
    bracketWarnings: bracketScore?.warnings,
    targetBracket: deck.targetBracket,
    budget: deck.budget,
    gameChangersCount: stats.gameChangersCount,
    gameChangersList: stats.gameChangersList,
    detectedThemes,
    archetype,
    budgetPerCard: budgetPerCard ?? null,
    cardPrices,
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
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStreamEvent(value: unknown): value is StreamEvent {
  if (!isRecord(value) || typeof value.type !== "string") return false;
  switch (value.type) {
    case "analysis": {
      const p = value.provider;
      return (
        typeof value.content === "string" &&
        (p === "anthropic" || p === "openai" || p === "mock")
      );
    }
    case "suggestion": {
      const d = value.data;
      if (!isRecord(d)) return false;
      const priority = d.priority;
      return (
        typeof d.name === "string" &&
        typeof d.reason === "string" &&
        typeof d.category === "string" &&
        (priority === "high" || priority === "medium" || priority === "low")
      );
    }
    case "removal": {
      const d = value.data;
      return isRecord(d) && typeof d.name === "string" && typeof d.reason === "string";
    }
    case "done":
      return true;
    case "error":
      return typeof value.message === "string";
    default:
      return false;
  }
}

function parseNdjsonLineToEvent(line: string): StreamEvent | undefined {
  const trimmed = line.trim();
  if (!trimmed) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return undefined;
  }
  if (!isStreamEvent(parsed)) return undefined;
  return parsed;
}

function applyNdjsonLine(line: string, acc: StreamAcc, onUpdate: (acc: StreamAcc) => void): void {
  const event = parseNdjsonLineToEvent(line);
  if (event === undefined) return;
  if (applyStreamEvent(event, acc)) {
    onUpdate(acc);
  }
}

/** Reads a NDJSON stream and applies each event to the accumulator, calling onUpdate after each change. */
async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onUpdate: (acc: StreamAcc) => void,
): Promise<StreamAcc> {
  const decoder = new TextDecoder();
  const acc: StreamAcc = { suggestions: [], removals: [], analysis: "", provider: "mock" };
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      applyNdjsonLine(line, acc, onUpdate);
    }
  }
  return acc;
}

export interface AIAnalysisOptions {
  archetypeOverride?: Archetype | null;
  budgetPerCard?: number | null;
}

export function useAISuggestions() {
  const [result, setResult] = useState<AISuggestionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const analyze = useCallback(async (
    deck: Deck,
    stats: DeckStats,
    bracketScore: BracketScore | null,
    options?: AIAnalysisOptions,
  ) => {
    const bracket = bracketScore?.overall ?? deck.targetBracket;
    const hash = hashDeckState(deck, stats, bracket);

    if (hash === lastHash.current && lastResult.current && !options?.archetypeOverride) {
      setResult(lastResult.current);
      return;
    }

    // Detect archetype client-side for display
    const cardNames = deck.cards.map((c) => c.name);
    const categories = { ramp: stats.ramp, draw: stats.draw, removal: stats.removal, boardWipe: stats.boardWipes, creatures: stats.creatures, lands: stats.lands };
    const auto = detectArchetypes({ cardNames, categories, detectedThemes: stats.themes?.map((t) => t.name) });
    setDetectedArchetype(options?.archetypeOverride ?? auto[0] ?? null);

    setIsLoading(true);
    setError(null);
    setResult({ suggestions: [], removals: [], analysis: "", provider: "mock" });

    try {
      const payload = buildSuggestPayload(deck, stats, bracketScore, bracket, options?.archetypeOverride, options?.budgetPerCard);
      const response = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) throw new Error(`AI request failed (${response.status})`);
      if (!response.body) throw new Error("No response body");

      const acc = await processStream(response.body.getReader(), (current) => {
        setResult({ suggestions: [...current.suggestions], removals: [...current.removals], analysis: current.analysis, provider: current.provider });
      });
      lastHash.current = hash;
      lastResult.current = { suggestions: acc.suggestions, removals: acc.removals, analysis: acc.analysis, provider: acc.provider };
      setAnalysedAt(new Date());
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

  return {
    result,
    isLoading,
    error,
    analyze,
    invalidateCache,
    detectedArchetype,
    analysedAt,
    ignoredSuggestions,
    ignoreSuggestion,
    clearIgnored,
  };
}
