/**
 * Card Favorites & Wishlist — Pure functions for favorites management
 * Zero framework dependencies. All state transitions are immutable.
 */

import { randomAlphanumericId } from "@/lib/crypto-random";

// ─── Types ────────────────────────────────────────────────────────────────
export interface CardFavorite {
  readonly scryfallId: string;
  readonly name: string;
  readonly typeLine: string;
  readonly cmc: number;
  readonly price: number | null;
  readonly imageUri: string;
  readonly addedAt: Date;
}

export interface FavoriteList {
  readonly id: string;
  readonly name: string;
  readonly cards: readonly CardFavorite[];
  readonly createdAt: Date;
}

export type FavoriteFilter = "all" | "creatures" | "spells" | "lands" | "custom";
export type FavoriteSort = "recently_added" | "price" | "cmc";

// ─── Add / remove ─────────────────────────────────────────────────────────
export function addFavorite(
  favorites: readonly CardFavorite[],
  card: CardFavorite
): CardFavorite[] {
  if (favorites.some((f) => f.scryfallId === card.scryfallId)) {
    return [...favorites];
  }
  return [...favorites, card];
}

export function removeFavorite(
  favorites: readonly CardFavorite[],
  scryfallId: string
): CardFavorite[] {
  return favorites.filter((f) => f.scryfallId !== scryfallId);
}

export function isFavorited(
  favorites: readonly CardFavorite[],
  scryfallId: string
): boolean {
  return favorites.some((f) => f.scryfallId === scryfallId);
}

// ─── Filter ───────────────────────────────────────────────────────────────
export function filterFavorites(
  favorites: readonly CardFavorite[],
  filter: FavoriteFilter,
  searchQuery = ""
): CardFavorite[] {
  let result = [...favorites];

  // Apply type filter
  if (filter === "creatures") {
    result = result.filter((f) => f.typeLine.includes("Creature"));
  } else if (filter === "lands") {
    result = result.filter((f) => f.typeLine.includes("Land"));
  } else if (filter === "spells") {
    result = result.filter(
      (f) => !f.typeLine.includes("Creature") && !f.typeLine.includes("Land")
    );
  }

  // Apply search query
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter((f) => f.name.toLowerCase().includes(q));
  }

  return result;
}

// ─── Sort ─────────────────────────────────────────────────────────────────
export function sortFavorites(
  favorites: readonly CardFavorite[],
  sortBy: FavoriteSort
): CardFavorite[] {
  const sorted = [...favorites];

  if (sortBy === "recently_added") {
    return sorted.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  }

  if (sortBy === "price") {
    return sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  }

  // cmc ascending
  return sorted.sort((a, b) => a.cmc - b.cmc);
}

// ─── Custom lists ─────────────────────────────────────────────────────────
export function createFavoriteList(name: string): FavoriteList {
  return {
    id: `list-${Date.now()}-${randomAlphanumericId(5)}`,
    name,
    cards: [],
    createdAt: new Date(),
  };
}

export function addToFavoriteList(
  list: FavoriteList,
  card: CardFavorite
): FavoriteList {
  if (list.cards.some((c) => c.scryfallId === card.scryfallId)) {
    return list;
  }
  return { ...list, cards: [...list.cards, card] };
}

export function removeFromFavoriteList(
  list: FavoriteList,
  scryfallId: string
): FavoriteList {
  return {
    ...list,
    cards: list.cards.filter((c) => c.scryfallId !== scryfallId),
  };
}
