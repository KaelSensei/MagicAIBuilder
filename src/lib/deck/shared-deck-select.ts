import type { Prisma } from "@prisma/client";

/**
 * The columns of a deck that the holder of its share link may read.
 *
 * A share token is a capability: `GET /api/share/[token]` opens the deck
 * behind it, public or private, while sharing stays enabled. The route used to
 * load the whole row and strip only `shareToken`, so a link holder also got
 * the owner's id, folder, tags, bracket override and every card's private
 * notes — and would have got any column added to `Deck` or `DeckCard` later.
 * A field reaches a link holder only when the share page renders it and it is
 * listed here.
 *
 * Read today by `/share/[token]`: the page metadata (title, description,
 * OpenGraph image) and `ShareDeckView` (header, command zone, card list, card
 * strip, stats panel, mana curve, colour distribution, fork button).
 *
 * Compared with `PUBLIC_DECK_SELECT` (the public deck page), this list:
 * - adds deck `budget`: the stats panel shows the budget row when it is set;
 * - adds card `manaCost`: each card row draws its mana symbols;
 * - leaves out `user`, `description`, `isAIGenerated`, `seekingFeedback`,
 *   `feedbackQuestion`, the `forkedFrom*` attribution and card `scryfallId`
 *   and `price`, because the share page renders none of them. For a private
 *   deck that also keeps the owner's identity off the link.
 */

/** Card columns the share page renders; owner notes and `zone` are deliberately absent. */
const SHARED_DECK_CARD_SELECT = {
  id: true,
  name: true,
  manaCost: true,
  cmc: true,
  colorIdentity: true,
  imageUri: true,
  artCropUri: true,
  category: true,
  quantity: true,
  isCommander: true,
  isPartner: true,
  isGameChanger: true,
} as const satisfies Prisma.DeckCardSelect;

/** Deck columns the share page renders, with every card row; `id` feeds the fork button. */
export const SHARED_DECK_SELECT = {
  id: true,
  name: true,
  format: true,
  targetBracket: true,
  budget: true,
  cards: { select: SHARED_DECK_CARD_SELECT },
} as const satisfies Prisma.DeckSelect;

/** A deck row read through {@link SHARED_DECK_SELECT}; it has no `Date`, so it is also its JSON. */
export type SharedDeckRecord = Prisma.DeckGetPayload<{
  select: typeof SHARED_DECK_SELECT;
}>;
