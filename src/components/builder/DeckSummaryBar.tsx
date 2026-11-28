"use client";

/**
 * The deck summary bar under the builder's three panels: the card count, the format and bracket,
 * the price and the counts by card type on one line, so a player cutting to a budget and a
 * bracket sees both after every swap (I-37, gap analysis row 10).
 *
 * Deck-building context, UI. Every figure is read from the deck the store holds, the same state
 * the editor renders; the type count is `countDeckCardTypes`, the price `useDeckPrice`.
 *
 * @module components/builder/DeckSummaryBar
 */
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { DeckCardCount } from "@/components/deck/DeckCardCount";
import { cn } from "@/components/ui/utils";
import { useDeckPrice } from "@/hooks/useDeckPrice";
import { formatUsdPrice } from "@/i18n/number-format";
import type { BracketLevel } from "@/lib/constants/brackets";
import type { BracketScore } from "@/lib/deck/analysis-types";
import { countDeckCards, deckSizeRuleInFormat } from "@/lib/deck/deck-size";
import { countDeckCardTypes } from "@/lib/deck/deck-type-counts";
import type { ComboData } from "@/lib/deck/explain-bracket";
import { getFormatConfig } from "@/lib/deck/formats";
import { isDeckStub } from "@/lib/deck/store-factories";
import type { Deck } from "@/lib/deck/types";

/** What {@link DeckSummaryBar} takes. */
export interface DeckSummaryBarProps {
  /** The deck the builder shows; `null` while it is missing */
  readonly deck: Deck | null;
  /** The deck's bracket estimate (`useBracketScore`), `null` when there is none */
  readonly bracketScore: BracketScore | null;
  /**
   * The state of the deck's combo lookup (`comboDataOf`), the one the bracket badge reads. While
   * it is `pending` or `unavailable` the estimate counts no combo, and the bar says so; absent
   * reads as `found`.
   */
  readonly comboData?: ComboData;
}

/**
 * One line of deck figures under the builder's panels.
 *
 * @param props - See {@link DeckSummaryBarProps}
 * @returns the bar, a `section` labelled "Deck summary"
 */
export function DeckSummaryBar({
  deck,
  bracketScore,
  comboData,
}: DeckSummaryBarProps) {
  const t = useTranslations("builder.summary");
  // A listing stub holds only its command zone: its figures would be wrong until it loads.
  if (!deck || isDeckStub(deck)) return null;

  // Not a live region: a screen reader would otherwise announce every edit's figures.
  return (
    <section
      aria-label={t("label")}
      className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text-secondary)] md:px-4"
    >
      <DeckCardCount
        cardCount={countDeckCards(deck)}
        rule={deckSizeRuleInFormat(deck)}
        separator="/"
        className="font-medium"
      />
      <FormatAndBracket
        deck={deck}
        bracketScore={bracketScore}
        comboData={comboData}
      />
      <DeckPrice />
      <TypeCounts deck={deck} />
    </section>
  );
}

/**
 * The catalogue key of an estimated bracket for each combo lookup state, worded as the badge's
 * `ComboLookupNote` words it (`builder.details.bracketPath.comboFloorPending` and
 * `comboFloorNotChecked`), in the bar's shorter form.
 */
const ESTIMATE_KEY = {
  found: "formatWithBracket",
  pending: "formatWithBracketCombosPending",
  unavailable: "formatWithBracketCombosNotChecked",
} as const satisfies Readonly<Record<ComboData["kind"], string>>;

/** The deck's format, with the bracket the builder shows for it. */
function FormatAndBracket({
  deck,
  bracketScore,
  comboData,
}: {
  readonly deck: Deck;
  readonly bracketScore: BracketScore | null;
  readonly comboData: ComboData | undefined;
}) {
  const t = useTranslations("builder.summary");
  const format = useTranslations("deck.format.name")(deck.format);
  const bracket = shownBracket(deck, bracketScore);
  if (!bracket) return <span>{format}</span>;
  // The player's own bracket is a choice, not an estimate: the combo lookup does not change it.
  const key = bracket.setByPlayer
    ? "formatWithManualBracket"
    : ESTIMATE_KEY[comboData?.kind ?? "found"];
  return <span>{t(key, { format, level: bracket.level })}</span>;
}

/** A bracket as the bar shows it, and whether the player set it. */
interface ShownBracket {
  readonly level: BracketLevel;
  readonly setByPlayer: boolean;
}

/**
 * The bracket the builder's bracket panel shows (`BracketIndicator`): the player's own when set,
 * otherwise the estimate. A format without bracket scoring, such as Standard, shows none.
 */
function shownBracket(
  deck: Deck,
  bracketScore: BracketScore | null
): ShownBracket | null {
  if (!getFormatConfig(deck.format).hasBracketScoring) return null;
  if (deck.manualBracket !== null) {
    return { level: deck.manualBracket, setByPlayer: true };
  }
  if (!bracketScore) return null;
  return { level: bracketScore.overall, setByPlayer: false };
}

/**
 * The deck's total price, the figure the Deck Price panel shows, then the number of cards with no
 * price in that panel's words. A deck whose played cards have no known price says so rather than
 * show $0.00 (I-01).
 */
function DeckPrice() {
  const locale = useLocale();
  const t = useTranslations("deck.stats");
  const { totalPrice, missingPriceCount } = useDeckPrice();
  return (
    <>
      <span>
        {totalPrice === null
          ? t("priceUnknown")
          : formatUsdPrice(locale, totalPrice)}
      </span>
      {missingPriceCount > 0 && (
        <span>{t("missingPrices", { count: missingPriceCount })}</span>
      )}
    </>
  );
}

/**
 * The deck's counts by card type, a type with no card left out. From `lg` up they sit on the
 * line; below it, where the line has no room, a "Types" disclosure opens them on a line of their
 * own.
 */
function TypeCounts({ deck }: { readonly deck: Deck }) {
  const t = useTranslations("builder.summary");
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  const typeCounts = countDeckCardTypes(deck);
  if (typeCounts.length === 0) return null;

  return (
    <>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => setExpanded((open) => !open)}
        className="inline-flex min-h-8 items-center gap-1 rounded-[var(--lumen-radius-pill)] border border-[var(--border)] px-2.5 text-[var(--text-primary)] lg:hidden"
      >
        {t("typesToggle")}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-3 w-3 transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
      <ul
        id={listId}
        aria-label={t("typesLabel")}
        className={cn(
          "flex flex-wrap gap-x-2 gap-y-0.5 max-lg:basis-full lg:ml-auto",
          "[&>li+li]:before:mr-2 [&>li+li]:before:content-['·']",
          !expanded && "max-lg:hidden"
        )}
      >
        {typeCounts.map(({ type, count }) => (
          <li key={type}>{t(`types.${type}`, { count })}</li>
        ))}
      </ul>
    </>
  );
}
