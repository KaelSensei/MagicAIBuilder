"use client";
/**
 * The price subtotal at the end of a deck-list group heading (I-32): the
 * USD amount of the group, the copies without a price beside a known
 * subtotal, or "no price" when nothing in the group is priced.
 *
 * It decides what to show, so both heading kinds of `MainZoneContent` add
 * one element and no branch. The visible text is terse and hidden from
 * assistive technology; a sentence in `sr-only` text gives the heading
 * button its spoken subtotal.
 *
 * @module deck/GroupPriceSubtotal
 */
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatUsdPrice } from "@/i18n/number-format";
import { groupPrice, type GroupPrice } from "@/lib/deck/price-breakdown";
import type { DeckCard } from "@/lib/deck/types";

interface SubtotalText {
  /** What the heading shows, after a separator. */
  readonly shown: string;
  /** What a screen reader reads instead. */
  readonly spoken: string;
}

function useSubtotalText(price: GroupPrice): SubtotalText {
  const t = useTranslations("deck.stats");
  const locale = useLocale();
  switch (price.kind) {
    case "priced": {
      const amount = formatUsdPrice(locale, price.subtotal);
      return { shown: amount, spoken: t("groupSubtotal", { amount }) };
    }
    case "partial": {
      const amount = formatUsdPrice(locale, price.knownSubtotal);
      const count = price.unpricedCopies;
      return {
        shown: t("groupSubtotalWithUnpriced", { amount, count }),
        spoken: t("groupKnownSubtotal", { amount, count }),
      };
    }
    case "unpriced":
      return { shown: t("groupNoPrice"), spoken: t("groupNoPriceLabel") };
  }
  const exhaustivePrice: never = price;
  return exhaustivePrice;
}

interface GroupPriceSubtotalProps {
  /** The group's rows, as the heading counts them. */
  readonly cards: readonly DeckCard[];
}

/**
 * Shows a deck-list group's price subtotal inside its heading.
 *
 * @param props.cards - the group's rows; each `price` is per copy, in USD, or null
 * @returns the subtotal, with its spoken form for the heading's accessible name
 */
export function GroupPriceSubtotal({ cards }: GroupPriceSubtotalProps) {
  const price = useMemo(() => groupPrice(cards), [cards]);
  const { shown, spoken } = useSubtotalText(price);

  return (
    <span className="text-xs text-[var(--text-secondary)] tabular-nums">
      <span aria-hidden="true">· {shown}</span>
      <span className="sr-only">{spoken}</span>
    </span>
  );
}
