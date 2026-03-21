"use client";
// Zustand collection store — tracks cards owned in the physical collection
import { create } from "zustand";
import type { CollectionCard, AddToCollectionInput, CardCondition } from "./types";

export interface CollectionStore {
  // State
  collectionCards: Record<string, CollectionCard>; // keyed by scryfallId (non-foil)
  collectionCardsFoil: Record<string, CollectionCard>; // keyed by scryfallId (foil)
  isLoading: boolean;
  isSyncing: boolean;

  // Helpers
  getByScryfall: (scryfallId: string) => { normal: CollectionCard | null; foil: CollectionCard | null };
  getTotalOwned: (scryfallId: string) => number;

  // Actions
  loadCollection: () => Promise<void>;
  addToCollection: (input: AddToCollectionInput) => Promise<void>;
  removeFromCollection: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  updateCondition: (id: string, condition: CardCondition | null) => Promise<void>;
}

export const useCollectionStore = create<CollectionStore>()((set, get) => ({
  collectionCards: {},
  collectionCardsFoil: {},
  isLoading: false,
  isSyncing: false,

  getByScryfall: (scryfallId: string) => {
    const { collectionCards, collectionCardsFoil } = get();
    return {
      normal: collectionCards[scryfallId] ?? null,
      foil: collectionCardsFoil[scryfallId] ?? null,
    };
  },

  getTotalOwned: (scryfallId: string) => {
    const { collectionCards, collectionCardsFoil } = get();
    const normal = collectionCards[scryfallId]?.quantity ?? 0;
    const foil = collectionCardsFoil[scryfallId]?.quantity ?? 0;
    return normal + foil;
  },

  loadCollection: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/collection");
      if (!res.ok) throw new Error("Failed to load collection");
      const cards: CollectionCard[] = await res.json();

      const collectionCards: Record<string, CollectionCard> = {};
      const collectionCardsFoil: Record<string, CollectionCard> = {};

      for (const card of cards) {
        const hydrated: CollectionCard = {
          ...card,
          createdAt: new Date(card.createdAt),
          acquiredAt: card.acquiredAt ? new Date(card.acquiredAt) : null,
        };
        if (hydrated.foil) {
          collectionCardsFoil[hydrated.scryfallId] = hydrated;
        } else {
          collectionCards[hydrated.scryfallId] = hydrated;
        }
      }

      set({ collectionCards, collectionCardsFoil });
    } catch (err) {
      console.error("[loadCollection]", err);
    } finally {
      set({ isLoading: false });
    }
  },

  addToCollection: async (input: AddToCollectionInput) => {
    set({ isSyncing: true });
    try {
      const res = await fetch("/api/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scryfallId: input.scryfallId,
          name: input.name,
          quantity: input.quantity ?? 1,
          foil: input.foil ?? false,
          condition: input.condition ?? null,
          price: input.price ?? null,
          imageUri: input.imageUri ?? "",
        }),
      });
      if (!res.ok) throw new Error("Failed to add to collection");
      const card: CollectionCard = await res.json();
      const hydrated: CollectionCard = {
        ...card,
        createdAt: new Date(card.createdAt),
        acquiredAt: card.acquiredAt ? new Date(card.acquiredAt) : null,
      };

      set((state) => {
        if (hydrated.foil) {
          return { collectionCardsFoil: { ...state.collectionCardsFoil, [hydrated.scryfallId]: hydrated } };
        }
        return { collectionCards: { ...state.collectionCards, [hydrated.scryfallId]: hydrated } };
      });
    } catch (err) {
      console.error("[addToCollection]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  removeFromCollection: async (id: string) => {
    set({ isSyncing: true });
    try {
      const res = await fetch(`/api/collection/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove from collection");

      // Remove from both maps
      set((state) => {
        const collectionCards = { ...state.collectionCards };
        const collectionCardsFoil = { ...state.collectionCardsFoil };

        for (const [key, card] of Object.entries(collectionCards)) {
          if (card.id === id) delete collectionCards[key];
        }
        for (const [key, card] of Object.entries(collectionCardsFoil)) {
          if (card.id === id) delete collectionCardsFoil[key];
        }

        return { collectionCards, collectionCardsFoil };
      });
    } catch (err) {
      console.error("[removeFromCollection]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  updateQuantity: async (id: string, quantity: number) => {
    set({ isSyncing: true });
    try {
      const res = await fetch(`/api/collection/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error("Failed to update quantity");
      const data = await res.json();

      if (data.deleted) {
        // quantity was set to 0 — delete from store
        set((state) => {
          const collectionCards = { ...state.collectionCards };
          const collectionCardsFoil = { ...state.collectionCardsFoil };
          for (const [k, c] of Object.entries(collectionCards)) {
            if (c.id === id) delete collectionCards[k];
          }
          for (const [k, c] of Object.entries(collectionCardsFoil)) {
            if (c.id === id) delete collectionCardsFoil[k];
          }
          return { collectionCards, collectionCardsFoil };
        });
      } else {
        const updated: CollectionCard = {
          ...data,
          createdAt: new Date(data.createdAt),
          acquiredAt: data.acquiredAt ? new Date(data.acquiredAt) : null,
        };
        set((state) => {
          if (updated.foil) {
            return { collectionCardsFoil: { ...state.collectionCardsFoil, [updated.scryfallId]: updated } };
          }
          return { collectionCards: { ...state.collectionCards, [updated.scryfallId]: updated } };
        });
      }
    } catch (err) {
      console.error("[updateQuantity]", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  updateCondition: async (id: string, condition: CardCondition | null) => {
    set({ isSyncing: true });
    try {
      const res = await fetch(`/api/collection/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition }),
      });
      if (!res.ok) throw new Error("Failed to update condition");
      const updated: CollectionCard = await res.json();
      const hydrated: CollectionCard = {
        ...updated,
        createdAt: new Date(updated.createdAt),
        acquiredAt: updated.acquiredAt ? new Date(updated.acquiredAt) : null,
      };
      set((state) => {
        if (hydrated.foil) {
          return { collectionCardsFoil: { ...state.collectionCardsFoil, [hydrated.scryfallId]: hydrated } };
        }
        return { collectionCards: { ...state.collectionCards, [hydrated.scryfallId]: hydrated } };
      });
    } catch (err) {
      console.error("[updateCondition]", err);
    } finally {
      set({ isSyncing: false });
    }
  },
}));
