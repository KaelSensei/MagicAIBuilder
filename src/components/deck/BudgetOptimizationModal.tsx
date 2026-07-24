"use client";
import { X, TrendingDown } from "lucide-react";
import type { BudgetSuggestion } from "@/lib/deck/pricing";

interface BudgetOptimizationModalProps {
  readonly isOpen: boolean;
  readonly totalPrice: number;
  readonly targetBudget: number;
  readonly suggestions: readonly BudgetSuggestion[];
  readonly onApplySuggestion: (cardId: string) => void;
  readonly onClose: () => void;
}

export function BudgetOptimizationModal({
  isOpen,
  totalPrice,
  targetBudget,
  suggestions,
  onApplySuggestion,
  onClose,
}: BudgetOptimizationModalProps) {
  if (!isOpen) return null;

  const totalSavings = suggestions.reduce((sum, s) => sum + s.savingsAmount, 0);
  const isGoalReached = suggestions.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close budget optimization modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <dialog
        open
        aria-labelledby="budget-optimization-title"
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
        className="relative z-10 m-0 rounded-xl border-none bg-[var(--background)] p-0 shadow-2xl max-w-xl w-full max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <TrendingDown size={20} className="text-green-400" />
            <h2
              id="budget-optimization-title"
              className="text-lg font-bold text-white"
            >
              Budget Optimization
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between px-5 py-3 bg-white/5 text-sm">
          <span className="text-white/60">
            Current:{" "}
            <span className="text-white font-semibold">
              €{totalPrice.toFixed(2)}
            </span>
          </span>
          <span className="text-white/40">→</span>
          <span className="text-white/60">
            Target:{" "}
            <span className="text-green-400 font-semibold">
              €{targetBudget.toFixed(2)}
            </span>
          </span>
          {totalSavings > 0 && (
            <span className="text-green-400 font-bold">
              Save up to €{totalSavings.toFixed(2)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isGoalReached ? (
            <div className="text-center py-10 text-white/50">
              <p className="text-2xl mb-2">✓</p>
              <p className="font-medium">Budget goal reached!</p>
              <p className="text-sm mt-1 text-white/30">
                Your deck is already within budget.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {suggestions.map((s) => (
                <div
                  key={s.cardToReplace.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {s.cardToReplace.name}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      → {s.suggestedReplacement}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-white/50">
                      €{s.currentPrice.toFixed(2)} → €
                      {s.suggestedPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-green-400 font-semibold">
                      Save €{s.savingsAmount.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onApplySuggestion(s.cardToReplace.id)}
                    aria-label="Apply"
                    className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-300 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}
