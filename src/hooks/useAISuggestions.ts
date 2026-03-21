"use client";
import { useState } from "react";
import type { Deck, DeckStats } from "@/lib/deck/types";

export interface CardSuggestion {
  name: string;
  reason: string;
  category: string;
  priority: "high" | "medium" | "low";
}

export interface AISuggestionResult {
  suggestions: CardSuggestion[];
  analysis: string;
  provider: "anthropic" | "openai" | "mock";
}

export function useAISuggestions() {
  const [result, setResult] = useState<AISuggestionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (deck: Deck, stats: DeckStats, bracketScore: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
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
        bracket: bracketScore,
        targetBracket: deck.targetBracket,
        budget: deck.budget,
        gameChangersCount: stats.gameChangersCount,
      };

      const response = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("AI request failed");
      const data: AISuggestionResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return { result, isLoading, error, analyze };
}
