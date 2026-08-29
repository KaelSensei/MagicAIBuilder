"use client";
// Live stats panel with bracket-aware benchmarks
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";
import type { DeckStats, DeckCard } from "@/lib/deck/types";
import { buildTokenLibrary } from "@/lib/deck/token-library";
import type { DeckFormat } from "@/lib/deck/formats";
import { getFormatConfig } from "@/lib/deck/formats";
import type { BenchmarkStatus, FormatStats } from "@/lib/deck/format-stats";
import type { AlignmentStatus, ManaAlignment } from "@/lib/deck/mana-alignment";
import type { TurnOnePlayability } from "@/lib/deck/turn-one";
import { ManaCurve } from "./ManaCurve";
import { ColorDistribution } from "./ColorDistribution";
import { ThemeDetector } from "./ThemeDetector";
import { DeckPriceDisplay } from "./DeckPriceDisplay";
import { CheckCircle2, AlertTriangle } from "lucide-react";

type BracketLevel = 1 | 2 | 3 | 4;

interface DeckStatsProps {
  readonly stats: DeckStats | null;
  readonly format: DeckFormat;
  readonly cards?: readonly DeckCard[];
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

type StatusLevel = "ok" | "warn" | "error" | "neutral";

function getStatusColor(status: StatusLevel): string {
  if (status === "ok") return "text-green-400";
  if (status === "warn") return "text-amber-400";
  if (status === "error") return "text-red-400";
  return "";
}

function BenchmarkRow({ label, value, target, bracket }: BenchmarkRowProps) {
  const tDeck = useTranslations("deck");
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
          {tDeck("stats.targetForBracket", { bracket })}
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

/** @returns the icon colour matching a benchmark verdict */
function statusFromBenchmark(status: BenchmarkStatus): StatusLevel {
  return status === "on-target" ? "ok" : "warn";
}

/** @returns a 0–1 share rendered as a whole percentage */
function asPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/**
 * Curve, threat and interaction readings for non-Commander formats.
 * Commander gets bracket scoring instead, so `stats.formatStats` is null there.
 */
function FormatStatsPanel({
  formatStats,
  formatLabel,
}: {
  readonly formatStats: FormatStats;
  readonly formatLabel: string;
}) {
  const t = useTranslations("deck");

  return (
    <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">
        {t("stats.formatChecks", { format: formatLabel })}
      </p>
      <div className="divide-y divide-[var(--border)]">
        <StatRow
          label={t("stats.curve")}
          value={`${formatStats.avgCmcTarget[0]}–${formatStats.avgCmcTarget[1]}`}
          status={statusFromBenchmark(formatStats.curveStatus)}
        />
        <StatRow
          label={t("stats.threatDensity")}
          value={`${formatStats.threats} · ${asPercent(formatStats.threatDensity)}`}
          status={statusFromBenchmark(formatStats.threatStatus)}
        />
        <StatRow
          label={t("stats.interaction")}
          value={`${formatStats.interaction} · ${asPercent(formatStats.interactionRatio)}`}
          status={statusFromBenchmark(formatStats.interactionStatus)}
        />
      </div>
      <p className="mt-2 text-[10px] leading-snug text-[var(--text-secondary)] opacity-70">
        {t("stats.formatStatsHint")}
      </p>
    </div>
  );
}

/** @returns the icon colour matching an alignment verdict */
function statusFromAlignment(status: AlignmentStatus): StatusLevel {
  return status === "aligned" ? "ok" : "warn";
}

/**
 * Pips the deck asks for against sources its lands produce.
 *
 * Each row reads "sources / recommended", so an under-supported colour shows
 * the shortfall directly rather than leaving the reader to compute it.
 */
function ManaAlignmentPanel({ alignment }: { readonly alignment: ManaAlignment }) {
  const t = useTranslations("deck");

  return (
    <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">
        {t("stats.manaAlignment")}
      </p>
      <div className="divide-y divide-[var(--border)]">
        {alignment.colors.map((entry) => (
          <StatRow
            key={entry.color}
            label={t(`stats.color.${entry.color}`)}
            value={t("stats.sourcesOfRecommended", {
              sources: entry.sources,
              recommended: entry.recommendedSources,
              pips: asPercent(entry.pipShare),
            })}
            status={statusFromAlignment(entry.status)}
          />
        ))}
        {alignment.colorlessSources > 0 && (
          <StatRow
            label={t("stats.colorlessSources")}
            value={alignment.colorlessSources}
          />
        )}
      </div>
      <p className="mt-2 text-[10px] leading-snug text-[var(--text-secondary)] opacity-70">
        {t("stats.manaAlignmentHint")}
      </p>
    </div>
  );
}

/**
 * Odds the opening seven can act on turn one.
 *
 * The headline ignores colour; the rows below require a matching source and so
 * read lower. They are shown together because the difference between them is
 * itself the useful signal — a wide gap means the mana, not the curve, is what
 * stops the deck acting.
 */
function TurnOnePanel({ playability }: { readonly playability: TurnOnePlayability }) {
  const t = useTranslations("deck");

  return (
    <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">
        {t("stats.turnOne")}
      </p>
      <div className="divide-y divide-[var(--border)]">
        <StatRow
          label={t("stats.turnOneAny")}
          value={asPercent(playability.anyPlay)}
          status={getRatioStatus(playability.anyPlay * 100)}
        />
        {playability.byColor.map((entry) => (
          <StatRow
            key={entry.color}
            label={t("stats.turnOneColor", { color: t(`stats.color.${entry.color}`) })}
            value={asPercent(entry.probability)}
            status={getRatioStatus(entry.probability * 100)}
          />
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-snug text-[var(--text-secondary)] opacity-70">
        {t("stats.turnOneHint", { oneDrops: playability.oneDrops })}
      </p>
    </div>
  );
}

function TokenLibraryPanel({ cards }: { readonly cards: readonly DeckCard[] }) {
  const t = useTranslations("deck");
  const entries = buildTokenLibrary(cards);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">
        {t("stats.tokenLibrary")}
      </p>
      <div className="space-y-1">
        {entries.map((entry) => (
          <div key={`${entry.kind}:${entry.name}:${entry.power ?? ""}`} className="flex justify-between text-xs">
            <span className="text-[var(--text-primary)]">
              {entry.name}{entry.power ? ` · ${entry.power}` : ""}
              <span className="text-[var(--text-secondary)]"> · {entry.kind}</span>
            </span>
            <span className="text-[var(--text-secondary)]">×{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeckStats({
  stats,
  format,
  cards = [],
  targetBracket = 3,
  className,
}: DeckStatsProps) {
  const t = useTranslations("deck");

  if (!stats) {
    return (
      <div className={cn("rounded-lg bg-[var(--surface)] p-4", className)}>
        <p className="text-xs text-[var(--text-secondary)]">
          {t("stats.buildToSee")}
        </p>
      </div>
    );
  }

  const config = getFormatConfig(format);
  const targets = BRACKET_TARGETS[targetBracket];

  // Sizes and bracket targets are Commander's; a 60-card deck was being shown
  // "60/100" and "target for B3" before this was gated on the format.
  const { deckSize } = config;
  let cardCountStatus: "ok" | "warn" | "error";
  if (stats.totalCards === deckSize) { cardCountStatus = "ok"; }
  else if (stats.totalCards > deckSize) { cardCountStatus = "error"; }
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
          {t("stats.deckChecks")}
        </p>
        <div className="divide-y divide-[var(--border)]">
          <StatRow
            label={t("stats.totalCards")}
            value={`${stats.totalCards}/${deckSize}`}
            status={cardCountStatus}
          />
          {config.hasBracketScoring && (
            <>
              <BenchmarkRow
                label={t("stats.lands")}
                value={stats.lands}
                target={targets.lands}
                bracket={targetBracket}
              />
              <BenchmarkRow
                label={t("stats.ramp")}
                value={stats.ramp}
                target={targets.ramp}
                bracket={targetBracket}
              />
              <BenchmarkRow
                label={t("stats.cardDraw")}
                value={stats.draw}
                target={targets.draw}
                bracket={targetBracket}
              />
              <BenchmarkRow
                label={t("stats.removal")}
                value={stats.removal}
                target={targets.removal}
                bracket={targetBracket}
              />
            </>
          )}
          <StatRow
            label={t("stats.avgCmc")}
            value={stats.avgCmc.toFixed(2)}
            status={stats.avgCmc <= 3.5 ? "ok" : "warn"}
          />
          {stats.bannedCards.length > 0 && (
            <StatRow
              label={t("stats.bannedCards")}
              value={stats.bannedCards.length}
              status="error"
            />
          )}
        </div>
      </div>

      {/* Format-specific measures (non-Commander formats) */}
      {stats.formatStats && (
        <FormatStatsPanel
          formatStats={stats.formatStats}
          formatLabel={config.label}
        />
      )}

      {/* Mana base alignment — pips asked for vs. sources produced */}
      {stats.manaAlignment && <ManaAlignmentPanel alignment={stats.manaAlignment} />}

      {/* Turn-one playability — odds the opening hand can act */}
      {stats.turnOnePlayability && <TurnOnePanel playability={stats.turnOnePlayability} />}

      <TokenLibraryPanel cards={cards} />

      {/* Deck price — live total from store via useDeckPrice */}
      <DeckPriceDisplay />

      {/* Budget warning (over-budget cards, only when a budget is set) */}
      {stats.overBudgetCards.length > 0 && (
        <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">
            {t("stats.budget")}
          </p>
          <div className="divide-y divide-[var(--border)]">
            <StatRow
              label={t("stats.overBudget")}
              value={stats.overBudgetCards.length}
              status="warn"
            />
          </div>
        </div>
      )}
    </div>
  );
}
