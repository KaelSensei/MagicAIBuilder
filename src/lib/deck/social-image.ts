import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Data for the deck image at `/og/deck/{id}`.
 *
 * That route answers anyone, signed out, so everything it prints comes from
 * here: one query that refuses private decks and reads only the columns the
 * image shows. It replaces `/api/og`, which printed whatever text the caller
 * put in the query string under the product's name.
 *
 * The select is local on purpose. The public deck API's projection serves a
 * page that shows far more than an image does; reusing it would let a field
 * added there for the page reach the image too.
 */

/** Mana colours in the order cards print them. */
const MANA_COLORS = ["W", "U", "B", "R", "G"] as const;

/** One of the five colours of Magic. */
export type ManaColor = (typeof MANA_COLORS)[number];

/** Deck ids are cuids; the public deck API rejects anything longer the same way. */
const MAX_DECK_ID_LENGTH = 50;

/**
 * Every column the deck image reads. Exported so a test can pin it.
 *
 * Card `name` is read for every main-deck row because the commanders are among
 * them; only the commanders' names are printed.
 */
export const DECK_IMAGE_SELECT = {
  name: true,
  user: { select: { name: true, username: true } },
  cards: {
    where: { zone: "main" },
    select: {
      name: true,
      quantity: true,
      colorIdentity: true,
      isCommander: true,
      isPartner: true,
    },
  },
} as const satisfies Prisma.DeckSelect;

type DeckImageRow = Prisma.DeckGetPayload<{ select: typeof DECK_IMAGE_SELECT }>;
type DeckImageCardRow = DeckImageRow["cards"][number];

/** What the deck image prints, all of it stored data of a public deck. */
export interface DeckImage {
  readonly name: string;
  /** Commander first, then its partner. Empty for a deck without one. */
  readonly commanders: readonly string[];
  /** In WUBRG order. Empty for a colourless deck. */
  readonly colorIdentity: readonly ManaColor[];
  /** Copies in the main deck, commanders included. */
  readonly cardCount: number;
  /** The author's display name, or null when the deck has no author. */
  readonly author: string | null;
}

/**
 * Loads what the deck image shows, for a public deck only.
 *
 * @param deckId - deck id from the image URL
 * @returns the image data, or null for a private, missing or malformed id
 */
export async function loadPublicDeckImage(
  deckId: string
): Promise<DeckImage | null> {
  if (deckId.length === 0 || deckId.length > MAX_DECK_ID_LENGTH) return null;

  const row = await prisma.deck.findFirst({
    where: { id: deckId, isPublic: true },
    select: DECK_IMAGE_SELECT,
  });

  return row === null ? null : toDeckImage(row);
}

/**
 * Reduces a stored deck to the image's fields.
 *
 * @param row - the deck as `DECK_IMAGE_SELECT` reads it
 * @returns the image data
 */
function toDeckImage(row: DeckImageRow): DeckImage {
  const commanderCards = row.cards
    .filter((card) => card.isCommander || card.isPartner)
    .sort((a, b) => Number(a.isPartner) - Number(b.isPartner));
  const identitySource = commanderCards.length > 0 ? commanderCards : row.cards;

  return {
    name: row.name,
    commanders: [...new Set(commanderCards.map((card) => card.name))],
    colorIdentity: colorIdentityOf(identitySource),
    cardCount: row.cards.reduce((sum, card) => sum + card.quantity, 0),
    author: displayNameOf(row.user),
  };
}

/**
 * The union of the cards' colour identities, in WUBRG order.
 *
 * @param cards - the commanders, or every main-deck card when there is none
 * @returns known mana colours only; anything else in the column is dropped
 */
function colorIdentityOf(
  cards: readonly DeckImageCardRow[]
): readonly ManaColor[] {
  const present = new Set(cards.flatMap((card) => card.colorIdentity));
  return MANA_COLORS.filter((color) => present.has(color));
}

/**
 * The name the deck page shows for its author.
 *
 * @param user - the deck's author, if any
 * @returns the display name, then the username, then null
 */
function displayNameOf(user: DeckImageRow["user"]): string | null {
  const name = user?.name?.trim();
  if (name) return name;
  return user?.username ?? null;
}
