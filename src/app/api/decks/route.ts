import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/decks — list all decks
export async function GET() {
  try {
    const decks = await prisma.deck.findMany({
      include: { cards: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(decks);
  } catch (error) {
    console.error("[GET /api/decks]", error);
    return NextResponse.json(
      { error: "Failed to fetch decks" },
      { status: 500 }
    );
  }
}

// POST /api/decks — create a new deck
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, format, targetBracket, budget, commanderId, partnerId } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const sanitizedName = name.replace(/<[^>]*>/g, "").trim().slice(0, 200);
    if (!sanitizedName) {
      return NextResponse.json(
        { error: "name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const deck = await prisma.deck.create({
      data: {
        name: sanitizedName,
        format: format ?? "commander",
        targetBracket: targetBracket ?? 2,
        budget: budget ?? null,
        commanderId: commanderId ?? null,
        partnerId: partnerId ?? null,
      },
      include: { cards: true },
    });

    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    console.error("[POST /api/decks]", error);
    return NextResponse.json(
      { error: "Failed to create deck" },
      { status: 500 }
    );
  }
}
