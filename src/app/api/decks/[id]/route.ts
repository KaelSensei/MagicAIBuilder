import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string }> };

// GET /api/decks/[id] — get a single deck
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const deck = await prisma.deck.findUnique({
      where: { id },
      include: { cards: true },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    return NextResponse.json(deck);
  } catch (error) {
    console.error("[GET /api/decks/:id]", { id: String(id).slice(0, 50) }, error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Failed to fetch deck" },
      { status: 500 }
    );
  }
}

type DeckPatchFields = {
  name?: string; format?: string; targetBracket?: number; budget?: number;
  commanderId?: string; partnerId?: string; companionId?: string;
  pairingType?: string; description?: string; tags?: string[];
};

function buildDeckPatchData(fields: DeckPatchFields, sanitizedName: string | undefined) {
  const data: Record<string, unknown> = {};
  if (sanitizedName !== undefined) data.name = sanitizedName;
  const simple = ["format", "targetBracket", "budget", "commanderId", "partnerId", "companionId", "pairingType", "description", "tags"] as const;
  for (const key of simple) {
    if (fields[key] !== undefined) data[key] = fields[key];
  }
  return data;
}

// PATCH /api/decks/[id] — update deck metadata
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json() as DeckPatchFields;
    const { name } = body;

    const existing = await prisma.deck.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const sanitizedName = name !== undefined
      ? name.replace(/<[^>]*>/g, "").trim().slice(0, 200)
      : undefined;

    if (name !== undefined && !sanitizedName) {
      return NextResponse.json(
        { error: "name must be a non-empty string" },
        { status: 400 }
      );
    }

    const updated = await prisma.deck.update({
      where: { id },
      data: buildDeckPatchData(body, sanitizedName),
      include: { cards: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/decks/:id]", { id: String(id).slice(0, 50) }, error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Failed to update deck" },
      { status: 500 }
    );
  }
}

// DELETE /api/decks/[id] — delete a deck and all its cards
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const existing = await prisma.deck.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    await prisma.deck.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/decks/:id]", { id: String(id).slice(0, 50) }, error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Failed to delete deck" },
      { status: 500 }
    );
  }
}
