"use client";
// Game Changers count badge with warning
import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { cn } from "@/components/ui/utils";

interface GameChangersBadgeProps {
  readonly count: number;
  readonly names?: string[];
  readonly targetBracket?: 1 | 2 | 3 | 4;
  readonly className?: string;
}

const BRACKET_MAX_GC: Record<number, number> = {
  1: 0,
  2: 0,
  3: 3,
  4: Infinity,
};

export function GameChangersBadge({
  count,
  names = [],
  targetBracket = 3,
  className,
}: GameChangersBadgeProps) {
  const t = useTranslations("deck");
  const maxAllowed = BRACKET_MAX_GC[targetBracket] ?? Infinity;
  const isOverLimit = count > maxAllowed;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 flex items-start gap-3",
        isOverLimit
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-[var(--surface)] border-[var(--border)]",
        className
      )}
    >
      <Zap
        className={cn("w-4 h-4 mt-0.5 shrink-0", isOverLimit ? "text-amber-400" : "text-[var(--text-secondary)]")}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "text-sm font-medium",
              isOverLimit ? "text-amber-400" : "text-[var(--text-primary)]"
            )}
          >
            {count}
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            {t("stats.gameChangersOutOf", {
              max: maxAllowed === Infinity ? "∞" : String(maxAllowed),
            })}
          </span>
          {isOverLimit && targetBracket <= 2 && (
            <span className="text-xs text-amber-400 font-medium">
              {t("stats.gcOverLimit", { bracket: targetBracket })}
            </span>
          )}
          {isOverLimit && targetBracket >= 3 && (
            <span className="text-xs text-amber-400 font-medium">
              {t("stats.gcForcesBracket", { bracket: count > 3 ? 4 : 3 })}
            </span>
          )}
        </div>
        {names.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {names.slice(0, 5).map((name) => (
              <li key={name} className="text-xs text-amber-300/70 truncate">
                • {name}
              </li>
            ))}
            {names.length > 5 && (
              <li className="text-xs text-[var(--text-secondary)]">
                {t("stats.andMore", { count: names.length - 5 })}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
