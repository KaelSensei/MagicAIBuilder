import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// GET /api/deck/[id] — public deck view (no auth required for public decks)
// Returns deck if: isPublic=true OR requester is the owner
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  if (!id || id.length > 50) {
    return NextResponse.json({ error: "Invalid deck id" }, { status: 400 });
  }

  try {
    const session = await auth();
    const currentUserId = session?.user?.id ?? null;

    const deck = await prisma.deck.findUnique({
      where: { id },
      include: {
        cards: true,
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Allow access only if public OR owner
    const isOwner = currentUserId !== null && deck.userId === currentUserId;
    if (!deck.isPublic && !isOwner) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Strip shareToken before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit shareToken from public response
    const { shareToken: _omitted, ...publicDeck } = deck;
    return NextResponse.json({ ...publicDeck, isOwner });
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/deck/:id",
      { id: String(id).slice(0, 50) }
    );
    return NextResponse.json({ error: "Failed to fetch deck" }, { status: 500 });
  }
}
