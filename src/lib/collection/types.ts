// Types for the Collection feature

export type CardCondition = "NM" | "LP" | "MP" | "HP" | "DMG";

export interface CollectionCard {
  id: string;
  scryfallId: string;
  name: string;
  quantity: number;
  foil: boolean;
  condition: CardCondition | null;
  acquiredAt: Date | null;
  price: number | null;
  imageUri: string;
  createdAt: Date;
}

export interface AddToCollectionInput {
  scryfallId: string;
  name: string;
  quantity?: number;
  foil?: boolean;
  condition?: CardCondition | null;
  price?: number | null;
  imageUri?: string;
}
