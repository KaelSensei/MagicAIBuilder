"use client";
// Bracket score with breakdown
import { motion } from "framer-motion";
import { cn } from "@/components/ui/utils";
import type { BracketScore } from "@/lib/deck/types";
import { BRACKET_DEFINITIONS } from "@/lib/constants/brackets";

interface BracketIndicatorProps {
  score: BracketScore | null;
  targetBracket?: 1 | 2 | 3 | 4;
  className?: string;
}

export function BracketIndicator({ score, targetBracket, className }: BracketIndicatorProps) {
  if (!score) {
    return (
      <div className={cn("rounded-lg bg-[var(--surface)] p-4", className)}>
        <p className="text-xs text-[var(--text-secondary)]">No bracket data yet</p>
      </div>
    );
  }

  const bracketDef = BRACKET_DEFINITIONS[score.overall];
  const dimensions = score.dimensions;

  return (
    <div className={cn("rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4 space-y-3", className)}>
      {/* Main bracket display */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
            Bracket Score
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              className="text-3xl font-bold"
              style={{ color: bracketDef.color }}
            >
              {score.overall}
            </span>
            <span className="text-sm text-[var(--text-secondary)]">
              {bracketDef.name}
            </span>
          </div>
        </div>

        {/* Target bracket indicator */}
        {targetBracket && targetBracket !== score.overall && (
          <div className="text-right">
            <p className="text-xs text-[var(--text-secondary)]">Target</p>
            <p
              className="text-lg font-semibold"
              style={{ color: BRACKET_DEFINITIONS[targetBracket].color }}
            >
              {targetBracket}
            </p>
          </div>
        )}
      </div>

      {/* Bracket progress bar */}
      <div className="flex gap-1">
        {([1, 2, 3, 4] as const).map((b) => (
          <motion.div
            key={b}
            className="h-2 flex-1 rounded-full"
            style={{
              backgroundColor:
                b <= score.overall
                  ? BRACKET_DEFINITIONS[b].color
                  : "var(--border)",
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: (b - 1) * 0.1, duration: 0.3 }}
          />
        ))}
      </div>

      {/* Dimensions */}
      <div className="space-y-1.5">
        {Object.entries(dimensions).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-secondary)] w-20 capitalize">
              {key.replace(/([A-Z])/g, " $1")}
            </span>
            <div className="flex-1 flex gap-0.5">
              {([1, 2, 3, 4] as const).map((b) => (
                <div
                  key={b}
                  className="h-1.5 flex-1 rounded-full"
                  style={{
                    backgroundColor:
                      b <= value
                        ? BRACKET_DEFINITIONS[Math.min(value, 4) as 1|2|3|4].color
                        : "var(--border)",
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Game Changers */}
      {score.gameChangers > 0 && (
        <p className="text-xs text-amber-400">
          ⚡ {score.gameChangers} Game Changer{score.gameChangers > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
