"use client";
/**
 * The builder's "Deck details" section: the deck-level settings a player sets
 * once and revisits.
 *
 * Context: deck building (ui), mounted at the top of the builder's analysis
 * sidebar. It composes one small editor per setting; each saves through an
 * optimistic deck store action that restores the previous value on a failed
 * save. These actions were tested but had no reachable UI until owner decision
 * OD-01 (2026-11-10) brought them back.
 *
 * Not responsible for: the manual bracket override, which lives in
 * `BracketIndicator`.
 *
 * @module deck/DeckDetailsPanel
 */
import { useId } from "react";
import { useTranslations } from "next-intl";
import { getFormatConfig } from "@/lib/deck/formats";
import { useDeckStore } from "@/lib/deck/store";
import type { Deck } from "@/lib/deck/types";
import { DeckBudgetInput } from "./DeckBudgetInput";
import { DeckDescriptionEditor } from "./DeckDescriptionEditor";
import { DeckTagsEditor } from "./DeckTagsEditor";
import { DeckTargetBracketPicker } from "./DeckTargetBracketPicker";

/** The deck fields this panel shows and edits. */
export type DeckDetails = Pick<
  Deck,
  "id" | "format" | "description" | "tags" | "targetBracket" | "budget"
>;

interface DeckDetailsPanelProps {
  /**
   * The store's active deck, as the store holds it: a failed save then shows
   * the restored value. It must be the active deck because `setTargetBracket`
   * and `setBudget` write to the active deck rather than to a deck id.
   */
  readonly deck: DeckDetails;
}

/** Shows and edits the details of one deck. */
export function DeckDetailsPanel({ deck }: DeckDetailsPanelProps) {
  const t = useTranslations("builder.details");
  const headingId = useId();
  const setTargetBracket = useDeckStore((state) => state.setTargetBracket);
  const setBudget = useDeckStore((state) => state.setBudget);

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)]"
    >
      <h2
        id={headingId}
        className="border-b border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
      >
        {t("title")}
      </h2>
      <DeckDescriptionEditor deckId={deck.id} description={deck.description} />
      <DeckTagsEditor deckId={deck.id} tags={deck.tags} />
      {/* Brackets are a Commander scale; the other formats have none. */}
      {getFormatConfig(deck.format).hasBracketScoring && (
        <DeckTargetBracketPicker
          value={deck.targetBracket}
          onChange={(bracket) => void setTargetBracket(bracket)}
        />
      )}
      <DeckBudgetInput
        value={deck.budget}
        onCommit={(budget) => void setBudget(budget)}
      />
    </section>
  );
}
