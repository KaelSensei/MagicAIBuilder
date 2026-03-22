import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string }> };

// GET /api/decks/[id]/snapshots — list snapshots for a deck
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const deck = await prisma.deck.findUnique({ where: { id } });
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const snapshots = await prisma.deckSnapshot.findMany({
      where: { deckId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        commander: true,
        cardCount: true,
        createdAt: true,
        // cardList omitted from list view for performance
      },
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    console.error("[GET /api/decks/:id/snapshots]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 });
  }
}

// POST /api/decks/[id]/snapshots — create a snapshot
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const rawName = body?.name;

    if (!rawName || typeof rawName !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const name = rawName.replaceAll(/<[^>]*>/g, "").trim().slice(0, 100);
    if (!name) {
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    }

    const deck = await prisma.deck.findUnique({
      where: { id },
      include: { cards: true },
    });
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Build card list snapshot
    const commanderCard = deck.cards.find((c) => c.isCommander);
    const partnerCard = deck.cards.find((c) => c.isPartner);

    const snapshot = await prisma.deckSnapshot.create({
      data: {
        deckId: id,
        name,
        cardList: deck.cards as unknown as object[],
        commander: commanderCard?.name ?? partnerCard?.name ?? deck.commanderId ?? null,
        cardCount: deck.cards.length,
      },
    });

    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    console.error("[POST /api/decks/:id/snapshots]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 });
  }
}
