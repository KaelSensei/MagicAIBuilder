"use client";
/**
 * The quick-add palette's own state: which result is highlighted, the line that
 * says what was just added, and what the combobox's keys do.
 *
 * Card catalog, quick add (I-37 slices 11.4 and 22). The arrows move the
 * highlight and keep it inside the list; Enter adds to the main deck,
 * Shift+Enter to the sideboard, Alt+Enter to considering
 * (`zoneForQuickAddChord`); Alt+R switches the reading. Typing puts the
 * highlight back on the first result and clears the "added" line.
 *
 * Not responsible for: the line, the reading or the results, which the host
 * owns; the Ctrl+K / ⌘K shortcut, which `QuickAddPaletteHost` handles.
 *
 * @module search/useQuickAddPalette
 */
import { useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import type { DeckZone } from "@/lib/deck/types";
import {
  zoneForQuickAddChord,
  type QuickAddReading,
} from "@/lib/search/quick-add-query";
import type { ScryfallCard } from "@/lib/scryfall/types";

/** What the palette hands the hook: the results and the host's actions. */
export interface QuickAddPaletteInput {
  readonly cards: readonly ScryfallCard[];
  readonly reading: QuickAddReading;
  readonly onReadingChange: (reading: QuickAddReading) => void;
  readonly onTextChange: (text: string) => void;
  readonly onAdd: (card: ScryfallCard, zone: DeckZone) => void;
}

/** What the palette renders from: the highlight, the notice and the handlers. */
export interface QuickAddPaletteState {
  /** The highlighted result's index, or -1 when there is no result. */
  readonly activeIndex: number;
  readonly active: ScryfallCard | undefined;
  /** The "Added … to …" line, or null before an add and after typing. */
  readonly notice: string | null;
  readonly add: (card: ScryfallCard, zone: DeckZone) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  readonly onTextChange: (text: string) => void;
}

/**
 * The palette's highlight, notice and keyboard.
 *
 * @param input - The results, the reading and the host's actions
 * @returns The state and handlers the palette renders from
 */
export function useQuickAddPalette(
  input: QuickAddPaletteInput
): QuickAddPaletteState {
  const t = useTranslations("search");
  const zones = useTranslations("card");
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const count = input.cards.length;
  const activeIndex = count === 0 ? -1 : Math.min(index, count - 1);
  const active = activeIndex >= 0 ? input.cards[activeIndex] : undefined;

  function add(card: ScryfallCard, zone: DeckZone) {
    input.onAdd(card, zone);
    setNotice(
      t("quickAdd.added", { name: card.name, zone: zoneName(zone, zones) })
    );
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (handleReadingToggle(event, input.reading, input.onReadingChange)) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setIndex((current) => clampIndex(current + step, count));
      return;
    }
    const zone = zoneForQuickAddChord(event);
    if (!zone || !active) return;
    event.preventDefault();
    add(active, zone);
  }

  function onTextChange(text: string) {
    setIndex(0);
    setNotice(null);
    input.onTextChange(text);
  }

  return { activeIndex, active, notice, add, onKeyDown, onTextChange };
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
  if (
    event.key.toLowerCase() !== "r" ||
    !event.altKey ||
    event.shiftKey ||
    event.ctrlKey ||
    event.metaKey
  ) {
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
function zoneName(
  zone: DeckZone,
  t: (key: "zoneMain" | "zoneSideboard" | "zoneConsidering") => string
): string {
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
