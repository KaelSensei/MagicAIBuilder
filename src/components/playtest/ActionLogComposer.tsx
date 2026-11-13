"use client";
/**
 * Where the player adds to the playtest log by hand: a free-text action, and,
 * when the game records mana, a mana amount.
 *
 * Playtest context, UI. Owns the drafts only; `PlaytestActionLog` appends the
 * entries through `onAdd` and `onRecordMana`. Enter or the add button sends a
 * non-blank draft and clears the field. The mana amount is recorded as a
 * number so the turn evidence can count it; free text about mana is not
 * parsed.
 *
 * @module playtest/ActionLogComposer
 */
import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

/** What adding a free-text action and recording mana do. */
export interface ActionLogComposerProps {
  /** Called with the draft as typed, never blank. */
  readonly onAdd: (description: string) => void;
  /** When absent the mana form is not shown. Called with a whole number from 1 to 100. */
  readonly onRecordMana?: (amount: number) => void;
}

const MIN_MANA = 1;
const MAX_MANA = 100;

/** The mana form accepts whole numbers from 1 to 100; anything else disables the button. */
function isRecordableMana(amount: string): boolean {
  const value = Number(amount);
  return Number.isInteger(value) && value >= MIN_MANA && value <= MAX_MANA;
}

/** The free-text field with its add button, then the mana form when it applies. */
export function ActionLogComposer({
  onAdd,
  onRecordMana,
}: ActionLogComposerProps) {
  const t = useTranslations("playtest.log");
  const [draft, setDraft] = useState("");
  const [manaAmount, setManaAmount] = useState(String(MIN_MANA));

  const addEntry = () => {
    if (draft.trim() === "") return;
    onAdd(draft);
    setDraft("");
  };

  return (
    <>
      <div className="mb-3 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && addEntry()}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-purple-400/60"
        />
        <button
          type="button"
          onClick={addEntry}
          aria-label={t("add")}
          className="rounded-md bg-purple-500/15 p-2 text-purple-200 hover:bg-purple-500/25"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      {onRecordMana && (
        <div className="mb-3 flex items-center gap-2">
          <label
            htmlFor="playtest-mana-amount"
            className="text-xs text-[var(--text-secondary)]"
          >
            {t("manaAmount")}
          </label>
          <input
            id="playtest-mana-amount"
            type="number"
            min={MIN_MANA}
            max={MAX_MANA}
            step="1"
            value={manaAmount}
            onChange={(event) => setManaAmount(event.target.value)}
            className="w-16 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--text-primary)]"
          />
          <button
            type="button"
            disabled={!isRecordableMana(manaAmount)}
            onClick={() => onRecordMana(Number(manaAmount))}
            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] disabled:opacity-40"
          >
            {t("recordMana")}
          </button>
        </div>
      )}
    </>
  );
}
