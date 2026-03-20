"use client";
// Bracket score with breakdown — enhanced UI with dimensions, warnings, animations
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui/utils";
import type { BracketScore } from "@/lib/deck/types";
import { BRACKET_DEFINITIONS } from "@/lib/constants/brackets";
import { AlertTriangle, Zap } from "lucide-react";

interface BracketIndicatorProps {
  score: BracketScore | null;
  targetBracket?: 1 | 2 | 3 | 4;
  className?: string;
}

const DIMENSION_LABELS: Record<string, string> = {
  ramp: "Ramp",
  draw: "Draw",
  removal: "Removal",
  tutors: "Tutors",
  winSpeed: "Win Speed",
  avgCmc: "Avg CMC",
};

const BRACKET_BG: Record<1 | 2 | 3 | 4, string> = {
  1: "bg-green-500/10 border-green-500/30",
  2: "bg-blue-500/10 border-blue-500/30",
  3: "bg-amber-500/10 border-amber-500/30",
  4: "bg-red-500/10 border-red-500/30",
};

const BRACKET_TEXT: Record<1 | 2 | 3 | 4, string> = {
  1: "text-green-400",
  2: "text-blue-400",
  3: "text-amber-400",
  4: "text-red-400",
};

function MiniBar({
  label,
  value,
  bracketColor,
}: {
  label: string;
  value: number;
  bracketColor: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--text-secondary)] w-20 shrink-0">
        {label}
      </span>
      <div className="flex-1 flex gap-0.5">
        {([1, 2, 3, 4] as const).map((b) => (
          <motion.div
            key={b}
            className="h-2 flex-1 rounded-full"
            style={{
              backgroundColor: b <= value ? bracketColor : "var(--border)",
            }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: b * 0.05, duration: 0.2 }}
          />
        ))}
      </div>
      <span className="text-xs text-[var(--text-secondary)] w-4 text-right">
        {value}
      </span>
    </div>
  );
}

export function BracketIndicator({
  score,
  targetBracket,
  className,
}: BracketIndicatorProps) {
  if (!score) {
    return (
      <div className={cn("rounded-lg bg-[var(--surface)] p-4", className)}>
        <p className="text-xs text-[var(--text-secondary)]">
          No bracket data yet
        </p>
      </div>
    );
  }

  const bracketDef = BRACKET_DEFINITIONS[score.overall];
  const bracketColor = bracketDef.color;
  const bgClass = BRACKET_BG[score.overall];
  const textClass = BRACKET_TEXT[score.overall];

  return (
    <div
      className={cn(
        "rounded-lg bg-[var(--surface)] border p-4 space-y-4",
        bgClass,
        className
      )}
    >
      {/* Header: overall bracket + target */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-1">
            Bracket Score
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={score.overall}
              className="flex items-baseline gap-2"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
            >
              <span className={cn("text-4xl font-bold", textClass)}>
                {score.overall}
              </span>
              <span className="text-sm text-[var(--text-secondary)]">
                {bracketDef.name}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {targetBracket && targetBracket !== score.overall && (
          <div className="text-right">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Target</p>
            <span
              className={cn(
                "text-xl font-semibold",
                BRACKET_TEXT[targetBracket]
              )}
            >
              {targetBracket}
            </span>
            <span className="text-xs text-[var(--text-secondary)] ml-1">
              {BRACKET_DEFINITIONS[targetBracket].name}
            </span>
          </div>
        )}
      </div>

      {/* Overall progress bar */}
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
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: (b - 1) * 0.08, duration: 0.3 }}
          />
        ))}
      </div>

      {/* 6 dimension mini-bars */}
      <div className="space-y-2">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
          Dimensions
        </p>
        {Object.entries(score.dimensions).map(([key, value]) => (
          <MiniBar
            key={key}
            label={DIMENSION_LABELS[key] ?? key}
            value={value}
            bracketColor={bracketColor}
          />
        ))}
      </div>

      {/* Game Changers badge */}
      {score.gameChangers > 0 && (
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-400 font-medium">
            {score.gameChangers} Game Changer{score.gameChangers > 1 ? "s" : ""}
            {score.gameChangers > 3
              ? " → Bracket 4 minimum"
              : " → Bracket 3 minimum"}
          </span>
        </div>
      )}

      {/* Warnings */}
      {score.warnings.length > 0 && (
        <div className="space-y-1.5 border-t border-[var(--border)] pt-3">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
            Warnings
          </p>
          {score.warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <span className="text-xs text-[var(--text-secondary)]">
                {warning}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
