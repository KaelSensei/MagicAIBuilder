"use client";
// Alert shown when banned or illegal cards are detected
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, ChevronDown, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui/utils";

interface BanlistAlertProps {
  readonly bannedCards: readonly string[];
  readonly colorViolations: readonly string[];
  readonly onDismiss?: () => void;
  readonly className?: string;
}

export function BanlistAlert({
  bannedCards,
  colorViolations,
  onDismiss,
  className,
}: BanlistAlertProps) {
  const t = useTranslations("deck");
  const hasIssues = bannedCards.length > 0 || colorViolations.length > 0;
  const [expanded, setExpanded] = useState(false);

  const issueSummary = useMemo(() => {
    const parts: string[] = [];
    if (bannedCards.length > 0) parts.push(t("banlist.banned", { count: bannedCards.length }));
    if (colorViolations.length > 0) parts.push(t("banlist.colorId", { count: colorViolations.length }));
    return parts.join(" \u2022 ");
  }, [bannedCards.length, colorViolations.length, t]);

  return (
    <AnimatePresence>
      {hasIssues && (
        <motion.div
          className={cn(
            "rounded-lg border border-red-500/40 bg-red-500/10",
            className
          )}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="flex items-center gap-2 p-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />

            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="min-w-0 flex-1 flex items-center gap-2 text-left"
              aria-expanded={expanded}
              aria-label={t("banlist.toggleWarnings")}
            >
              <span className="text-xs font-medium text-red-300">{t("banlist.deckWarnings")}</span>
              <span className="text-[11px] text-[var(--text-secondary)] truncate">
                {issueSummary}
              </span>
              <span className="ml-auto text-[var(--text-secondary)]">
                {expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </span>
            </button>

            {onDismiss && (
              <button
                onClick={onDismiss}
                aria-label={t("banlist.dismissWarnings")}
                className="rounded-md p-1 text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {expanded && (
            <div className="border-t border-red-500/20 px-3 pb-3 pt-2.5 space-y-2">
              {bannedCards.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-400">{t("banlist.bannedInCommander")}</p>
                  <ul className="text-xs text-red-300/80 mt-1 space-y-0.5">
                    {bannedCards.map((name) => (
                      <li key={name}>• {name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {colorViolations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-orange-400">{t("banlist.colorIdentityViolations")}</p>
                  <ul className="text-xs text-orange-300/80 mt-1 space-y-0.5">
                    {colorViolations.map((name) => (
                      <li key={name}>• {name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
