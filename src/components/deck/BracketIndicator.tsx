"use client";
// Bracket score with breakdown — supports manual override with amber warning badge
import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui/utils";
import type { BracketLevel, BracketScore } from "@/lib/deck/types";
import { BRACKET_DEFINITIONS } from "@/lib/constants/brackets";
import { AlertTriangle, Zap, X, Infinity } from "lucide-react";

interface BracketIndicatorProps {
  readonly score: BracketScore | null;
  readonly targetBracket?: BracketLevel;
  readonly manualBracket?: BracketLevel | null;
  readonly onManualBracketChange?: (bracket: BracketLevel | null) => void;
  readonly className?: string;
}

// The six dimensions of the bracket engine. Kept separate from `stats.*` even
// where the English word coincides: "Draw" here is a 1–4 score, while
// `stats.cardDraw` is a card count. Same word, different quantity.
const DIMENSION_KEYS = ["ramp", "draw", "removal", "tutors", "winSpeed", "avgCmc"] as const;

const BRACKET_BG: Record<BracketLevel, string> = {
  1: "bg-green-500/10 border-green-500/30",
  2: "bg-blue-500/10 border-blue-500/30",
  3: "bg-amber-500/10 border-amber-500/30",
  4: "bg-red-500/10 border-red-500/30",
};

const BRACKET_TEXT: Record<BracketLevel, string> = {
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
  readonly label: string;
  readonly value: number;
  readonly bracketColor: string;
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
  manualBracket,
  onManualBracketChange,
  className,
}: BracketIndicatorProps) {
  const t = useTranslations("deck");
  // Controls visibility of the inline bracket-picker when no override is active
  const [showPicker, setShowPicker] = useState(false);

  if (!score) {
    return (
      <div className={cn("rounded-lg bg-[var(--surface)] p-4", className)}>
        <p className="text-xs text-[var(--text-secondary)]">
          {t("bracket.noData")}
        </p>
      </div>
    );
  }

  // When a manual override is active, use it as the displayed bracket
  const isOverridden = manualBracket != null;
  const displayBracket = isOverridden ? manualBracket : score.overall;

  const bracketDef = BRACKET_DEFINITIONS[displayBracket];
  const bracketColor = bracketDef.color;
  const bgClass = BRACKET_BG[displayBracket];
  const textClass = BRACKET_TEXT[displayBracket];

  const handleSelectManual = (b: BracketLevel) => {
    onManualBracketChange?.(b);
    setShowPicker(false);
  };

  const handleReset = () => {
    onManualBracketChange?.(null);
    setShowPicker(false);
  };

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
            {t("bracket.score")}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={displayBracket}
              className="flex items-baseline gap-2"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
            >
              <span className={cn("text-4xl font-bold", textClass)}>
                {displayBracket}
              </span>
              <span className="text-sm text-[var(--text-secondary)]">
                {bracketDef.name}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {targetBracket && targetBracket !== displayBracket && (
          <div className="text-right">
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              {t("bracket.target")}
            </p>
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

      {/* Manual override badge — shown when override is active */}
      {isOverridden && (
        <div className="flex items-center gap-2 rounded-md bg-amber-500/15 border border-amber-500/40 px-2.5 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-amber-400">
              {t("bracket.manualOverride", { bracket: manualBracket })}
            </p>
            <p className="text-xs text-amber-400/70">
              {t("bracket.ignoresGameChangers")}
            </p>
          </div>
          {onManualBracketChange && (
            <button
              type="button"
              onClick={handleReset}
              className="text-amber-400/70 hover:text-amber-300 transition-colors shrink-0"
              title={t("bracket.resetToCalculated")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* When no override, show calculated label + optional picker toggle */}
      {!isOverridden && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-secondary)] italic">
            {t("bracket.autoCalculated")}
          </p>
          {onManualBracketChange && (
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-text)] underline underline-offset-2 transition-colors"
            >
              {showPicker ? t("bracket.cancel") : t("bracket.override")}
            </button>
          )}
        </div>
      )}

      {/* Inline bracket picker — visible when showPicker or editing an existing override */}
      <AnimatePresence>
        {(showPicker || isOverridden) && onManualBracketChange && (
          <motion.div
            key="bracket-picker"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-[var(--text-secondary)] mb-2">
              {t("bracket.setManual")}
            </p>
            <div className="flex gap-1.5">
              {([1, 2, 3, 4] as const).map((b) => (
                <button
                  type="button"
                  key={b}
                  onClick={() => handleSelectManual(b)}
                  className={cn(
                    "flex-1 h-8 rounded text-sm font-bold transition-all border",
                    manualBracket === b
                      ? cn(BRACKET_TEXT[b], "border-current bg-current/10")
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                  )}
                  title={BRACKET_DEFINITIONS[b].name}
                >
                  {b}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overall progress bar */}
      <div className="flex gap-1">
        {([1, 2, 3, 4] as const).map((b) => (
          <motion.div
            key={b}
            className="h-2 flex-1 rounded-full"
            style={{
              backgroundColor:
                b <= displayBracket
                  ? BRACKET_DEFINITIONS[b].color
                  : "var(--border)",
            }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: (b - 1) * 0.08, duration: 0.3 }}
          />
        ))}
      </div>

      {/* 6 dimension mini-bars (always shows raw calculated score, not the manual override) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
            {t("bracket.dimensions")}
          </p>
          <p className="text-xs text-[var(--text-secondary)] italic">
            {t("bracket.dimensionsHint")}
          </p>
        </div>
        {DIMENSION_KEYS.map((key) => (
          <MiniBar
            key={key}
            label={t(`bracket.dimension.${key}`)}
            value={score.dimensions[key]}
            bracketColor={bracketColor}
          />
        ))}
      </div>

      {/* 2-card infinite combo badge — forces Bracket 4 per RC rules */}
      {score.twoCardInfiniteCombos > 0 && (
        <div className="flex items-center gap-1.5">
          <Infinity className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-red-400 font-medium">
            {t("bracket.infiniteCombos", { count: score.twoCardInfiniteCombos })}
          </span>
        </div>
      )}

      {/* Game Changers badge */}
      {score.gameChangers > 0 && (
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-400 font-medium">
            {t("bracket.gameChangers", { count: score.gameChangers })}
            {score.gameChangers > 3
              ? t("bracket.gcForcesB4")
              : t("bracket.gcForcesB3")}
          </span>
        </div>
      )}

      {/* Warnings */}
      {score.warnings.length > 0 && (
        <div className="space-y-1.5 border-t border-[var(--border)] pt-3">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
            {t("bracket.warnings")}
          </p>
          {score.warnings.map((warning) => (
            <div key={warning} className="flex items-start gap-1.5">
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
