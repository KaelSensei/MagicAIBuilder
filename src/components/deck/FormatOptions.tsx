"use client";
/**
 * The options of a native format `select`: the Commander variants grouped
 * apart from the constructed formats (I-42 requirement 4.1), each named from
 * the message catalogues (`deck.format.name.<format>`) rather than from the
 * English `FORMAT_CONFIG[format].label`.
 *
 * Context: deck building (ui), shared by the `/decks` creation choice and the
 * deck settings' format picker so both offer the same list in the same order.
 *
 * @module deck/FormatOptions
 */
import { useTranslations } from "next-intl";
import {
  ALL_FORMATS,
  FORMAT_CONFIG,
  type DeckFormat,
} from "@/lib/deck/formats";

/** One `optgroup`: its catalogue key and its formats, in `ALL_FORMATS` order. */
interface FormatGroup {
  readonly id: "commanderVariants" | "constructed";
  readonly formats: readonly DeckFormat[];
}

/**
 * A format with a command zone is a Commander variant (Commander, Brawl,
 * Oathbreaker); every other one is a constructed format.
 */
const FORMAT_GROUPS: readonly FormatGroup[] = [
  {
    id: "commanderVariants",
    formats: ALL_FORMATS.filter((format) => FORMAT_CONFIG[format].hasCommander),
  },
  {
    id: "constructed",
    formats: ALL_FORMATS.filter(
      (format) => !FORMAT_CONFIG[format].hasCommander
    ),
  },
];

/**
 * The grouped `optgroup` and `option` elements, for a native `select` whose
 * value is a `DeckFormat`.
 */
export function FormatOptions() {
  const t = useTranslations("deck.format");
  return (
    <>
      {FORMAT_GROUPS.map((group) => (
        <optgroup key={group.id} label={t(`group.${group.id}`)}>
          {group.formats.map((format) => (
            <option key={format} value={format}>
              {t(`name.${format}`)}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
