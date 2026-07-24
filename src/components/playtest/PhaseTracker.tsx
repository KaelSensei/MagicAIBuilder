"use client";
import { ChevronRight, SkipForward } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { PHASES, type Phase } from "@/lib/playtest/engine";

interface PhaseTrackerProps {
  readonly turn: number;
  readonly phase: Phase;
  readonly onNextPhase: () => void;
  readonly onNextTurn: () => void;
}

const PHASE_LABELS: Record<Phase, string> = {
  Untap: "Untap",
  Upkeep: "Upkeep",
  Draw: "Draw",
  Main1: "Main 1",
  Combat: "Combat",
  Main2: "Main 2",
  End: "End",
};

export function PhaseTracker({
  turn,
  phase,
  onNextPhase,
  onNextTurn,
}: PhaseTrackerProps) {
  return (
    <div className="bg-[var(--surface)] rounded-xl p-4 space-y-3">
      {/* Turn badge */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">Turn {turn}</h3>
        <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded">
          {PHASE_LABELS[phase]}
        </span>
      </div>

      {/* Phases list */}
      <div className="flex flex-wrap gap-1.5">
        {PHASES.map((p) => (
          <span
            key={p}
            data-testid={`phase-${p}`}
            data-active={p === phase ? "true" : "false"}
            className={cn(
              "px-2 py-1 rounded text-xs font-medium transition-colors",
              p === phase
                ? "bg-blue-600 text-white"
                : "bg-white/10 text-white/50"
            )}
          >
            {PHASE_LABELS[p]}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onNextPhase}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg text-sm font-medium transition-colors"
        >
          <ChevronRight size={16} />
          Next Phase
        </button>
        <button
          type="button"
          onClick={onNextTurn}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-lg text-sm font-medium transition-colors"
        >
          <SkipForward size={16} />
          Next Turn
        </button>
      </div>
    </div>
  );
}
