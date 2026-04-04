import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ id: string; snapshotId: string }> };

// DELETE /api/decks/[id]/snapshots/[snapshotId] — delete a snapshot
export async function DELETE(_req: Request, { params }: Params) {
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

    await prisma.deckSnapshot.delete({ where: { id: snapshotId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "DELETE /api/decks/:id/snapshots/:snapshotId");
    return NextResponse.json({ error: "Failed to delete snapshot" }, { status: 500 });
  }
}
