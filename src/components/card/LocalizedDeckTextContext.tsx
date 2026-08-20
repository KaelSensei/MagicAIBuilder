"use client";
import { createContext, useContext, type ReactNode } from "react";
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
  return useContext(LocalizedDeckTextContext).get(englishName)?.name ?? englishName;
}
