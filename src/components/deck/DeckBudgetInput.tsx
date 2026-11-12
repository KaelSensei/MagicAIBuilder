"use client";
/**
 * The deck's budget per card: the most the player wants to pay for one card.
 *
 * Context: deck building (ui), inside `DeckDetailsPanel`. `Deck.budget` is a
 * cap per card: `computeDeckStats` lists the cards priced above it as over
 * budget, and the deck wizard and `POST /api/ai/build` send it as a maximum
 * per card. Prices are Scryfall's US dollar quotes, never converted
 * (docs/product/user-guide.md, "Prices and Budgets").
 *
 * Not responsible for: saving. The caller passes the store action.
 *
 * @module deck/DeckBudgetInput
 */
import { useId, useState } from "react";
import { useTranslations } from "next-intl";

interface DeckBudgetInputProps {
  /** The deck's saved budget per card, in US dollars; `null` for no limit. */
  readonly value: number | null;
  /**
   * Called with the budget the player confirms, by pressing Enter or leaving
   * the field, when it differs from `value`; `null` when they emptied it.
   */
  readonly onCommit: (budget: number | null) => void;
}

/** The field's text for a saved budget: empty for no limit. */
function formatBudget(budget: number | null): string {
  return budget === null ? "" : String(budget);
}

/** What the field holds, read as a budget per card. */
type BudgetEntry =
  | { readonly kind: "noLimit" }
  | { readonly kind: "amount"; readonly budget: number }
  | { readonly kind: "invalid" };

/**
 * Reads the field. An empty field means no limit. The server accepts only a
 * positive amount (`patchDeckSchema` in `src/lib/validation/deck.ts`), so zero,
 * a negative amount or anything that is not a number is invalid.
 */
function readBudget(draft: string): BudgetEntry {
  const typed = draft.trim();
  if (typed === "") return { kind: "noLimit" };
  const amount = Number(typed);
  return Number.isFinite(amount) && amount > 0
    ? { kind: "amount", budget: amount }
    : { kind: "invalid" };
}

/** A labelled amount field for the deck's budget per card. */
export function DeckBudgetInput({ value, onCommit }: DeckBudgetInputProps) {
  const t = useTranslations("builder.details");
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const [draft, setDraft] = useState(formatBudget(value));
  const [invalid, setInvalid] = useState(false);
  const [shownValue, setShownValue] = useState(value);

  // The saved budget can change under the field: the store restores the old
  // amount when a save fails. The field then shows the saved amount again.
  // Adjusting state during render: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (value !== shownValue) {
    setShownValue(value);
    setDraft(formatBudget(value));
  }

  const save = (budget: number | null) => {
    setInvalid(false);
    // Enter and the blur that follows both commit; only a change is saved.
    if (budget !== value) onCommit(budget);
  };

  const commit = () => {
    const entry = readBudget(draft);
    switch (entry.kind) {
      case "invalid":
        setInvalid(true);
        return;
      case "noLimit":
        save(null);
        return;
      case "amount":
        save(entry.budget);
        return;
      default: {
        const unreachable: never = entry;
        return unreachable;
      }
    }
  };

  return (
    <div className="space-y-1 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="text-xs text-[var(--text-secondary)]"
        >
          {t("budget")}
        </label>
        <div className="flex items-center gap-1">
          <span
            aria-hidden="true"
            className="text-xs text-[var(--text-secondary)]"
          >
            $
          </span>
          <input
            id={inputId}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit();
            }}
            aria-invalid={invalid}
            aria-describedby={invalid ? `${hintId} ${errorId}` : hintId}
            className="w-20 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-right text-xs text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
          />
        </div>
      </div>
      <p id={hintId} className="text-[10px] text-[var(--text-secondary)]">
        {t("budgetHint")}
      </p>
      {invalid && (
        <p id={errorId} role="alert" className="text-[10px] text-red-400">
          {t("budgetInvalid")}
        </p>
      )}
    </div>
  );
}
