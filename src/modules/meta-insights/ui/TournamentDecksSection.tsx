"use client";
/**
 * The competitive-decks section of the meta panel: the recent tournament decks
 * MTGTop8 lists for the commander, the source attribution with the evidence
 * window, and the source's loading, error and empty states.
 *
 * Meta-insights context, `ui/`. Presentational: `useMetaPanel` supplies the
 * decks, the window and the retry.
 *
 * @module meta-insights/ui/TournamentDecksSection
 */
import { useTranslations } from "next-intl";
import type { TournamentSectionModel } from "@/modules/meta-insights/client/useMetaPanel";
import { MetaSourceDisclosure } from "./MetaSourceDisclosure";
import { MetaSourceStatus } from "./MetaSourceStatus";
import { TournamentDeckRow } from "./TournamentDeckRow";

/** The section's model. */
export interface TournamentDecksSectionProps {
  readonly tournament: TournamentSectionModel;
}

/** The section, titled "Competitive (Tournaments)", one link per deck. */
export function TournamentDecksSection({
  tournament,
}: TournamentDecksSectionProps) {
  const t = useTranslations("deck");

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
        {t("meta.competitive")}
      </p>
      {tournament.observedAt && (
        <MetaSourceDisclosure
          source="tournament"
          observedAt={tournament.observedAt}
          stale={tournament.stale}
          health={tournament.health}
          evidenceWindow={tournament.evidenceWindow ?? undefined}
        />
      )}

      <MetaSourceStatus
        isLoading={tournament.isLoading}
        error={tournament.error}
        isEmpty={tournament.decks.length === 0}
        skeletonRows={2}
        emptyMessage={t("meta.noTournamentDecks")}
        onRetry={tournament.retry}
      />

      {tournament.decks.length > 0 && (
        <div className="space-y-0.5">
          {tournament.decks.map((deck) => (
            <TournamentDeckRow key={deck.url} deck={deck} />
          ))}
        </div>
      )}
    </div>
  );
}
