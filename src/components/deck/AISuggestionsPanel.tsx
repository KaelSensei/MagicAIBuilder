"use client";
// AI-powered deck suggestions panel
import { Sparkles, Loader2, AlertCircle, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/components/ui/utils";
import type { AISuggestionResult } from "@/hooks/useAISuggestions";

interface AISuggestionsPanelProps {
  result: AISuggestionResult | null;
  isLoading: boolean;
  error: string | null;
  onAnalyze: () => void;
  onAddCard: (cardName: string) => void;
  disabled?: boolean;
}

const PRIORITY_COLORS = {
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-[var(--text-secondary)]",
};

const PRIORITY_LABELS = {
  high: "High",
  medium: "Med",
  low: "Low",
};

export function AISuggestionsPanel({
  result,
  isLoading,
  error,
  onAnalyze,
  onAddCard,
  disabled = false,
}: AISuggestionsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [addedCards, setAddedCards] = useState<Set<string>>(new Set());

  const handleAdd = (name: string) => {
    onAddCard(name);
    setAddedCards((prev) => new Set([...prev, name]));
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors"
      >
        <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
        <span className="text-sm font-medium text-[var(--text-primary)] flex-1 text-left">
          AI Suggestions
        </span>
        {result && !isLoading && (
          <span className="text-xs text-[var(--text-secondary)]">
            {result.suggestions.length} cards
          </span>
        )}
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Analyze button */}
              <button
                onClick={onAnalyze}
                disabled={isLoading || disabled}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                  isLoading || disabled
                    ? "bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed"
                    : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    {result ? "Re-analyze" : "Analyze Deck"}
                  </>
                )}
              </button>

              {disabled && !result && (
                <p className="text-xs text-[var(--text-secondary)] text-center">
                  Add a commander to get suggestions
                </p>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs p-2 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Analysis */}
              {result?.analysis && (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed border-l-2 border-[var(--accent)] pl-2">
                  {result.analysis}
                </p>
              )}

              {/* Suggestions */}
              {result?.suggestions && result.suggestions.length > 0 && (
                <div className="space-y-1.5">
                  {result.suggestions.map((suggestion) => (
                    <div
                      key={suggestion.name}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                            {suggestion.name}
                          </span>
                          <span className={cn("text-[10px] font-medium shrink-0", PRIORITY_COLORS[suggestion.priority])}>
                            {PRIORITY_LABELS[suggestion.priority]}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                          {suggestion.reason}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAdd(suggestion.name)}
                        disabled={addedCards.has(suggestion.name)}
                        className={cn(
                          "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white transition-all",
                          addedCards.has(suggestion.name)
                            ? "bg-green-600 cursor-default"
                            : "bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
                        )}
                        title={addedCards.has(suggestion.name) ? "Added" : `Add ${suggestion.name}`}
                      >
                        {addedCards.has(suggestion.name) ? (
                          <span className="text-xs">✓</span>
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {result && (
                <p className="text-[10px] text-[var(--text-secondary)] text-center">
                  Powered by {result.provider === "mock" ? "built-in suggestions" : result.provider}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
