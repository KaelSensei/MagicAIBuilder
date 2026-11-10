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
 * attribution, focused-feedback request, card list, metadata), by the
 * community deck comparison (cards matched by Scryfall id, compared by mana
 * value, price, colour identity and role), and, widened by
 * {@link FORK_SOURCE_SELECT}, by a fork.
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

/**
 * Card columns a fork copies: the public ones, plus what the copy needs to
 * work as a deck of its own — the Scryfall card text the builder reads and the
 * zone that keeps a maybeboard card out of the main deck. Neither belongs to
 * the owner. The owner's notes stay out.
 */
export const FORK_SOURCE_CARD_SELECT = {
  ...PUBLIC_DECK_CARD_SELECT,
  manaCost: true,
  typeLine: true,
  oracleText: true,
  power: true,
  toughness: true,
  isBanned: true,
  zone: true,
} as const satisfies Prisma.DeckCardSelect;

/**
 * Deck columns `POST /api/decks/[id]/fork` reads from a public source: the
 * public ones, plus the command-zone slots that keep the copy's commander,
 * partner and companion. The owner's budget, bracket override, tags, folder
 * and sharing settings are not read, so a fork can neither copy nor return
 * them.
 */
export const FORK_SOURCE_SELECT = {
  ...PUBLIC_DECK_SELECT,
  commanderId: true,
  commanderName: true,
  partnerId: true,
  companionId: true,
  pairingType: true,
  cards: { select: FORK_SOURCE_CARD_SELECT },
} as const satisfies Prisma.DeckSelect;
