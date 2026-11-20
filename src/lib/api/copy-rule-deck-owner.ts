/**
 * The ownership check of a deck route that writes copies: the verdict of
 * `requireDeckOwner` (401, 404, 403), read in the same query as the facts the
 * copy limit needs, so a route can clamp what it stores
 * (`lib/deck/copy-limit-write.ts`) without a second read of the deck.
 *
 * @module api/copy-rule-deck-owner
 */
import "server-only";
import type { NextResponse } from "next/server";

import { ownedDeck, requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { COMMAND_SLOT_ROWS } from "@/lib/deck/bulk-edit-command-zone";
import { storedCopyLimitDeck } from "@/lib/deck/copy-limit-write";
import type { CopyLimitDeck } from "@/lib/deck/multiples";

/**
 * The ownership check of `requireDeckOwner`, whose one Prisma query also reads
 * what the copy limit needs: the deck's format and the names of the rows that
 * fill the commander and partner slots (CR 903.5e: their rulebreaker
 * exceptions).
 *
 * @param deckId - The deck the request names
 * @returns The deck's copy-limit facts when the signed-in user owns it; else
 *   the response to return: 401 without a session, 404 for no such deck, 403
 *   for another user's deck
 */
export async function requireCopyRuleDeckOwner(
  deckId: string
): Promise<
  | { copyRule: CopyLimitDeck; error?: never }
  | { copyRule?: never; error: NextResponse }
> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: {
      userId: true,
      format: true,
      cards: {
        where: {
          OR: [
            { ...COMMAND_SLOT_ROWS.commander },
            { ...COMMAND_SLOT_ROWS.partner },
          ],
        },
        select: { name: true },
      },
    },
  });
  const owned = ownedDeck(deck, auth.session.user.id);
  if (owned.error) return { error: owned.error };
  return {
    copyRule: storedCopyLimitDeck({
      format: owned.deck.format,
      commandZoneNames: owned.deck.cards.map((card) => card.name),
    }),
  };
}
