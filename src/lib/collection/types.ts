/**
 * The shapes of the player's collection: owned rows and the add request.
 *
 * Collection context. `CARD_CONDITIONS` is the one list of card conditions:
 * the collection routes' Zod schemas, the OpenAPI document, the client parser
 * (`parse.ts`) and the add dialog all read it.
 *
 * @module collection/types
 */

/**
 * The card conditions a collection row may record, best first: Near Mint,
 * Lightly Played, Moderately Played, Heavily Played, Damaged.
 *
 * The order is the order the add dialog offers them in.
 */
export const CARD_CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const;

/** One of {@link CARD_CONDITIONS}. */
export type CardCondition = (typeof CARD_CONDITIONS)[number];

/**
 * One owned printing in one finish. A printing held in both finishes is two
 * rows, which is how the collection stores it.
 */
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

/** The body of `POST /api/collection`; an absent field takes the route's default. */
export interface AddToCollectionInput {
  scryfallId: string;
  name: string;
  quantity?: number;
  foil?: boolean;
  condition?: CardCondition | null;
  price?: number | null;
  imageUri?: string;
}
