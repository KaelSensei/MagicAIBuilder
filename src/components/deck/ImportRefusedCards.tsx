"use client";
/**
 * The cards a decklist import could not add, each with the reason the deck gave (I-01).
 *
 * It sits under the import's result, beside the list of names Scryfall did not find, so the
 * player sees why the count is lower than the decklist. A refused command-zone card gets the
 * store's own notice too, which names the precise reason.
 *
 * @module components/deck/ImportRefusedCards
 */
import { useTranslations } from "next-intl";
import type { RefusedCard } from "@/components/deck/deck-import";

/**
 * Lists the cards the deck refused, or renders nothing when it took every card.
 *
 * @param refused - The refused cards, each name once, from the import's outcome
 */
export function ImportRefusedCards({
  refused,
}: {
  readonly refused: readonly RefusedCard[];
}) {
  const t = useTranslations("deck.import.refused");
  const formatName = useTranslations("deck.format.name");
  if (refused.length === 0) return null;

  const reasonFor = ({ name, refusal }: RefusedCard): string => {
    switch (refusal.kind) {
      case "at-copy-limit":
        return t("atCopyLimit", { name, format: formatName(refusal.format) });
      case "basic-land-held":
        return t("basicLandHeld", { name });
      case "command-zone-unchanged":
        return t("commandZone", { name });
      default: {
        const exhaustive: never = refusal;
        return exhaustive;
      }
    }
  };

  return (
    <div role="alert" className="text-sm text-amber-400">
      <p>{t("title", { count: refused.length })}</p>
      <ul className="max-h-24 overflow-y-auto list-disc list-inside break-words">
        {refused.map((card) => (
          <li key={card.name}>{reasonFor(card)}</li>
        ))}
      </ul>
    </div>
  );
}
