"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { LifeHistoryEntry, Phase } from "@/lib/playtest/engine";

interface LifeTrackerProps {
  readonly lifeTotal: number;
  readonly lifeHistory: readonly LifeHistoryEntry[];
  readonly onDamage: (amount: number) => void;
  readonly onHeal: (amount: number) => void;
  readonly onUndo?: () => void;
}

const QUICK_BUTTONS = [
  { label: "+1", action: "heal", amount: 1 },
  { label: "+5", action: "heal", amount: 5 },
  { label: "-1", action: "damage", amount: 1 },
  { label: "-5", action: "damage", amount: 5 },
] as const;

export function LifeTracker({
  lifeTotal,
  lifeHistory,
  onDamage,
  onHeal,
  onUndo,
}: LifeTrackerProps) {
  const t = useTranslations("playtest");
  // Phase names come from the catalog, shared with PhaseTracker, which used to
  // keep its own identical copy.
  const formatPhase = (phase: Phase) => t(`phases.${phase}`);
  const [customInput, setCustomInput] = useState("");
  const isGameOver = lifeTotal <= 0;

  function handleCustomSubmit() {
    const val = Number.parseInt(customInput, 10);
    if (!Number.isNaN(val) && val !== 0) {
      if (val > 0) onHeal(val);
      else onDamage(Math.abs(val));
      setCustomInput("");
    }
  }

  return (
    <div className="bg-[var(--surface)] rounded-xl p-4 space-y-4">
      {/* Life total */}
      <div className="text-center">
        <div
          className={cn(
            "font-black tabular-nums leading-none",
            isGameOver ? "text-red-400 text-6xl" : "text-white text-7xl"
          )}
        >
          {lifeTotal}
        </div>
        {isGameOver && (
          <p className="text-red-400 font-bold mt-1 text-sm uppercase tracking-widest">
            {t("gameOver")}
          </p>
        )}
        <div className="flex items-center justify-center gap-1 mt-1 text-white/40 text-xs">
          <Heart size={12} />
          <span>{t("life.total")}</span>
        </div>
      </div>

      {/* Quick buttons */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_BUTTONS.map(({ label, action, amount }) => (
          <button
            type="button"
            key={label}
            aria-label={label}
            onClick={() =>
              action === "heal" ? onHeal(amount) : onDamage(amount)
            }
            className={cn(
              "py-2 rounded-lg font-bold text-sm transition-colors",
              action === "heal"
                ? "bg-green-600/20 text-green-300 hover:bg-green-600/40"
                : "bg-red-600/20 text-red-300 hover:bg-red-600/40"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex gap-2">
        <input
          type="number"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
          placeholder={t("life.customPlaceholder")}
          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
        />
        <button
          type="button"
          onClick={handleCustomSubmit}
          className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
        >
          {t("life.apply")}
        </button>
      </div>

      {/* Undo */}
      {onUndo && (
        <button
          type="button"
          onClick={onUndo}
          className="w-full py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          ↩ {t("life.undo")}
        </button>
      )}

      {/* Life history */}
      {lifeHistory.length > 0 && (
        <div className="space-y-1 max-h-36 overflow-y-auto">
          <p className="text-xs font-semibold text-white/50 uppercase">
            {t("life.history")}
          </p>
          {[...lifeHistory].reverse().map((entry) => (
            <div
              key={`${entry.timestamp}-${entry.turn}-${entry.phase}-${entry.delta}`}
              className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white/5"
            >
              <span className="text-white/60">
                T{entry.turn} {formatPhase(entry.phase)}
              </span>
              <span
                className={cn(
                  "font-bold",
                  entry.delta > 0 ? "text-green-400" : "text-red-400"
                )}
              >
                {entry.delta > 0 ? "+" : ""}
                {entry.delta}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
