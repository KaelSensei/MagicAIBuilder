"use client";
/**
 * The popular-cards section of the meta panel: EDHREC's list for the
 * commander, the "not in deck" filter, the source attribution, and the
 * source's loading, error and empty states.
 *
 * Meta-insights context, `ui/`. Presentational: `useMetaPanel` supplies the
 * list, the filter state and the retry.
 *
 * @module meta-insights/ui/EdhrecCardsSection
 */
import { useTranslations } from "next-intl";
import type { EdhrecSectionModel } from "@/modules/meta-insights/client/useMetaPanel";
import { EdhrecCardRow } from "./EdhrecCardRow";
import { MetaSourceDisclosure } from "./MetaSourceDisclosure";
import { MetaSourceStatus } from "./MetaSourceStatus";

/** The section's model, plus what adding a card means to the deck. */
export interface EdhrecCardsSectionProps {
  readonly edhrec: EdhrecSectionModel;
  /** The deck's card names: a listed card the deck runs shows a check instead of a button. */
  readonly deckCardNames: ReadonlySet<string>;
  readonly onAddCard: (cardName: string) => void;
}

/**
 * The section, titled "Popular (EDHRec)". The filter checkbox appears only once
 * the source listed cards; when it hides every card, the section says so in
 * green instead of showing an empty list.
 */
export function EdhrecCardsSection({
  edhrec,
  deckCardNames,
  onAddCard,
}: EdhrecCardsSectionProps) {
  const t = useTranslations("deck");
  const allPopularInDeck =
    edhrec.showOnlyMissing &&
    !edhrec.isLoading &&
    !edhrec.error &&
    edhrec.cards.length > 0 &&
    edhrec.visibleCards.length === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
          {t("meta.popularEdhrec")}
        </p>
        {edhrec.cards.length > 0 && (
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={edhrec.showOnlyMissing}
              onChange={(event) =>
                edhrec.setShowOnlyMissing(event.target.checked)
              }
              className="w-3 h-3 accent-[var(--accent)]"
            />
            <span className="text-[10px] text-[var(--text-secondary)]">
              {t("meta.notInDeck")}
            </span>
          </label>
        )}
      </div>
      {edhrec.observedAt && (
        <MetaSourceDisclosure
          source="edhrec"
          observedAt={edhrec.observedAt}
          stale={edhrec.stale}
          health={edhrec.health}
        />
      )}

      <MetaSourceStatus
        isLoading={edhrec.isLoading}
        error={edhrec.error}
        isEmpty={edhrec.cards.length === 0}
        skeletonRows={5}
        emptyMessage={t("meta.noEdhrecData")}
        onRetry={edhrec.retry}
      />

      {edhrec.visibleCards.length > 0 && (
        <div className="space-y-0.5">
          {edhrec.visibleCards.map((card) => (
            <EdhrecCardRow
              key={card.name}
              card={card}
              inDeck={deckCardNames.has(card.name)}
              onAdd={onAddCard}
            />
          ))}
        </div>
      )}
      {allPopularInDeck && (
        <output className="block text-xs text-green-400 text-center py-2">
          {t("meta.allPopularInDeck")}
        </output>
      )}
    </div>
  );
}
