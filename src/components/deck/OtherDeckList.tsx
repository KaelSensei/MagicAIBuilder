"use client";
/**
 * The list of the player's other decks in the "Add to another deck…" picker
 * (I-37), with a name filter, and the empty, loading and failed states of the
 * listing.
 *
 * Deck-building context, presentational list over `useOtherDecks`. Choosing a
 * deck hands it to the dialog, which adds the card.
 *
 * @module deck/OtherDeckList
 */
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/components/ui/utils";
import {
  OTHER_DECKS_PAGE_SIZE,
  useOtherDecks,
  type OtherDeckSummary,
} from "@/hooks/useOtherDecks";

const MESSAGE = "px-5 py-3 text-sm text-[var(--text-secondary)]";

interface OtherDeckListProps {
  /** The deck open in the editor, left out of the list. */
  readonly openDeckId: string;
  /** True while an add runs: no second deck can be chosen. */
  readonly disabled: boolean;
  readonly onPick: (deck: OtherDeckSummary) => void;
}

/** Whether the deck's name holds the filter, ignoring case. */
function matchesFilter(deck: OtherDeckSummary, filter: string): boolean {
  return deck.name
    .toLocaleLowerCase()
    .includes(filter.trim().toLocaleLowerCase());
}

/**
 * Lists the other decks as buttons, filtered by name.
 */
export function OtherDeckList({
  openDeckId,
  disabled,
  onPick,
}: OtherDeckListProps) {
  const t = useTranslations("builder.rowAddElsewhere");
  const { decks, isTruncated, isLoading, isError, retry } =
    useOtherDecks(openDeckId);
  const [filter, setFilter] = useState("");

  if (isLoading) {
    return <output className={cn(MESSAGE, "block")}>{t("loading")}</output>;
  }
  if (isError) {
    return (
      <div role="alert" className={cn(MESSAGE, "flex items-center gap-3")}>
        <span>{t("listFailed")}</span>
        <button
          type="button"
          onClick={retry}
          className="rounded px-2 py-1 text-[var(--accent-text)] hover:bg-[var(--surface-hover)]"
        >
          {t("retry")}
        </button>
      </div>
    );
  }
  if (decks.length === 0) {
    return <p className={MESSAGE}>{t("noOtherDeck")}</p>;
  }

  const shown = decks.filter((deck) => matchesFilter(deck, filter));
  return (
    <div className="px-5 py-3">
      <label className="block text-xs text-[var(--text-secondary)]">
        {t("filterLabel")}
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm text-[var(--text-primary)]"
        />
      </label>
      {shown.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {t("noMatch")}
        </p>
      ) : (
        <ul className="mt-3 max-h-64 overflow-y-auto">
          {shown.map((deck) => (
            <li key={deck.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(deck)}
                className="w-full truncate rounded px-2 py-1.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
              >
                {deck.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {isTruncated && (
        <p className="mt-2 text-xs text-[var(--text-secondary)]">
          {t("onlyLatest", { count: OTHER_DECKS_PAGE_SIZE })}
        </p>
      )}
    </div>
  );
}
