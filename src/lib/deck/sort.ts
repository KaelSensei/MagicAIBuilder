// Card sorting and grouping logic for the DeckEditor
import type { DeckCard } from "./types";
import { CATEGORY_LABELS } from "./categories";

// ─── Types ─────────────────────────────────────────────────────────────────

export type SortField = "cmc" | "name" | "price" | "color" | "type";
export type SortDirection = "asc" | "desc";
export type GroupBy = "none" | "type" | "cmc" | "color";

export interface SortPreference {
  sortField: SortField;
  sortDirection: SortDirection;
  groupBy: GroupBy;
}

export const DEFAULT_SORT_PREFERENCE: SortPreference = {
  sortField: "cmc",
  sortDirection: "asc",
  groupBy: "type",
};

// ─── Color ordering (WUBRG) ───────────────────────────────────────────────

const COLOR_ORDER: Record<string, number> = { W: 0, U: 1, B: 2, R: 3, G: 4 };

/** Returns a numeric sort key for a card's color identity (WUBRG, then multi, then colorless). */
function colorSortKey(card: DeckCard): number {
  const colors = card.colorIdentity;
  if (colors.length === 0) return 6; // colorless last
  if (colors.length > 1) return 5;  // multicolor before colorless
  return COLOR_ORDER[colors[0]] ?? 4;
}

/** Primary color label for grouping. */
function colorGroupKey(card: DeckCard): string {
  const colors = card.colorIdentity;
  if (colors.length === 0) return "Colorless";
  if (colors.length > 1) return "Multicolor";
  const map: Record<string, string> = { W: "White", U: "Blue", B: "Black", R: "Red", G: "Green" };
  return map[colors[0]] ?? "Other";
}

const COLOR_GROUP_ORDER = ["White", "Blue", "Black", "Red", "Green", "Multicolor", "Colorless"];

// ─── Sorting ──────────────────────────────────────────────────────────────

type Comparator = (a: DeckCard, b: DeckCard) => number;

const SORT_COMPARATORS: Record<SortField, Comparator> = {
  cmc: (a, b) => a.cmc - b.cmc,
  name: (a, b) => a.name.localeCompare(b.name),
  price: (a, b) => (a.price ?? -1) - (b.price ?? -1),
  color: (a, b) => colorSortKey(a) - colorSortKey(b),
  type: (a, b) => a.typeLine.localeCompare(b.typeLine),
};

/** Sorts a list of deck cards by the given field and direction. */
export function sortCards(
  cards: DeckCard[],
  field: SortField,
  direction: SortDirection
): DeckCard[] {
  const comparator = SORT_COMPARATORS[field];
  const sorted = [...cards].sort((a, b) => {
    const primary = comparator(a, b);
    if (primary !== 0) return direction === "asc" ? primary : -primary;
    // Secondary sort: always name asc for stable ordering
    return a.name.localeCompare(b.name);
  });
  return sorted;
}

// ─── Grouping ─────────────────────────────────────────────────────────────

export interface CardGroup {
  key: string;
  label: string;
  cards: DeckCard[];
}

function buildCmcGroups(cards: DeckCard[]): CardGroup[] {
  const buckets = new Map<number, DeckCard[]>();
  for (const card of cards) {
    const cmc = Math.min(card.cmc, 7); // 7+ bucket
    const existing = buckets.get(cmc) ?? [];
    existing.push(card);
    buckets.set(cmc, existing);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([cmc, groupCards]) => ({
      key: String(cmc),
      label: cmc >= 7 ? "7+ CMC" : `${cmc} CMC`,
      cards: groupCards,
    }));
}

function buildColorGroups(cards: DeckCard[]): CardGroup[] {
  const buckets = new Map<string, DeckCard[]>();
  for (const card of cards) {
    const key = colorGroupKey(card);
    const existing = buckets.get(key) ?? [];
    existing.push(card);
    buckets.set(key, existing);
  }
  return COLOR_GROUP_ORDER
    .filter((key) => buckets.has(key))
    .map((key) => ({ key, label: key, cards: buckets.get(key)! }));
}

function buildTypeGroups(cards: DeckCard[]): CardGroup[] {
  const buckets = new Map<string, DeckCard[]>();
  for (const card of cards) {
    const key = card.category;
    const existing = buckets.get(key) ?? [];
    existing.push(card);
    buckets.set(key, existing);
  }
  const label = (key: string) => CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] ?? key;
  return Array.from(buckets.entries()).map(([key, groupCards]) => ({
    key,
    label: label(key),
    cards: groupCards,
  }));
}

/**
 * Groups an already-sorted list of cards into labelled sections.
 * Returns a single group when groupBy is "none".
 */
export function groupCards(cards: DeckCard[], groupBy: GroupBy): CardGroup[] {
  if (groupBy === "none") {
    return [{ key: "all", label: "All Cards", cards }];
  }
  if (groupBy === "cmc") return buildCmcGroups(cards);
  if (groupBy === "color") return buildColorGroups(cards);
  return buildTypeGroups(cards);
}

// ─── localStorage helpers ─────────────────────────────────────────────────

const LS_KEY = "deckSortPreference";

export function loadSortPreference(): SortPreference {
  if (globalThis.window === undefined) return DEFAULT_SORT_PREFERENCE;
  try {
    const raw = globalThis.window.localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_SORT_PREFERENCE;
    const parsed = JSON.parse(raw) as Partial<SortPreference>;
    return {
      sortField: parsed.sortField ?? DEFAULT_SORT_PREFERENCE.sortField,
      sortDirection: parsed.sortDirection ?? DEFAULT_SORT_PREFERENCE.sortDirection,
      groupBy: parsed.groupBy ?? DEFAULT_SORT_PREFERENCE.groupBy,
    };
  } catch {
    return DEFAULT_SORT_PREFERENCE;
  }
}

export function saveSortPreference(pref: SortPreference): void {
  if (globalThis.window === undefined) return;
  try {
    globalThis.window.localStorage.setItem(LS_KEY, JSON.stringify(pref));
  } catch {
    // Storage quota exceeded or private mode — fail silently
  }
}
