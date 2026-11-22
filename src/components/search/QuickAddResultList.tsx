"use client";
/**
 * One row of the quick-add palette: the card's name, mana cost, type and price.
 *
 * Card catalog, quick add (I-37). A missing price is named as missing; it is not shown as zero.
 *
 * @module search/QuickAddResultList
 */
import { useLocale, useTranslations } from "next-intl";
import { ManaCostDisplay } from "@/components/card/ManaSymbol";
import { formatUsdPrice } from "@/i18n/number-format";
import type { ScryfallCard } from "@/lib/scryfall/types";

interface QuickAddResultListProps {
  readonly listId: string;
  readonly cards: readonly ScryfallCard[];
  readonly activeIndex: number;
  readonly onAdd: (card: ScryfallCard) => void;
}

/**
 * The compact result list.
 *
 * @param props - The cards, which row is active, and the add action
 * @returns The listbox, or null when there is nothing to list
 */
export function QuickAddResultList({
  listId,
  cards,
  activeIndex,
  onAdd,
}: QuickAddResultListProps) {
  const t = useTranslations("search");
  const locale = useLocale();
  if (cards.length === 0) return null;

  return (
    <ul id={listId} className="max-h-80 overflow-y-auto">
      {cards.map((card, index) => (
        <li key={card.id}>
          <button
            type="button"
            id={quickAddOptionId(card.id)}
            tabIndex={-1}
            aria-current={index === activeIndex ? "true" : undefined}
            className={
              index === activeIndex
                ? "flex w-full items-center gap-3 bg-[var(--accent-soft)] px-4 py-2 text-left"
                : "flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-[var(--surface-hover)]"
            }
            onClick={() => onAdd(card)}
          >
            <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-primary)]">
              {card.name}
            </span>
            <ManaCostDisplay manaCost={card.mana_cost ?? ""} />
            <span className="hidden max-w-40 truncate text-xs text-[var(--text-secondary)] sm:inline">
              {card.type_line}
            </span>
            <span className="shrink-0 text-xs text-[var(--text-secondary)]">
              {usdLabel(card, locale, t("quickAdd.priceUnknown"))}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * The id of a result option. The combobox points at it with `aria-activedescendant`.
 *
 * @param cardId - The Scryfall id of the card
 * @returns The option element's id
 */
export function quickAddOptionId(cardId: string): string {
  return `quick-add-option-${cardId}`;
}

/**
 * The USD price to show, or the catalogue's "no price" when Scryfall sent none.
 *
 * @param card - A search result
 * @param locale - The UI locale
 * @param missing - The catalogue string for an absent price
 * @returns The price label
 */
function usdLabel(card: ScryfallCard, locale: string, missing: string): string {
  const raw = card.prices?.usd;
  if (typeof raw !== "string" || raw.length === 0) return missing;
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return missing;
  return formatUsdPrice(locale, amount);
}
