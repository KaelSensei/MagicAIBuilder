import type { Deck } from "@/lib/deck/types";

export type DecksViewMode = "grid" | "list";

const DECKS_VIEW_MODE_KEY = "mab-decks-view-mode";

function isDecksViewMode(value: string): value is DecksViewMode {
  return value === "grid" || value === "list";
}

export function getStoredDecksViewMode(): DecksViewMode | null {
  try {
    const raw = globalThis.localStorage?.getItem(DECKS_VIEW_MODE_KEY);
    if (raw === null) return null;
    if (isDecksViewMode(raw)) return raw;
    return null;
  } catch {
    return null;
  }
}

export function storeDecksViewMode(mode: DecksViewMode): void {
  try {
    globalThis.localStorage?.setItem(DECKS_VIEW_MODE_KEY, mode);
  } catch {
    // ignore: preference persistence should not break UI
  }
}

export type DecksSortKey = "updatedAt" | "name" | "bracket";
export type DecksSortDir = "asc" | "desc";

export function sortDecks(
  decks: readonly Deck[],
  key: DecksSortKey,
  dir: DecksSortDir
): readonly Deck[] {
  const dirMul = dir === "asc" ? 1 : -1;
  const copy = [...decks];

  copy.sort((a, b) => {
    if (key === "updatedAt") {
      const av = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
      const bv = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
      return (av - bv) * dirMul;
    }

    if (key === "name") {
      return a.name.localeCompare(b.name) * dirMul;
    }

    if (key === "bracket") {
      const ab = (a.manualBracket ?? a.targetBracket) ?? 0;
      const bb = (b.manualBracket ?? b.targetBracket) ?? 0;
      return (ab - bb) * dirMul;
    }

    const _exhaustive: never = key;
    return _exhaustive;
  });

  return copy;
}

