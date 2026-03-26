"use client";
// Live stats panel with bracket-aware benchmarks and mana alignment analysis
import { useState } from "react";
import { cn } from "@/components/ui/utils";
import type { DeckStats } from "@/lib/deck/types";
import { ManaCurve } from "./ManaCurve";
import { ColorDistribution } from "./ColorDistribution";
import { ThemeDetector } from "./ThemeDetector";
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";

const MANA_IMBALANCE_THRESHOLD = 15;

const COLOR_NAMES: Record<string, string> = { W: "White", U: "Blue", B: "Black", R: "Red", G: "Green" };
const COLOR_HEX: Record<string, string> = { W: "#f9f6e8", U: "#aad4f0", B: "#b0a0c8", R: "#f9a98a", G: "#a0d4a8" };

type BracketLevel = 1 | 2 | 3 | 4;

interface DeckStatsProps {
  readonly stats: DeckStats | null;
  readonly targetBracket?: BracketLevel;
  readonly className?: string;
}

const BRACKET_TARGETS: Record<BracketLevel, { ramp: number; draw: number; removal: number; lands: number }> = {
  1: { ramp: 8,  draw: 7,  removal: 5,  lands: 37 },
  2: { ramp: 10, draw: 9,  removal: 7,  lands: 36 },
  3: { ramp: 12, draw: 11, removal: 8,  lands: 35 },
  4: { ramp: 14, draw: 12, removal: 10, lands: 33 },
};

function pct(value: number, target: number): number { return Math.round((value / target) * 100); }

function getRatioStatus(ratio: number): "ok" | "warn" | "error" {
  if (ratio >= 90) return "ok";
  if (ratio >= 70) return "warn";
  return "error";
}

function getStatusColor(status: "ok" | "warn" | "error" | "neutral"): string {
  if (status === "ok") return "text-green-400";
  if (status === "warn") return "text-amber-400";
  if (status === "error") return "text-red-400";
  return "";
}

function getStatusIcon(status: "ok" | "warn" | "error" | "neutral") {
  if (status === "ok") return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
  if (status === "warn") return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
  if (status === "error") return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
  return null;
}

interface BenchmarkRowProps {
  readonly label: string; readonly value: number; readonly target: number; readonly bracket: BracketLevel;
}

function BenchmarkRow({ label, value, target, bracket }: BenchmarkRowProps) {
  const ratio = pct(value, target);
  const status = getRatioStatus(ratio);
  const color = getStatusColor(status);
  const icon = status === "ok"
    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
    : <AlertTriangle className={cn("w-3.5 h-3.5", status === "warn" ? "text-amber-400" : "text-red-500")} />;
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-1.5">{icon}<span className="text-xs text-[var(--text-secondary)]">{label}</span></div>
      <span className={cn("text-xs font-medium", color)}>
        {value}/{target}{" "}<span className="text-[var(--text-secondary)] font-normal">(target for B{bracket})</span>
      </span>
    </div>
  );
}
BenchmarkRow.displayName = "BenchmarkRow";

interface StatRowProps { readonly label: string; readonly value: string | number; readonly status?: "ok" | "warn" | "error" | "neutral"; }

function StatRow({ label, value, status = "neutral" }: StatRowProps) {
  const icon = getStatusIcon(status);
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-1.5">{icon}<span className="text-xs text-[var(--text-secondary)]">{label}</span></div>
      <span className="text-xs font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
StatRow.displayName = "StatRow";

interface ManaAlignmentSectionProps { readonly stats: DeckStats; }

/** Collapsible per-color mana symbol % vs land production % panel. Flags |gap| > threshold in amber. */
function ManaAlignmentSection({ stats }: ManaAlignmentSectionProps) {
  const [open, setOpen] = useState(false);
  const colors = Object.keys(stats.manaSymbolRatio);
  if (colors.length === 0) return null;
  const hasImbalance = Object.values(stats.manaImbalance).some((v) => Math.abs(v) > MANA_IMBALANCE_THRESHOLD);
  return (
    <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
      <button type="button" className="flex items-center justify-between w-full" onClick={() => setOpen((prev) => !prev)}>
        <div className="flex items-center gap-1.5">
          {hasImbalance && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Mana Alignment</p>
        </div>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide w-16">Color</span>
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide flex-1 text-center">Symbols %</span>
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide flex-1 text-center">Lands %</span>
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide w-16 text-right">Gap</span>
          </div>
          {colors.map((color) => {
            const symPct = stats.manaSymbolRatio[color] ?? 0;
            const prodPct = stats.manaProductionRatio[color] ?? 0;
            const gap = stats.manaImbalance[color] ?? 0;
            const imbalanced = Math.abs(gap) > MANA_IMBALANCE_THRESHOLD;
            return (
              <div key={color} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 w-16">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLOR_HEX[color] ?? "#888" }} />
                  <span className="text-xs text-[var(--text-primary)]">{COLOR_NAMES[color] ?? color}</span>
                </div>
                <span className="text-xs flex-1 text-center text-[var(--text-primary)]">{symPct}%</span>
                <span className="text-xs flex-1 text-center text-[var(--text-primary)]">{prodPct}%</span>
                <div className="w-16 flex items-center justify-end gap-1">
                  {imbalanced && <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                  <span className={cn("text-xs font-medium", imbalanced ? "text-amber-400" : "text-[var(--text-secondary)]")}>
                    {gap > 0 ? "+" : ""}{gap}%
                  </span>
                </div>
              </div>
            );
          })}
          {hasImbalance && <p className="text-[10px] text-amber-400/80 mt-1">Warning: gap &gt; {MANA_IMBALANCE_THRESHOLD}% may indicate a mana-base imbalance</p>}
        </div>
      )}
    </div>
  );
}
ManaAlignmentSection.displayName = "ManaAlignmentSection";

/** Live deck statistics panel with bracket-aware benchmarks and mana alignment. */
export function DeckStats({ stats, targetBracket = 2, className }: DeckStatsProps) {
  if (!stats) {
    return (
      <div className={cn("rounded-lg bg-[var(--surface)] p-4", className)}>
        <p className="text-xs text-[var(--text-secondary)]">Build your deck to see stats</p>
      </div>
    );
  }
  const targets = BRACKET_TARGETS[targetBracket];
  let cardCountStatus: "ok" | "warn" | "error";
  if (stats.totalCards === 100) { cardCountStatus = "ok"; }
  else if (stats.totalCards > 100) { cardCountStatus = "error"; }
  else { cardCountStatus = "warn"; }

  return (
    <div className={cn("space-y-3", className)}>
      <ManaCurve curve={stats.manaCurve} />
      {Object.keys(stats.colorDistribution).length > 0 && <ColorDistribution distribution={stats.colorDistribution} />}
      {(stats.themes ?? []).length > 0 && <ThemeDetector themes={stats.themes} maxThemes={3} />}
      <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">Deck Checks</p>
        <div className="divide-y divide-[var(--border)]">
          <StatRow label="Total cards" value={`${stats.totalCards}/100`} status={cardCountStatus} />
          <BenchmarkRow label="Lands" value={stats.lands} target={targets.lands} bracket={targetBracket} />
          <BenchmarkRow label="Ramp" value={stats.ramp} target={targets.ramp} bracket={targetBracket} />
          <BenchmarkRow label="Card draw" value={stats.draw} target={targets.draw} bracket={targetBracket} />
          <BenchmarkRow label="Removal" value={stats.removal} target={targets.removal} bracket={targetBracket} />
          <StatRow label="Avg CMC (spells)" value={stats.avgCmcWithoutLands.toFixed(2)} status={stats.avgCmcWithoutLands <= 3.5 ? "ok" : "warn"} />
          <StatRow label="Avg CMC (with lands)" value={stats.avgCmcWithLands.toFixed(2)} status="neutral" />
          <StatRow label="Turn 1 playable" value={`${stats.turn1Playable} cards`} status="neutral" />
          {stats.flexibleLands > 0 && <StatRow label="Flexible lands (MDFC)" value={stats.flexibleLands} status="neutral" />}
          {stats.bannedCards.length > 0 && <StatRow label="Banned cards" value={stats.bannedCards.length} status="error" />}
        </div>
      </div>
      {Object.keys(stats.manaSymbolRatio).length > 0 && <ManaAlignmentSection stats={stats} />}
      {stats.totalPrice > 0 && (
        <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">Budget</p>
          <div className="divide-y divide-[var(--border)]">
            <StatRow label="Total value" value={`$${stats.totalPrice.toFixed(2)}`} status="neutral" />
            {stats.overBudgetCards.length > 0 && <StatRow label="Over budget" value={stats.overBudgetCards.length} status="warn" />}
          </div>
        </div>
      )}
    </div>
  );
}
DeckStats.displayName = "DeckStats";
