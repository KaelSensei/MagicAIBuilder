"use client";
import { useLocale } from "next-intl";
import {
  resolveLocalizedText,
  toScryfallLang,
  type LocalizedCardText,
} from "@/lib/scryfall/localized";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { useCardPrintings } from "./useCardPrintings";

/**
 * Display text for a single card, translated when the viewer's locale has a
 * printing — for surfaces that hold one English `ScryfallCard` and want to
 * show it in the viewer's language without owning the fetch themselves.
 *
 * English viewers get the card's own fields with no request at all. Other
 * locales reuse the printings query (and its 24h cache) that the printing
 * selector already runs, so a card looked at twice costs one fetch. While the
 * query is in flight the English text is returned, then replaced — text is
 * better than a blank.
 *
 * Display only: the returned name must never be written back into a deck.
 *
 * @param card - the English card, or null when nothing is selected
 * @returns the text to render, or null when `card` is null
 */
export function useLocalizedCardText(
  card: ScryfallCard | null
): LocalizedCardText | null {
  const locale = useLocale();
  const lang = toScryfallLang(locale);

  // Passing null disables the query — English needs no lookup.
  const { data } = useCardPrintings(
    lang === "en" ? null : (card?.name ?? null),
    lang
  );

  if (!card) return null;
  if (lang === "en") return resolveLocalizedText(card);
  return resolveLocalizedText(data?.data[0] ?? card);
}
