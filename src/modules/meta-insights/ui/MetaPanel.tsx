"use client";
/**
 * The meta panel of the builder page: what the wider meta plays for the deck's
 * commander. It opens on demand and shows, in order, the links to the community
 * decks and to EDHREC, the popular cards, the meta shifts and the recent
 * tournament decks.
 *
 * Meta-insights context, `ui/`. A container: `useMetaPanel` (`client/`) owns
 * the state and the reads, the three section components render it, and this
 * file only composes them. Without a commander it asks the visitor to pick one.
 *
 * @module meta-insights/ui/MetaPanel
 */
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMetaPanel } from "@/modules/meta-insights/client/useMetaPanel";
import { cn } from "@/components/ui/utils";
import { CommanderMetaLinks } from "./CommanderMetaLinks";
import { EdhrecCardsSection } from "./EdhrecCardsSection";
import { MetaPanelHeader } from "./MetaPanelHeader";
import { MetaShiftsSection } from "./MetaShiftsSection";
import { TournamentDecksSection } from "./TournamentDecksSection";

/** The deck the panel describes and what adding a popular card does to it. */
export interface MetaPanelProps {
  /** The deck's commander; null until one is chosen. */
  readonly commanderName: string | null;
  /** The deck's card names, for the in-deck check and the "not in deck" filter. */
  readonly deckCardNames: ReadonlySet<string>;
  readonly onAddCard: (cardName: string) => void;
  readonly className?: string;
}

/**
 * The collapsible panel. Nothing is fetched until it is opened; Refresh reads
 * both sources again past the server cache.
 */
export function MetaPanel({
  commanderName,
  deckCardNames,
  onAddCard,
  className,
}: MetaPanelProps) {
  const t = useTranslations("deck");
  const panel = useMetaPanel(commanderName, deckCardNames);

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden",
        className
      )}
    >
      <MetaPanelHeader
        expanded={panel.expanded}
        isFetching={panel.isFetching}
        onToggle={panel.toggleExpanded}
      />

      <AnimatePresence>
        {panel.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-4">
              {commanderName ? (
                <>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={panel.refresh}
                      disabled={panel.isFetching}
                      className="ml-auto flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {t("meta.refresh")}
                    </button>
                  </div>
                  <CommanderMetaLinks commanderName={commanderName} />
                  <EdhrecCardsSection
                    edhrec={panel.edhrec}
                    deckCardNames={deckCardNames}
                    onAddCard={onAddCard}
                  />
                  <MetaShiftsSection shifts={panel.shifts} />
                  <TournamentDecksSection tournament={panel.tournament} />
                </>
              ) : (
                <p className="text-xs text-[var(--text-secondary)] text-center py-4">
                  {t("meta.selectCommander")}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
