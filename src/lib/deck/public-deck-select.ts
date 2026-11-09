import type { Prisma } from "@prisma/client";

/**
 * The columns of a deck that anyone may read once its owner makes it public.
 *
 * This is an allowlist on purpose. `GET /api/deck/[id]` is unauthenticated,
 * and it used to load the whole row and strip the one column it remembered to
 * strip — so the owner's folder, budget, tags, bracket override, sharing
 * setting and every card's private notes went to any visitor, and so would
 * every column added to `Deck` or `DeckCard` later. A field reaches a visitor
 * only when a public surface renders it and it is listed here.
 *
 * Read today by the public deck page (`/deck/[id]`: header, primer, fork
 * attribution, focused-feedback request, card list, metadata) and by the
 * community deck comparison (cards matched by Scryfall id, compared by mana
 * value, price, colour identity and role).
 */

/** The author byline on a public deck: never the email or any account field. */
export const PUBLIC_DECK_AUTHOR_SELECT = {
  id: true,
  name: true,
  username: true,
  image: true,
} as const satisfies Prisma.UserSelect;

/** Card columns a public surface renders; owner notes are deliberately absent. */
export const PUBLIC_DECK_CARD_SELECT = {
  id: true,
  scryfallId: true,
  name: true,
  cmc: true,
  colorIdentity: true,
  price: true,
  imageUri: true,
  artCropUri: true,
  category: true,
  quantity: true,
  isCommander: true,
  isPartner: true,
  isGameChanger: true,
} as const satisfies Prisma.DeckCardSelect;

/** Deck columns a public surface renders, with its author and every card row. */
export const PUBLIC_DECK_SELECT = {
  id: true,
  name: true,
  description: true,
  format: true,
  targetBracket: true,
  isAIGenerated: true,
  seekingFeedback: true,
  feedbackQuestion: true,
  forkedFromDeckId: true,
  forkedFromDeckName: true,
  forkedFromUserName: true,
  user: { select: PUBLIC_DECK_AUTHOR_SELECT },
  cards: { select: PUBLIC_DECK_CARD_SELECT },
} as const satisfies Prisma.DeckSelect;

/** A deck row read through {@link PUBLIC_DECK_SELECT}; it has no `Date`, so it is also its JSON. */
export type PublicDeckRecord = Prisma.DeckGetPayload<{
  select: typeof PUBLIC_DECK_SELECT;
}>;
