"use client";

/**
 * A deck's card count with its size state: the "x/y" every deck counter shows,
 * plus whether the deck is complete, short or over, in words for a screen
 * reader and in green when complete. The editor, the deck list and the builder
 * title bar render it, so a finished deck reads the same on every screen.
 *
 * Deck-building context, UI. The rule and the comparison are the format-rules
 * context's (`deckSizeStatus`); this component only words and colours them.
 *
 * @module components/deck/DeckCardCount
 */
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui/utils";
import { formatDeckCount } from "@/lib/deck/deck-size";
import {
  deckSizeStatus,
  type DeckSizeRule,
  type DeckSizeStatus,
} from "@/modules/format-rules";

/** What {@link DeckCardCount} takes. */
export interface DeckCardCountProps {
  /** The cards the deck holds, its command zone included */
  readonly cardCount: number;
  /** The deck's size rule (`deckSizeRuleInFormat`) */
  readonly rule: DeckSizeRule;
  /** What stands between the count and the maximum, such as "/" or " / " */
  readonly separator: string;
  /** The counter's classes on top of its state colour */
  readonly className?: string;
}

/**
 * The count of a deck and its size state. The state is read aloud ("complete",
 * "3 cards short", "2 cards over") and colour is only the secondary signal
 * (WCAG 1.4.1). A deck whose rulebreaker commander lifts the maximum
 * (CR 903.5e; Whtz, the Bibliophile) is never over.
 *
 * @param props - See {@link DeckCardCountProps}
 * @returns The counter, a `span`
 */
export function DeckCardCount({
  cardCount,
  rule,
  separator,
  className,
}: DeckCardCountProps) {
  const status = deckSizeStatus(cardCount, rule);
  const stateLabel = useDeckSizeStateLabel(status, cardCount, rule);

  return (
    <span
      className={cn(
        className,
        status === "legal" ? "text-green-500" : "text-[var(--text-secondary)]"
      )}
    >
      {formatDeckCount(cardCount, rule, separator)}{" "}
      <span className="sr-only">({stateLabel})</span>
    </span>
  );
}

/** The words of a size state; "short" and "over" say by how many cards. */
function useDeckSizeStateLabel(
  status: DeckSizeStatus,
  cardCount: number,
  rule: DeckSizeRule
): string {
  const t = useTranslations("deck.sizeState");
  switch (status) {
    case "legal":
      return t("complete");
    case "short":
      return t("short", { count: rule.minimum - cardCount });
    case "over":
      return t("over", { count: cardCount - (rule.maximum ?? cardCount) });
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}
