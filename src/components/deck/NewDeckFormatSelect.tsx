"use client";
/**
 * The format a new deck is created in, chosen on the `/decks` page before the
 * player creates it (I-42 requirement 4.1). Commander is the default; the
 * options are `FormatOptions`, grouped and named from the catalogues.
 *
 * Context: deck building (ui), on the deck library page. It only holds the
 * choice; the page passes it to `createDeck`.
 *
 * Not responsible for: the header's quick "New deck" and the AI wizard, which
 * still create Commander decks.
 *
 * @module deck/NewDeckFormatSelect
 */
import { useId } from "react";
import { useTranslations } from "next-intl";
import { fieldShellClassName } from "@/components/ui/Input";
import { cn } from "@/components/ui/utils";
import { isDeckFormat, type DeckFormat } from "@/lib/deck/formats";
import { FormatOptions } from "./FormatOptions";

interface NewDeckFormatSelectProps {
  /** The format the next deck will be created in */
  readonly value: DeckFormat;
  readonly onChange: (format: DeckFormat) => void;
}

/** A labelled native `select` of the formats. */
export function NewDeckFormatSelect({
  value,
  onChange,
}: NewDeckFormatSelectProps) {
  const t = useTranslations("deck.home");
  const selectId = useId();

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={selectId}
        className="shrink-0 text-sm text-[var(--text-secondary)]"
      >
        {t("newDeckFormat")}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(event) => {
          if (isDeckFormat(event.target.value)) onChange(event.target.value);
        }}
        className={cn(fieldShellClassName, "h-9 px-3")}
      >
        <FormatOptions />
      </select>
    </div>
  );
}
