"use client";
// Live stats panel with bracket-aware benchmarks
import { cn } from "@/components/ui/utils";
import type { DeckStats } from "@/lib/deck/types";
import { ManaCurve } from "./ManaCurve";
import { ColorDistribution } from "./ColorDistribution";
import { ThemeDetector } from "./ThemeDetector";
import { CheckCircle2, AlertTriangle } from "lucide-react";

type BracketLevel = 1 | 2 | 3 | 4;

interface DeckStatsProps {
  readonly stats: DeckStats | null;
  readonly targetBracket?: BracketLevel;
  readonly className?: string;
}

// Bracket-specific targets for each stat
const BRACKET_TARGETS: Record<
  BracketLevel,
  { ramp: number; draw: number; removal: number; lands: number }
> = {
  1: { ramp: 8,  draw: 7,  removal: 5,  lands: 37 },
  2: { ramp: 10, draw: 9,  removal: 7,  lands: 36 },
  3: { ramp: 12, draw: 11, removal: 8,  lands: 35 },
  4: { ramp: 14, draw: 12, removal: 10, lands: 33 },
};

function pct(value: number, target: number) {
  return Math.round((value / target) * 100);
}

interface BenchmarkRowProps {
  readonly label: string;
  readonly value: number;
  readonly target: number;
  readonly bracket: 1 | 2 | 3 | 4;
}

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

function BenchmarkRow({ label, value, target, bracket }: BenchmarkRowProps) {
  const ratio = pct(value, target);
  const status = getRatioStatus(ratio);
  const color = getStatusColor(status);

  const icon =
    status === "ok" ? (
      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
    ) : (
      <AlertTriangle
        className={cn(
          "w-3.5 h-3.5",
          status === "warn" ? "text-amber-400" : "text-red-500"
        )}
      />
    );

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      </div>
      <span className={cn("text-xs font-medium", color)}>
        {value}/{target}{" "}
        <span className="text-[var(--text-secondary)] font-normal">
          (target for B{bracket})
        </span>
      </span>
    </div>
  );
}

interface StatRowProps {
  readonly label: string;
  readonly value: string | number;
  readonly status?: "ok" | "warn" | "error" | "neutral";
}

function getStatusIcon(status: "ok" | "warn" | "error" | "neutral") {
  if (status === "ok") return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
  if (status === "warn") return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
  if (status === "error") return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />;
  return null;
}

function StatRow({ label, value, status = "neutral" }: StatRowProps) {
  const icon = getStatusIcon(status);

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      </div>
      <span className="text-xs font-medium text-[var(--text-primary)]">
        {value}
      </span>
    </div>
  );
}

export function DeckStats({ stats, targetBracket = 2, className }: DeckStatsProps) {
  if (!stats) {
    return (
      <div className={cn("rounded-lg bg-[var(--surface)] p-4", className)}>
        <p className="text-xs text-[var(--text-secondary)]">
          Build your deck to see stats
        </p>
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
      {/* Mana Curve */}
      <ManaCurve curve={stats.manaCurve} />

      {/* Color Distribution */}
      {Object.keys(stats.colorDistribution).length > 0 && (
        <ColorDistribution distribution={stats.colorDistribution} />
      )}

      {/* Archetypes */}
      {(stats.themes ?? []).length > 0 && (
        <ThemeDetector themes={stats.themes} maxThemes={3} />
      )}

      {/* Deck checks with bracket targets */}
      <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">
          Deck Checks
        </p>
        <div className="divide-y divide-[var(--border)]">
          <StatRow
            label="Total cards"
            value={`${stats.totalCards}/100`}
            status={cardCountStatus}
          />
          <BenchmarkRow
            label="Lands"
            value={stats.lands}
            target={targets.lands}
            bracket={targetBracket}
          />
          <BenchmarkRow
            label="Ramp"
            value={stats.ramp}
            target={targets.ramp}
            bracket={targetBracket}
          />
          <BenchmarkRow
            label="Card draw"
            value={stats.draw}
            target={targets.draw}
            bracket={targetBracket}
          />
          <BenchmarkRow
            label="Removal"
            value={stats.removal}
            target={targets.removal}
            bracket={targetBracket}
          />
          <StatRow
            label="Avg CMC"
            value={stats.avgCmc.toFixed(2)}
            status={stats.avgCmc <= 3.5 ? "ok" : "warn"}
          />
          {stats.bannedCards.length > 0 && (
            <StatRow
              label="Banned cards"
              value={stats.bannedCards.length}
              status="error"
            />
          )}
        </div>
      </div>

      {/* Budget */}
      {stats.totalPrice > 0 && (
        <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">
            Budget
          </p>
          <div className="divide-y divide-[var(--border)]">
            <StatRow
              label="Total value"
              value={`$${stats.totalPrice.toFixed(2)}`}
              status="neutral"
            />
            {stats.overBudgetCards.length > 0 && (
              <StatRow
                label="Over budget"
                value={stats.overBudgetCards.length}
                status="warn"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
