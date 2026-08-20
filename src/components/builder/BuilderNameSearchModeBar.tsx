"use client";

import { useTranslations } from "next-intl";
import { Crown, Package } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { Deck } from "@/lib/deck/types";
import { partnerSlotLabel, supportsPartner } from "@/lib/deck/pairing";

export interface BuilderNameSearchModeBarProps {
  readonly deck: Deck;
  readonly commanderMode: boolean;
  readonly partnerMode: boolean;
  readonly companionMode: boolean;
  readonly onToggleCommander: () => void;
  readonly onTogglePartner: () => void;
  readonly onToggleCompanion: () => void;
}

/**
 * Commander / partner / companion search toggles for the builder name search tab.
 */
export function BuilderNameSearchModeBar({
  deck,
  commanderMode,
  partnerMode,
  companionMode,
  onToggleCommander,
  onTogglePartner,
  onToggleCompanion,
}: BuilderNameSearchModeBarProps) {
  const t = useTranslations("builder");
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggleCommander}
        className={cn(
          "flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors",
          commanderMode
            ? "border-amber-500 text-amber-400 bg-amber-500/10"
            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
        )}
        title={t("searchToggles.commanderTitle")}
      >
        <Crown className="w-3 h-3" />
        {t("searchToggles.commander")}
      </button>
      {supportsPartner(deck.pairingType) && (
        <button
          type="button"
          onClick={onTogglePartner}
          className={cn(
            "flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors",
            partnerMode
              ? "border-purple-500 text-purple-400 bg-purple-500/10"
              : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
          )}
          title={t("searchToggles.partnerTitle", { label: partnerSlotLabel(deck.pairingType) })}
        >
          <Crown className="w-3 h-3" />
          {partnerSlotLabel(deck.pairingType)}
        </button>
      )}
      <button
        type="button"
        disabled={!deck.commander}
        onClick={onToggleCompanion}
        className={cn(
          "flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors",
          companionMode
            ? "border-cyan-500 text-cyan-400 bg-cyan-500/10"
            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]",
          !deck.commander && "opacity-40"
        )}
        title={
          deck.commander
            ? t("searchToggles.companionTitle")
            : t("searchToggles.setCommanderFirst")
        }
      >
        <Package className="w-3 h-3" />
        {t("searchToggles.companion")}
      </button>
    </div>
  );
}
