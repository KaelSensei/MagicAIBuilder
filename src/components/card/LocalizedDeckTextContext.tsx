"use client";
import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useLocalizedDeckIndex } from "@/hooks/useLocalizedDeckIndex";
import type { LocalizedCardText } from "@/lib/scryfall/localized";

const EMPTY_INDEX: ReadonlyMap<string, LocalizedCardText> = new Map();

const LocalizedDeckTextContext =
  createContext<ReadonlyMap<string, LocalizedCardText>>(EMPTY_INDEX);

interface LocalizedDeckTextProviderProps {
  /** English names of every card the subtree will render */
  readonly names: readonly string[];
  readonly children: ReactNode;
}

/**
 * Runs the localised batch once for a deck surface and hands the index down
 * to every row, so a hundred `CardListItem`s share five requests rather than
 * each owning a fetch. Rows rendered outside a provider see an empty index
 * and stay English — the fallback is the absence of the provider, not a
 * second code path.
 */
export function LocalizedDeckTextProvider({
  names,
  children,
}: LocalizedDeckTextProviderProps) {
  const index = useLocalizedDeckIndex(names);
  return (
    <LocalizedDeckTextContext.Provider value={index}>
      {children}
    </LocalizedDeckTextContext.Provider>
  );
}

/**
 * The display name for a card, translated when the nearest provider has a
 * printing for it. Display only — never write the result back into a deck.
 *
 * @param englishName - the card's oracle name as stored on the `DeckCard`
 * @returns the localised name, or `englishName` when none is known
 */
export function useLocalizedDeckName(englishName: string): string {
  return useLocalizedDeckText(englishName)?.name ?? englishName;
}

/**
 * The full localised entry for a card — name, type line, rules and the
 * printing's image — or null when the nearest provider has no translated
 * printing for it. Display only.
 *
 * @param englishName - the card's oracle name as stored on the `DeckCard`
 */
export function useLocalizedDeckText(englishName: string): LocalizedCardText | null {
  return useContext(LocalizedDeckTextContext).get(englishName) ?? null;
}

/** The two fields a card surface shows: what to call it and what to draw. */
export interface LocalizedCardView {
  readonly name: string;
  readonly imageUri: string;
}

/**
 * A localiser for components that render many cards in one `map` — hooks
 * cannot be called per item, so the lookup is returned as a function.
 *
 * @returns a function taking any card with an English `name` and `imageUri`
 *   and returning the translated pair, or the card's own values when the
 *   nearest provider has no printing for it
 */
export function useLocalizeDeckCard(): (card: LocalizedCardView) => LocalizedCardView {
  const index = useContext(LocalizedDeckTextContext);
  return useCallback(
    (card: LocalizedCardView): LocalizedCardView => {
      const entry = index.get(card.name);
      return entry ? { name: entry.name, imageUri: entry.imageUri } : card;
    },
    [index]
  );
}
