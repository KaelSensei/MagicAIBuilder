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
 * Not responsible for: running the search. The host passes the cards.
 *
 * @module search/QuickAddPalette
 */
import { useId, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import type { DeckZone } from "@/lib/deck/types";
import {
  planQuickAddQuery,
  zoneForQuickAddChord,
  type QuickAddReading,
  type QuickAddScope,
} from "@/lib/search/quick-add-query";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { QuickAddResultList, quickAddOptionId } from "@/components/search/QuickAddResultList";

/** What the palette shows under the query. */
export type QuickAddPhase = "idle" | "loading" | "error" | "empty" | "results";

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
  const zones = useTranslations("card");
  const listId = useId();
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const plan = planQuickAddQuery({ text: props.text, reading: props.reading, scope: props.scope });
  const activeIndex = props.cards.length === 0 ? -1 : Math.min(index, props.cards.length - 1);
  const active = activeIndex >= 0 ? props.cards[activeIndex] : undefined;

  function add(card: ScryfallCard, zone: DeckZone) {
    props.onAdd(card, zone);
    setNotice(t("quickAdd.added", { name: card.name, zone: zoneName(zone, zones) }));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (handleReadingToggle(event, props.reading, props.onReadingChange)) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setIndex((current) => clampIndex(current + step, props.cards.length));
      return;
    }
    const zone = zoneForQuickAddChord(event);
    if (!zone || !active) return;
    event.preventDefault();
    add(active, zone);
  }

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
          aria-activedescendant={active ? quickAddOptionId(active.id) : undefined}
          aria-autocomplete="list"
          aria-label={t("quickAdd.title")}
          placeholder={t("quickAdd.placeholder")}
          value={props.text}
          onChange={(event) => {
            setIndex(0);
            setNotice(null);
            props.onTextChange(event.target.value);
          }}
          onKeyDown={onKeyDown}
          className="w-full rounded-[var(--lumen-radius-lg)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        />
        <ReadingSwitch reading={props.reading} onChange={props.onReadingChange} />
        {plan.kind !== "idle" && (
          <p className="truncate font-mono text-xs text-[var(--text-secondary)]">
            {t("executedQuery", { query: plan.query })}
          </p>
        )}
        <p className="text-xs text-[var(--text-secondary)]">{t("quickAdd.hint")}</p>
        <PhaseMessage phase={props.phase} />
        {notice && (
          <output className="block text-sm text-[var(--accent-text)]">{notice}</output>
        )}
        <QuickAddResultList
          listId={listId}
          cards={props.phase === "results" ? props.cards : []}
          activeIndex={activeIndex}
          onAdd={(card) => add(card, "main")}
        />
      </div>
    </Modal>
  );
}

/** Name or rules text. Alt+R does the same from the combobox. */
function ReadingSwitch(props: {
  readonly reading: QuickAddReading;
  readonly onChange: (reading: QuickAddReading) => void;
}) {
  const t = useTranslations("search");
  return (
    <fieldset className="m-0 flex min-w-0 gap-1 border-0 p-0">
      <legend className="sr-only">{t("quickAdd.readingGroup")}</legend>
      <ReadingButton
        pressed={props.reading === "name"}
        label={t("quickAdd.nameReading")}
        onClick={() => props.onChange("name")}
      />
      <ReadingButton
        pressed={props.reading === "oracle"}
        label={t("quickAdd.oracleReading")}
        onClick={() => props.onChange("oracle")}
      />
    </fieldset>
  );
}

function ReadingButton(props: {
  readonly pressed: boolean;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.pressed}
      onClick={props.onClick}
      className={
        props.pressed
          ? "rounded-[var(--lumen-radius-pill)] bg-[var(--accent)] px-3 py-1 text-xs text-white"
          : "rounded-[var(--lumen-radius-pill)] border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]"
      }
    >
      {props.label}
    </button>
  );
}

/** The idle, loading, error and empty lines. Results render their own list. */
function PhaseMessage(props: { readonly phase: QuickAddPhase }) {
  const t = useTranslations("search");
  switch (props.phase) {
    case "idle":
      return <p className="text-sm text-[var(--text-secondary)]">{t("quickAdd.idle")}</p>;
    case "loading":
      return <p className="text-sm text-[var(--text-secondary)]">{t("quickAdd.searching")}</p>;
    case "error":
      return <p role="alert" className="text-sm text-red-400">{t("quickAdd.error")}</p>;
    case "empty":
      return <p className="text-sm text-[var(--text-secondary)]">{t("quickAdd.noResults")}</p>;
    case "results":
      return null;
  }
  const _exhaustive: never = props.phase;
  return _exhaustive;
}

/**
 * Alt+R toggles the reading. The key is left alone with any other modifier.
 *
 * @param event - The combobox keydown
 * @param reading - The reading in force
 * @param onChange - Receives the other reading
 * @returns True when the key was the toggle
 */
function handleReadingToggle(
  event: KeyboardEvent<HTMLInputElement>,
  reading: QuickAddReading,
  onChange: (reading: QuickAddReading) => void
): boolean {
  if (event.key.toLowerCase() !== "r" || !event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
    return false;
  }
  event.preventDefault();
  onChange(reading === "name" ? "oracle" : "name");
  return true;
}

/**
 * Keeps a highlight inside the result list.
 *
 * @param index - The requested index, which may fall outside the list
 * @param count - How many results are shown
 * @returns An index inside the list, or 0 when the list is empty
 */
function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  if (index < 0) return 0;
  if (index >= count) return count - 1;
  return index;
}

/**
 * The short zone name from the card catalogue.
 *
 * @param zone - The zone the card was added to
 * @param t - The `card` catalogue
 * @returns The zone's label
 */
function zoneName(zone: DeckZone, t: (key: "zoneMain" | "zoneSideboard" | "zoneConsidering") => string): string {
  switch (zone) {
    case "main":
      return t("zoneMain");
    case "sideboard":
      return t("zoneSideboard");
    case "maybeboard":
      return t("zoneConsidering");
  }
  const _exhaustive: never = zone;
  return _exhaustive;
}
