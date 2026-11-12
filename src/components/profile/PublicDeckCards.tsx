"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Layers } from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/deck/categories";
import type { PublicCard } from "@/lib/deck/public-deck";
import { cardSurfaceClassName } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils";
import { filterCardsByCategory } from "@/lib/deck/deck-preview";
import { CategoryFilter, DeckCardStrip } from "@/components/deck/DeckPreviewChrome";
import { normalizeScryfallImageUrl } from "@/lib/scryfall/images";

interface PublicDeckCardsProps {
  readonly cards: readonly PublicCard[];
}

/**
 * Resolves a stored category id to its display label.
 *
 * @param category - category id from a public card
 * @returns the known label, or the id when it is not a deck category
 */
function labelForCategory(category: string): string {
  for (const known of CATEGORY_ORDER) {
    if (known === category) return CATEGORY_LABELS[known];
  }
  return category;
}

/**
 * Category filters, card faces, and the grouped list for a public deck.
 *
 * @param props - non-commander cards already loaded with the deck
 * @returns the preview and list
 */
export function PublicDeckCards({ cards }: PublicDeckCardsProps) {
  const t = useTranslations("deck");
  const [category, setCategory] = useState("all");
  const grouped = useMemo(() => {
    const groups: Record<string, PublicCard[]> = {};
    for (const card of cards) {
      const bucket = groups[card.category] ?? [];
      bucket.push(card);
      groups[card.category] = bucket;
    }
    return groups;
  }, [cards]);
  const ordered = CATEGORY_ORDER.filter((cat) => (grouped[cat]?.length ?? 0) > 0);
  const visibleCards = useMemo(
    () => filterCardsByCategory(cards, category),
    [cards, category]
  );
  const chipOptions = ordered.map((id) => ({
    id,
    label: labelForCategory(id),
    count: (grouped[id] ?? []).reduce((sum, card) => sum + card.quantity, 0),
  }));

  return (
    <>
      <CategoryFilter
        options={chipOptions}
        value={category}
        allLabel={t("share.filterAll")}
        onChange={setCategory}
      />
      <DeckCardStrip
        cards={visibleCards.map((card) => ({
          id: card.id,
          name: card.name,
          category: card.category,
          imageUri: card.imageUri,
        }))}
      />
      <div className="flex flex-col gap-4">
        {ordered
          .filter((cat) => category === "all" || cat === category)
          .map((cat) => {
            const sectionCards = grouped[cat] ?? [];
            return (
              <section key={cat}>
                <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                  <Layers className="h-3 w-3" />
                  {labelForCategory(cat)}
                  <span className="font-normal tracking-normal normal-case">
                    ({sectionCards.reduce((sum, card) => sum + card.quantity, 0)})
                  </span>
                </h2>
                <div className={cn(cardSurfaceClassName, "grid grid-cols-1 gap-1 p-2 sm:grid-cols-2")}>
                  {sectionCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center gap-2 rounded-[var(--lumen-radius-md)] px-2 py-1 transition-colors hover:bg-[var(--surface-hover)]"
                    >
                      {card.imageUri ? (
                        <Image
                          src={normalizeScryfallImageUrl(card.imageUri)}
                          alt=""
                          width={28}
                          height={28}
                          unoptimized
                          className="h-7 w-7 shrink-0 rounded-[var(--lumen-radius-sm)] object-cover"
                        />
                      ) : null}
                      {card.quantity > 1 && (
                        <span className="w-4 shrink-0 text-xs font-medium text-[var(--accent-text)]">
                          {card.quantity}×
                        </span>
                      )}
                      <span className="truncate text-sm text-[var(--text-primary)]">{card.name}</span>
                      {card.isGameChanger && (
                        <span className="shrink-0 text-xs text-amber-400">⚡</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
      </div>
    </>
  );
}
