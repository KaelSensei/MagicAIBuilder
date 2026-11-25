/**
 * The ownership check of a deck route that writes copies: the verdict of
 * `requireDeckOwner` (401, 404, 403), read in the same query as the facts the
 * copy limit needs, so a route can keep what it stores within the limit
 * (`lib/deck/copy-room-write.ts`) without a second read of the deck.
 *
 * @module api/copy-rule-deck-owner
 */
import "server-only";
import type { NextResponse } from "next/server";

import { ownedDeck, requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { isCommanderRow } from "@/lib/deck/bulk-edit-command-zone";
import { storedCopyLimitDeck } from "@/lib/deck/copy-limit-write";
import type { CopyRuleDeck } from "@/lib/deck/copy-room-write";

/**
 * The ownership check of `requireDeckOwner`, whose one Prisma query also reads
 * what the copy limit needs: the deck's format and every row, whose copies
 * the limit counts across zones (CR 100.2a, CR 903.5b) and whose commander
 * and partner grant their rulebreaker exceptions (CR 903.5e).
 *
 * The rows are read before the write's transaction. A write that names the
 * version it read is refused when another write lands in between, so the
 * count it was weighed against is the one it commits on.
 *
 * @param deckId - The deck the request names
 * @returns The deck's copy-limit facts when the signed-in user owns it; else
 *   the response to return: 401 without a session, 404 for no such deck, 403
 *   for another user's deck
 */
export async function requireCopyRuleDeckOwner(
  deckId: string
): Promise<
  | (CopyRuleDeck & { error?: never })
  | { copyRule?: never; rows?: never; error: NextResponse }
> {
  const auth = await requireAuth();
  if (auth.error) return { error: auth.error };
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: {
      userId: true,
      format: true,
      cards: {
        select: {
          id: true,
          name: true,
          typeLine: true,
          oracleText: true,
          zone: true,
          quantity: true,
          isCommander: true,
          isPartner: true,
          category: true,
        },
      },
    },
  });
  const owned = ownedDeck(deck, auth.session.user.id);
  if (owned.error) return { error: owned.error };
  const { cards } = owned.deck;
  return {
    copyRule: storedCopyLimitDeck({
      format: owned.deck.format,
      commandZoneNames: cards.filter(isCommanderRow).map((card) => card.name),
    }),
    rows: cards,
  };
}
