"use client";
// Detected deck theme/archetype badges
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";
import type { DetectedTheme } from "@/lib/deck/themes";

interface ThemeDetectorProps {
  readonly themes?: readonly DetectedTheme[];
  readonly maxThemes?: number;
  readonly className?: string;
}

const THEME_COLORS: Record<string, string> = {
  Tokens: "bg-green-500/20 text-green-300 border-green-500/30",
  Sacrifice: "bg-red-500/20 text-red-300 border-red-500/30",
  Reanimator: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Voltron: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Stax: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  Combo: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  Control: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Aggro: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Spellslinger: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Landfall: "bg-lime-500/20 text-lime-300 border-lime-500/30",
  Tribal: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  "+1/+1 Counters": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Blink/ETB": "bg-violet-500/20 text-violet-300 border-violet-500/30",
  Wheels: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  Aristocrats: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  Equipment: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Treasure: "bg-yellow-600/20 text-yellow-200 border-yellow-600/30",
};

function ConfidenceBar({ confidence }: { readonly confidence: number }) {
  const pct = Math.round(confidence * 100);
  return (
    <div className="w-12 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
      <div
        className="h-full rounded-full bg-current opacity-60"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ThemeDetector({
  themes,
  maxThemes = 3,
  className,
}: ThemeDetectorProps) {
  const t = useTranslations("deck");
  const topThemes = (themes ?? []).slice(0, maxThemes);

  if (topThemes.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4",
          className
        )}
      >
        <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-2">
          {t("stats.archetypes")}
        </p>
        <p className="text-xs text-[var(--text-secondary)] italic">
          {t("stats.archetypesEmpty")}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4 space-y-3",
        className
      )}
    >
      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
        {t("stats.archetypes")}
      </p>
      <div className="flex flex-wrap gap-2">
        {topThemes.map((theme) => {
          const colorClass =
            THEME_COLORS[theme.name] ??
            "bg-[var(--surface-hover)] text-[var(--text-primary)] border-[var(--border)]";
          return (
            <div
              key={theme.name}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium",
                colorClass
              )}
              title={t("stats.archetypeConfidence", {
                percent: Math.round(theme.confidence * 100),
                keywords: theme.matchedKeywords.slice(0, 3).join(", "),
              })}
            >
              {/* Archetype names are MTG jargon carried by the domain data —
                  left as-is, like card names. */}
              <span>{theme.name}</span>
              <ConfidenceBar confidence={theme.confidence} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
