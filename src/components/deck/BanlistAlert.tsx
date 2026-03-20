"use client";
// Alert shown when banned or illegal cards are detected
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/components/ui/utils";

interface BanlistAlertProps {
  bannedCards: string[];
  colorViolations: string[];
  onDismiss?: () => void;
  className?: string;
}

export function BanlistAlert({
  bannedCards,
  colorViolations,
  onDismiss,
  className,
}: BanlistAlertProps) {
  const hasIssues = bannedCards.length > 0 || colorViolations.length > 0;

  return (
    <AnimatePresence>
      {hasIssues && (
        <motion.div
          className={cn(
            "rounded-lg border border-red-500/40 bg-red-500/10 p-3",
            className
          )}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              {bannedCards.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-400">
                    Banned in Commander:
                  </p>
                  <ul className="text-xs text-red-300/80 mt-0.5 space-y-0.5">
                    {bannedCards.map((name) => (
                      <li key={name}>• {name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {colorViolations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-orange-400">
                    Color identity violations:
                  </p>
                  <ul className="text-xs text-orange-300/80 mt-0.5 space-y-0.5">
                    {colorViolations.map((name) => (
                      <li key={name}>• {name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
