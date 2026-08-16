"use client";
// What the deck has done in past playtests — shown before you start another.
import { useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { usePlaytestHistory } from "@/hooks/usePlaytestHistory";
import { mulliganRows, trendDirection, type TrendDirection } from "@/lib/playtest/summary-view";

interface PlaytestHistoryPanelProps {
  readonly deckId: string;
}

/** @returns the icon for a trend verdict, or null when there is nothing to claim */
function TrendIcon({ direction }: { readonly direction: TrendDirection }) {
  if (direction === "improving") return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
  if (direction === "declining") return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  if (direction === "steady") return <Minus className="w-3.5 h-3.5 text-white/40" />;
  return null;
}

function Figure({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
    </div>
  );
}

/**
 * The deck's recorded playtest history.
 *
 * Renders nothing at all until at least one session exists. An empty panel of
 * zeroes would read as "this deck loses every game" rather than "you have not
 * recorded anything yet", which is the opposite of the truth.
 */
export function PlaytestHistoryPanel({ deckId }: PlaytestHistoryPanelProps) {
  const t = useTranslations("playtest");
  const { data } = usePlaytestHistory(deckId);

  const summary = data?.summary;
  if (!summary || summary.total === 0) return null;

  const direction = trendDirection(summary.trend);
  const rows = mulliganRows(summary.mulligans);

  return (
    <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wide text-white/40">{t("history.title")}</p>
        <span className="flex items-center gap-1 text-[11px] text-white/60">
          <TrendIcon direction={direction} />
          {t(`history.trend.${direction}`)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <Figure label={t("history.games")} value={String(summary.total)} />
        <Figure label={t("history.winRate")} value={`${Math.round(summary.winRate)}%`} />
        <Figure
          label={t("history.avgWinTurns")}
          value={summary.averageWinTurns === 0 ? "—" : summary.averageWinTurns.toFixed(1)}
        />
      </div>

      <div className="border-t border-white/10 pt-2">
        <p className="text-[10px] uppercase tracking-wide text-white/40 mb-1">
          {t("history.byMulligans")}
        </p>
        <ul className="space-y-0.5">
          {rows.map((row) => (
            <li key={row.mulligans} className="flex justify-between text-[11px] text-white/60">
              <span>{t("history.mulliganLabel", { count: row.mulligans })}</span>
              <span>
                {t("history.mulliganValue", {
                  games: row.count,
                  winRate: Math.round(row.winRate),
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
