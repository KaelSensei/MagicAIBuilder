"use client";
/**
 * The quick-add palette: type a card name, a Commander role or a sentence,
 * read the Scryfall query, and add a result without closing.
 *
 * Card catalog, quick add (I-37 slices 11.4 and 22). The Name, By Set and By
 * Color search is a different surface and stays the default. A sentence is
 * rules text only in the Rules text reading; the model that writes a query
 * from a description stays in the search panel (I-14). Enter adds to the main
 * deck, Shift+Enter to the sideboard, Alt+Enter to considering.
 *
 * This module composes the dialog. The highlight, the "added" line and the
 * keys live in `useQuickAddPalette`; the reading switch and the status line
 * are their own components.
 *
 * Not responsible for: running the search. The host passes the cards.
 *
 * @module search/QuickAddPalette
 */
import { useId } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import type { DeckZone } from "@/lib/deck/types";
import {
  planQuickAddQuery,
  type QuickAddReading,
  type QuickAddScope,
} from "@/lib/search/quick-add-query";
import type { ScryfallCard } from "@/lib/scryfall/types";
import {
  QuickAddResultList,
  quickAddOptionId,
} from "@/components/search/QuickAddResultList";
import {
  QuickAddPhaseMessage,
  type QuickAddPhase,
} from "@/components/search/QuickAddPhaseMessage";
import { QuickAddReadingSwitch } from "@/components/search/QuickAddReadingSwitch";
import { useQuickAddPalette } from "@/components/search/useQuickAddPalette";

export type { QuickAddPhase } from "@/components/search/QuickAddPhaseMessage";

interface QuickAddPaletteProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly text: string;
  readonly onTextChange: (text: string) => void;
  readonly reading: QuickAddReading;
  readonly onReadingChange: (reading: QuickAddReading) => void;
  readonly scope: QuickAddScope;
  readonly cards: readonly ScryfallCard[];
  readonly phase: QuickAddPhase;
  readonly onAdd: (card: ScryfallCard, zone: DeckZone) => void;
}

/**
 * The palette dialog.
 *
 * @param props - The line, the reading, the deck scope, the results and the add action
 * @returns The dialog while it is open
 */
export function QuickAddPalette(props: QuickAddPaletteProps) {
  const t = useTranslations("search");
  const listId = useId();
  const state = useQuickAddPalette(props);
  const plan = planQuickAddQuery({
    text: props.text,
    reading: props.reading,
    scope: props.scope,
  });

  return (
    <Modal
      open={props.open}
      onClose={() => props.onOpenChange(false)}
      title={t("quickAdd.title")}
      maxWidth="max-w-xl"
    >
      <div className="space-y-3 px-5 py-4">
        <input
          type="text"
          role="combobox"
          aria-expanded={props.phase === "results"}
          aria-controls={listId}
          aria-activedescendant={
            state.active ? quickAddOptionId(state.active.id) : undefined
          }
          aria-autocomplete="list"
          aria-label={t("quickAdd.title")}
          placeholder={t("quickAdd.placeholder")}
          value={props.text}
          onChange={(event) => state.onTextChange(event.target.value)}
          onKeyDown={state.onKeyDown}
          className="w-full rounded-[var(--lumen-radius-lg)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)]"
        />
        <QuickAddReadingSwitch
          reading={props.reading}
          onChange={props.onReadingChange}
        />
        {plan.kind !== "idle" && (
          <p className="truncate font-mono text-xs text-[var(--text-secondary)]">
            {t("executedQuery", { query: plan.query })}
          </p>
        )}
        <p className="text-xs text-[var(--text-secondary)]">
          {t("quickAdd.hint")}
        </p>
        <QuickAddPhaseMessage phase={props.phase} />
        {state.notice && (
          <output className="block text-sm text-[var(--accent-text)]">
            {state.notice}
          </output>
        )}
        <QuickAddResultList
          listId={listId}
          cards={props.phase === "results" ? props.cards : []}
          activeIndex={state.activeIndex}
          onAdd={(card) => state.add(card, "main")}
        />
      </div>
    </Modal>
  );
}
