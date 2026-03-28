"use client";
// AI-powered deck suggestions panel — with archetype selector, budget filter, timestamps, ignore
import { Sparkles, Loader2, AlertCircle, Plus, Minus, ChevronDown, ChevronUp, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/components/ui/utils";
import type { AISuggestionResult } from "@/hooks/useAISuggestions";
import { ARCHETYPES } from "@/lib/ai/archetypes";
import type { Archetype } from "@/lib/ai/archetypes";

const BUDGET_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: "No limit", value: null },
  { label: "< $1", value: 1 },
  { label: "< $5", value: 5 },
  { label: "< $10", value: 10 },
  { label: "< $25", value: 25 },
];

interface AISuggestionsPanelProps {
  readonly result: AISuggestionResult | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onAnalyze: () => void;
  readonly onAddCard: (cardName: string) => void;
  readonly onRemoveCard: (cardName: string) => void;
  readonly disabled?: boolean;
  // Enhanced props
  readonly detectedArchetype?: Archetype | null;
  readonly archetypeOverride?: Archetype | null;
  readonly onArchetypeChange?: (archetype: Archetype | null) => void;
  readonly budgetPerCard?: number | null;
  readonly onBudgetPerCardChange?: (budget: number | null) => void;
  readonly analysedAt?: Date | null;
  readonly ignoredSuggestions?: ReadonlySet<string>;
  readonly onIgnoreSuggestion?: (name: string) => void;
  readonly onClearIgnored?: () => void;
}

const PRIORITY_COLORS = { high: "text-red-400", medium: "text-amber-400", low: "text-[var(--text-secondary)]" };
const PRIORITY_LABELS = { high: "High", medium: "Med", low: "Low" };

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  return `${mins} min ago`;
}

export function AISuggestionsPanel({
  result, isLoading, error, onAnalyze, onAddCard, onRemoveCard, disabled = false,
  detectedArchetype, archetypeOverride, onArchetypeChange,
  budgetPerCard, onBudgetPerCardChange,
  analysedAt, ignoredSuggestions, onIgnoreSuggestion, onClearIgnored,
}: AISuggestionsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [addedCards, setAddedCards] = useState<Set<string>>(new Set());
  const [removedCards, setRemovedCards] = useState<Set<string>>(new Set());
  const [showIgnored, setShowIgnored] = useState(false);

  const handleAdd = (name: string) => { onAddCard(name); setAddedCards((p) => new Set([...p, name])); };
  const handleRemove = (name: string) => { onRemoveCard(name); setRemovedCards((p) => new Set([...p, name])); };
  const handleIgnore = (name: string) => { onIgnoreSuggestion?.(name); };

  const ignoredCount = ignoredSuggestions?.size ?? 0;
  const effectiveArchetype = archetypeOverride ?? detectedArchetype;

  const visibleSuggestions = (result?.suggestions ?? []).filter(
    (s) => showIgnored || !ignoredSuggestions?.has(s.name)
  );
  const hasSuggestions = visibleSuggestions.length > 0;
  const hasRemovals = (result?.removals?.length ?? 0) > 0;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      {/* Header */}
      <button onClick={() => setExpanded((e) => !e)} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--surface-hover)] transition-colors">
        <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" />
        <span className="text-sm font-medium text-[var(--text-primary)] flex-1 text-left">AI Suggestions</span>
        {effectiveArchetype && !isLoading && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-medium">
            {effectiveArchetype}
          </span>
        )}
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

              {/* Archetype selector */}
              {onArchetypeChange && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                    Archetype {detectedArchetype && archetypeOverride === null && <span className="normal-case font-normal opacity-70">(detected: {detectedArchetype})</span>}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {ARCHETYPES.map((arch) => (
                      <button
                        key={arch}
                        onClick={() => onArchetypeChange(archetypeOverride === arch ? null : arch)}
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                          (archetypeOverride === arch || (!archetypeOverride && detectedArchetype === arch))
                            ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50"
                        )}
                      >
                        {arch}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget per card selector */}
              {onBudgetPerCardChange && (
                <div className="flex items-center gap-2">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold shrink-0">Budget/card</p>
                  <div className="flex gap-1 flex-wrap">
                    {BUDGET_OPTIONS.map(({ label, value }) => (
                      <button
                        key={label}
                        onClick={() => onBudgetPerCardChange(value)}
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                          budgetPerCard === value
                            ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Analyze button + timestamp */}
              <div className="space-y-1">
                <button onClick={onAnalyze} disabled={isLoading || disabled} className={cn("w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all", isLoading || disabled ? "bg-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed" : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white")}>
                  {isLoading ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing…</>) : (<><Sparkles className="w-3.5 h-3.5" />{result ? "Re-analyze" : "Analyze Deck"}</>)}
                </button>
                {analysedAt && !isLoading && (
                  <p className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] justify-center">
                    <Clock className="w-2.5 h-2.5" />
                    Analysed {timeAgo(analysedAt)}
                  </p>
                )}
              </div>

              {disabled && !result && <p className="text-xs text-[var(--text-secondary)] text-center">Add a commander to get suggestions</p>}

              {error && (
                <div className="flex items-start gap-2 text-red-400 text-xs p-2 bg-red-500/10 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                  <button onClick={onAnalyze} className="ml-auto shrink-0 underline hover:no-underline">Retry</button>
                </div>
              )}

              {result?.analysis && <p className="text-xs text-[var(--text-secondary)] leading-relaxed border-l-2 border-[var(--accent)] pl-2">{result.analysis}</p>}

              {isLoading && !hasSuggestions && !result?.analysis && (
                <div className="space-y-1.5">{[1,2,3].map((i) => <div key={i} className="h-12 rounded-lg bg-[var(--border)] animate-pulse" style={{ opacity: 1 - i * 0.2 }} />)}</div>
              )}

              {/* Suggestions */}
              {hasSuggestions && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">Cards to Add</p>
                    {ignoredCount > 0 && (
                      <button onClick={() => { setShowIgnored((v) => !v); }} className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">
                        {showIgnored ? "Hide" : `${ignoredCount} ignored`}
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <AnimatePresence initial={false}>
                      {visibleSuggestions.map((s) => {
                        const isIgnored = ignoredSuggestions?.has(s.name);
                        return (
                          <motion.div key={s.name} initial={{ opacity: 0, y: -4 }} animate={{ opacity: isIgnored ? 0.4 : 1, y: 0 }} transition={{ duration: 0.15 }} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-xs font-medium text-[var(--text-primary)] truncate">{s.name}</span>
                                <span className={cn("text-[10px] font-medium shrink-0", PRIORITY_COLORS[s.priority])}>{PRIORITY_LABELS[s.priority]}</span>
                              </div>
                              <p className="text-[11px] text-[var(--text-secondary)] leading-tight">{s.reason}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!isIgnored && onIgnoreSuggestion && (
                                <button onClick={() => handleIgnore(s.name)} className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all" title="Ignore suggestion">
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                              <button onClick={() => handleAdd(s.name)} disabled={addedCards.has(s.name)} className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white transition-all", addedCards.has(s.name) ? "bg-green-600 cursor-default" : "bg-[var(--accent)] hover:bg-[var(--accent-hover)]")} title={addedCards.has(s.name) ? "Added" : `Add ${s.name}`}>
                                {addedCards.has(s.name) ? <span className="text-xs">✓</span> : <Plus className="w-3 h-3" />}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                  {ignoredCount > 0 && !showIgnored && onClearIgnored && (
                    <button onClick={onClearIgnored} className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">
                      Clear {ignoredCount} ignored
                    </button>
                  )}
                </div>
              )}

              {/* Removals */}
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
