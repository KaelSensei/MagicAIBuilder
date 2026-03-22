"use client";
// Commander Spellbook combo detection panel
import { cn } from "@/components/ui/utils";
import type { SpellbookVariant } from "@/lib/combos/spellbook";
import { Zap, Loader2 } from "lucide-react";

interface CombosPanelProps {
  readonly combos?: readonly SpellbookVariant[];
  readonly isLoading?: boolean;
  readonly isEnabled?: boolean; // False when deck < 10 cards
  readonly className?: string;
}

function ComboCard({ combo }: { combo: SpellbookVariant }) {
  return (
    <div className="rounded bg-[var(--surface-hover)] border border-[var(--border)] p-3 space-y-2">
      {/* Cards involved */}
      <div className="flex flex-wrap gap-1">
        {combo.cards.map((cardName) => (
          <span
            key={cardName}
            className="px-1.5 py-0.5 text-xs rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-medium"
          >
            {cardName}
          </span>
        ))}
      </div>

      {/* Effects */}
      <div className="flex flex-wrap gap-1">
        {combo.effects.map((effect) => (
          <span
            key={effect}
            className={cn(
              "px-1.5 py-0.5 text-xs rounded border font-medium",
              combo.isInfinite
                ? "bg-red-500/15 text-red-300 border-red-500/30"
                : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]"
            )}
          >
            {combo.isInfinite && "♾ "}
            {effect}
          </span>
        ))}
      </div>

      {/* Description */}
      {combo.description && (
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {combo.description}
        </p>
      )}
    </div>
  );
}

export function CombosPanel({
  combos,
  isLoading,
  isEnabled = true,
  className,
}: CombosPanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4 space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
          Combos
        </p>
        {isLoading && (
          <Loader2 className="w-3.5 h-3.5 text-[var(--text-secondary)] animate-spin" />
        )}
        {!isLoading && combos && combos.length > 0 && (
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            {combos.length} found
          </span>
        )}
      </div>

      {!isEnabled && (
        <p className="text-xs text-[var(--text-secondary)] italic">
          Add at least 10 cards to detect combos
        </p>
      )}

      {isEnabled && isLoading && (
        <p className="text-xs text-[var(--text-secondary)] italic">
          Checking Commander Spellbook…
        </p>
      )}

      {isEnabled && !isLoading && (combos?.length ?? 0) === 0 && (
        <p className="text-xs text-[var(--text-secondary)] italic">
          No known combos detected
        </p>
      )}

      {isEnabled && !isLoading && combos && combos.length > 0 && (
        <div className="space-y-2">
          {/* Infinite combos first */}
          {combos.some((c) => c.isInfinite) && (
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-medium text-red-400">
                Infinite combos
              </span>
            </div>
          )}
          {combos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      )}
    </div>
  );
}
