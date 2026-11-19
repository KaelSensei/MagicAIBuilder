"use client";
/**
 * Picks a deck's format in its settings (I-42 requirement 4.1). Picking
 * another format saves nothing yet: it opens `FormatSwitchPreview`, which
 * lists what would break, and only the player's confirmation saves. No card
 * is removed (requirement 4.2).
 *
 * Context: deck building (ui), inside `DeckDetailsPanel`. Saving goes through
 * the store's `setFormat`, optimistic like `setBudget`: a failed save puts the
 * previous format back, and this picker says so with a catalogue message. A
 * guest deck keeps its format in this browser, as it keeps its budget.
 *
 * @module deck/DeckFormatPicker
 */
import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { fieldShellClassName } from "@/components/ui/Input";
import { cn } from "@/components/ui/utils";
import { isDeckFormat, type DeckFormat } from "@/lib/deck/formats";
import { useDeckStore } from "@/lib/deck/store";
import type { Deck } from "@/lib/deck/types";
import { FormatOptions } from "./FormatOptions";
import { FormatSwitchPreview } from "./FormatSwitchPreview";

interface DeckFormatPickerProps {
  /** The store's active deck: `setFormat` writes to the active deck. */
  readonly deck: Deck;
}

/**
 * A labelled native `select` of the formats, grouped, with the switch
 * preview under it while a new format waits for confirmation.
 */
export function DeckFormatPicker({ deck }: DeckFormatPickerProps) {
  const t = useTranslations("builder.details");
  const formatName = useTranslations("deck.format.name");
  const setFormat = useDeckStore((state) => state.setFormat);
  const selectId = useId();
  const selectRef = useRef<HTMLSelectElement>(null);
  const [pending, setPending] = useState<DeckFormat | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  const choose = (value: string) => {
    if (!isDeckFormat(value)) return;
    setSaveFailed(false);
    setPending(value === deck.format ? null : value);
  };
  const cancel = () => {
    setPending(null);
    selectRef.current?.focus();
  };
  const confirm = async (format: DeckFormat) => {
    setPending(null);
    selectRef.current?.focus();
    setSaveFailed(!(await setFormat(format)));
  };

  return (
    <div className="space-y-1.5 border-b border-[var(--border)] px-3 py-2">
      <label
        htmlFor={selectId}
        className="block text-xs text-[var(--text-secondary)]"
      >
        {t("format")}
      </label>
      <select
        id={selectId}
        ref={selectRef}
        value={pending ?? deck.format}
        onChange={(event) => choose(event.target.value)}
        className={cn(fieldShellClassName, "h-8 w-full px-3")}
      >
        <FormatOptions />
      </select>
      {pending && (
        <FormatSwitchPreview
          deck={deck}
          target={pending}
          onConfirm={() => void confirm(pending)}
          onCancel={cancel}
        />
      )}
      {saveFailed && (
        <p role="alert" className="text-xs text-red-400">
          {t("formatSaveFailed", { format: formatName(deck.format) })}
        </p>
      )}
    </div>
  );
}
