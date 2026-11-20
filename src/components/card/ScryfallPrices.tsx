"use client";
/**
 * Scryfall's two prices for one printing, side by side, under Scryfall's name.
 *
 * Card catalog, presentation side. I-96 (docs/product/specs/
 * i96-two-labelled-prices-and-no-conversion.md): the dollar and the euro
 * amounts are each Scryfall's own figure, so both are shown as sent, with
 * their currency code, and neither is converted into the other. An amount
 * Scryfall did not send says so in words rather than showing a zero.
 * Not responsible for: choosing a printing, or the deck total's currency
 * (I-06 keeps the one it chose).
 *
 * @module components/card/ScryfallPrices
 */
import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatEurPrice, formatUsdPrice } from "@/i18n/number-format";
import { priceEurOf, priceUsdOf, type PricedCard } from "@/lib/scryfall/price";

/** The currencies Scryfall sends a non-foil amount in, in display order. */
const SCRYFALL_AMOUNTS = [
  { currency: "USD", read: priceUsdOf, format: formatUsdPrice },
  { currency: "EUR", read: priceEurOf, format: formatEurPrice },
] as const;

interface ScryfallPricesProps {
  readonly card: PricedCard;
  readonly className?: string;
}

/**
 * A region named "Scryfall prices" holding one line per currency: the amount
 * Scryfall sent, formatted for the locale with its currency code, or "No EUR
 * from Scryfall" (and the USD equivalent) when Scryfall sent none.
 *
 * @param card - the printing whose prices are shown, as Scryfall sent it
 * @param className - layout classes from the host panel
 */
export function ScryfallPrices({ card, className = "" }: ScryfallPricesProps) {
  const t = useTranslations("card.scryfallPrices");
  const locale = useLocale();
  const labelId = useId();

  return (
    <section aria-labelledby={labelId} className={`text-xs ${className}`}>
      <p id={labelId} className="text-(--text-secondary)">
        {t("label")}
      </p>
      {SCRYFALL_AMOUNTS.map(({ currency, read, format }) => {
        const amount = read(card);
        return amount === null ? (
          <p key={currency} className="italic text-(--text-secondary)">
            {t("missing", { currency })}
          </p>
        ) : (
          <p key={currency} className="text-(--accent-text)">
            {format(locale, amount)}
          </p>
        );
      })}
    </section>
  );
}
