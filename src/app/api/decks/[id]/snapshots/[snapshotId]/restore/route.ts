import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string; snapshotId: string }> };

// POST /api/decks/[id]/snapshots/[snapshotId]/restore — restore deck to snapshot state
export async function POST(_req: Request, { params }: Params) {
  const { id, snapshotId } = await params;
  try {
    const snapshot = await prisma.deckSnapshot.findFirst({
      where: { id: snapshotId, deckId: id },
    });
    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }

    const deck = await prisma.deck.findUnique({ where: { id } });
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // cardList is the serialized array of DeckCard rows
    const cardList = snapshot.cardList as Array<Record<string, unknown>>;

    // Replace all deck cards in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete current cards
      await tx.deckCard.deleteMany({ where: { deckId: id } });

      // Re-create from snapshot (strip DB-generated id so Prisma assigns new ones)
      if (cardList.length > 0) {
        await tx.deckCard.createMany({
          data: cardList.map((c) => ({
            deckId: id,
            scryfallId: c.scryfallId as string,
            name: c.name as string,
            manaCost: (c.manaCost as string) ?? "",
            cmc: (c.cmc as number) ?? 0,
            typeLine: (c.typeLine as string) ?? "",
            oracleText: (c.oracleText as string) ?? "",
            colorIdentity: (c.colorIdentity as string[]) ?? [],
            isGameChanger: (c.isGameChanger as boolean) ?? false,
            isBanned: (c.isBanned as boolean) ?? false,
            price: (c.price as number | null) ?? null,
            imageUri: (c.imageUri as string) ?? "",
            artCropUri: (c.artCropUri as string) ?? "",
            category: (c.category as string) ?? "other",
            quantity: (c.quantity as number) ?? 1,
            isCommander: (c.isCommander as boolean) ?? false,
            isPartner: (c.isPartner as boolean) ?? false,
          })),
        });
      }
    });

    // Return updated deck with cards
    const updated = await prisma.deck.findUnique({
      where: { id },
      include: { cards: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[POST /api/decks/:id/snapshots/:snapshotId/restore]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Failed to restore snapshot" }, { status: 500 });
  }
}
