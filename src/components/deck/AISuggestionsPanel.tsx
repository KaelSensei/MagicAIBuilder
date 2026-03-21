"use client";
// AI-powered deck suggestions panel
import { Sparkles, Loader2, AlertCircle, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/components/ui/utils";
import type { AISuggestionResult } from "@/hooks/useAISuggestions";

interface AISuggestionsPanelProps {
  readonly result: AISuggestionResult | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onAnalyze: () => void;
  readonly onAddCard: (cardName: string) => void;
  readonly onRemoveCard: (cardName: string) => void;
  readonly disabled?: boolean;
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
  onRemoveCard,
  disabled = false,
}: AISuggestionsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [addedCards, setAddedCards] = useState<Set<string>>(new Set());
  const [removedCards, setRemovedCards] = useState<Set<string>>(new Set());

  const handleAdd = (name: string) => { onAddCard(name); setAddedCards((p) => new Set([...p, name])); };
  const handleRemove = (name: string) => { onRemoveCard(name); setRemovedCards((p) => new Set([...p, name])); };

  const hasSuggestions = (result?.suggestions?.length ?? 0) > 0;
  const hasRemovals = (result?.removals?.length ?? 0) > 0;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <button onClick={() => setExpanded((e) => !e)} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors">
        <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
        <span className="text-sm font-medium text-[var(--text-primary)] flex-1 text-left">AI Suggestions</span>
        {result && !isLoading && (
          <span className="text-xs text-[var(--text-secondary)]">
            {result.suggestions.length > 0 && `+${result.suggestions.length}`}
            {result.removals.length > 0 && ` −${result.removals.length}`}
          </span>
        )}
        {isLoading && <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />}
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[var(--text-secondary)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-3">
              <button onClick={onAnalyze} disabled={isLoading || disabled} className={cn("w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all", isLoading || disabled ? "bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed" : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white")}>
                {isLoading ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing…</>) : (<><Sparkles className="w-3.5 h-3.5" />{result ? "Re-analyze" : "Analyze Deck"}</>)}
              </button>

              {disabled && !result && <p className="text-xs text-[var(--text-secondary)] text-center">Add a commander to get suggestions</p>}

              {error && <div className="flex items-center gap-2 text-red-400 text-xs p-2 bg-red-500/10 rounded-lg"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}</div>}

              {result?.analysis && <p className="text-xs text-[var(--text-secondary)] leading-relaxed border-l-2 border-[var(--accent)] pl-2">{result.analysis}</p>}

              {isLoading && !hasSuggestions && !result?.analysis && (
                <div className="space-y-1.5">{[1,2,3].map((i) => <div key={i} className="h-12 rounded-lg bg-[var(--border)] animate-pulse" style={{ opacity: 1 - i * 0.2 }} />)}</div>
              )}

              {hasSuggestions && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">Cards to Add</p>
                  <div className="space-y-1.5">
                    <AnimatePresence initial={false}>
                      {result!.suggestions.map((s) => (
                        <motion.div key={s.name} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-medium text-[var(--text-primary)] truncate">{s.name}</span>
                              <span className={cn("text-[10px] font-medium shrink-0", PRIORITY_COLORS[s.priority])}>{PRIORITY_LABELS[s.priority]}</span>
                            </div>
                            <p className="text-[11px] text-[var(--text-secondary)] leading-tight">{s.reason}</p>
                          </div>
                          <button onClick={() => handleAdd(s.name)} disabled={addedCards.has(s.name)} className={cn("shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white transition-all", addedCards.has(s.name) ? "bg-green-600 cursor-default" : "bg-[var(--accent)] hover:bg-[var(--accent-hover)]")} title={addedCards.has(s.name) ? "Added" : `Add ${s.name}`}>
                            {addedCards.has(s.name) ? <span className="text-xs">✓</span> : <Plus className="w-3 h-3" />}
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {hasRemovals && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">Cards to Cut</p>
                  <div className="space-y-1.5">
                    <AnimatePresence initial={false}>
                      {result!.removals.map((r) => (
                        <motion.div key={r.name} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--background)] border border-red-500/20">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5"><span className="text-xs font-medium text-[var(--text-primary)] truncate">{r.name}</span></div>
                            <p className="text-[11px] text-[var(--text-secondary)] leading-tight">{r.reason}</p>
                          </div>
                          <button onClick={() => handleRemove(r.name)} disabled={removedCards.has(r.name)} className={cn("shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white transition-all", removedCards.has(r.name) ? "bg-[var(--border)] cursor-default" : "bg-red-500 hover:bg-red-600")} title={removedCards.has(r.name) ? "Removed" : `Remove ${r.name}`}>
                            {removedCards.has(r.name) ? <span className="text-xs">✓</span> : <Minus className="w-3 h-3" />}
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {result && <p className="text-[10px] text-[var(--text-secondary)] text-center">Powered by {result.provider === "mock" ? "built-in suggestions" : result.provider}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
