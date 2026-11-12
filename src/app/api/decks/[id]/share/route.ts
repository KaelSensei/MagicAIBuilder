import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import type { RouteParams } from "@/lib/api/route-kit";
import { shareLinkCacheTag } from "@/lib/deck/share-link-cache";

/** Generate a URL-safe random token of ~12 chars (base64url, trimmed) */
function generateToken(): string {
  return randomBytes(9).toString("base64url"); // 9 bytes -> 12 base64url chars
}

/**
 * POST /api/decks/[id]/share — switches sharing on and answers the link.
 *
 * Idempotent: a deck that already has a token keeps it, so the popover can
 * recover the live link without breaking the copies already handed out.
 * Owner only (401 signed out, 403 another account's deck, 404 unknown deck).
 */
export async function POST(_req: Request, { params }: RouteParams<"id">) {
  const { id } = await params;
  try {
    const ownership = await requireDeckOwner(id);
    if (ownership.error) return ownership.error;

    const existing = await prisma.deck.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Reuse existing token if already set; otherwise generate a new one
    const token = existing.shareToken ?? generateToken();

    const deck = await prisma.deck.update({
      where: { id },
      data: { shareToken: token, shareEnabled: true },
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/share/${deck.shareToken}`;
    return NextResponse.json({ shareUrl, shareToken: deck.shareToken });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "POST /api/decks/:id/share",
      { id: String(id).slice(0, 50) }
    );
    return NextResponse.json(
      { error: "Failed to enable sharing" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/decks/[id]/share — revokes the link.
 *
 * Clears the token as well as the flag, so switching sharing on again mints a
 * new link, and purges the share page cached under the old token so the link
 * stops working at once (OD-12). Idempotent: revoking twice is a 200 that
 * changes nothing. Owner only, as for POST.
 */
export async function DELETE(_req: Request, { params }: RouteParams<"id">) {
  const { id } = await params;
  try {
    const ownership = await requireDeckOwner(id);
    if (ownership.error) return ownership.error;

    // Read before the write: the update returns the cleared row.
    const previous = await prisma.deck.findUnique({
      where: { id },
      select: { shareToken: true },
    });

    await prisma.deck.update({
      where: { id },
      data: { shareToken: null, shareEnabled: false },
    });

    if (previous?.shareToken)
      revalidateTag(shareLinkCacheTag(previous.shareToken));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "DELETE /api/decks/:id/share",
      { id: String(id).slice(0, 50) }
    );
    return NextResponse.json(
      { error: "Failed to disable sharing" },
      { status: 500 }
    );
  }
}
