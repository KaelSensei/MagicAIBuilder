import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { restoredDeckCards } from "@/lib/deck/snapshot-restore";

type Params = { params: Promise<{ id: string; snapshotId: string }> };

// POST /api/decks/[id]/snapshots/[snapshotId]/restore — restore deck to snapshot state
export async function POST(_req: Request, { params }: Params) {
  const { id, snapshotId } = await params;
  try {
    const ownership = await requireDeckOwner(id);
    if (ownership.error) return ownership.error;

    const snapshot = await prisma.deckSnapshot.findFirst({
      where: { id: snapshotId, deckId: id },
    });
    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    // Validate before deleting. A malformed list must not wipe the live deck.
    const cards = restoredDeckCards(id, snapshot.cardList);

    await prisma.$transaction(async (tx) => {
      await tx.deckCard.deleteMany({ where: { deckId: id } });

      if (cards.length > 0) {
        await tx.deckCard.createMany({ data: [...cards] });
      }
    });

    // Return updated deck with cards
    const updated = await prisma.deck.findUnique({
      where: { id },
      include: { cards: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "POST /api/decks/:id/snapshots/:snapshotId/restore");
    return NextResponse.json({ error: "Failed to restore snapshot" }, { status: 500 });
  }
}
