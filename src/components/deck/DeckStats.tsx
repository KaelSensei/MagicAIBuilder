"use client";
// Live stats panel
import { cn } from "@/components/ui/utils";
import type { DeckStats } from "@/lib/deck/types";
import { ManaCurve } from "./ManaCurve";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface DeckStatsProps {
  stats: DeckStats | null;
  className?: string;
}

interface StatRowProps {
  label: string;
  value: string | number;
  status?: "ok" | "warn" | "error" | "neutral";
}

function StatRow({ label, value, status = "neutral" }: StatRowProps) {
  const icon =
    status === "ok" ? (
      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
    ) : status === "warn" ? (
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
    ) : status === "error" ? (
      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
    ) : null;

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      </div>
      <span className="text-xs font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

export function DeckStats({ stats, className }: DeckStatsProps) {
  if (!stats) {
    return (
      <div className={cn("rounded-lg bg-[var(--surface)] p-4", className)}>
        <p className="text-xs text-[var(--text-secondary)]">Build your deck to see stats</p>
      </div>
    );
  }

  const cardCountStatus =
    stats.totalCards === 100
      ? "ok"
      : stats.totalCards > 100
      ? "error"
      : "warn";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Mana Curve */}
      <ManaCurve curve={stats.manaCurve} />

      {/* Deck checks */}
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
          <StatRow
            label="Lands"
            value={stats.lands}
            status={stats.lands >= 33 ? "ok" : "warn"}
          />
          <StatRow
            label="Ramp"
            value={stats.ramp}
            status={stats.ramp >= 8 ? "ok" : "warn"}
          />
          <StatRow
            label="Card draw"
            value={stats.draw}
            status={stats.draw >= 8 ? "ok" : "warn"}
          />
          <StatRow
            label="Removal"
            value={stats.removal}
            status={stats.removal >= 5 ? "ok" : "warn"}
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
