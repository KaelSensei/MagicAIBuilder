import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

/** Generate a URL-safe random token of ~12 chars (base64url, trimmed) */
function generateToken(): string {
  return randomBytes(9).toString("base64url"); // 9 bytes → 12 base64url chars
}

type Params = { params: Promise<{ id: string }> };

// POST /api/decks/[id]/share — enable sharing, generate token
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
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
    console.error(
      "[POST /api/decks/:id/share]",
      { id: String(id).slice(0, 50) },
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json(
      { error: "Failed to enable sharing" },
      { status: 500 }
    );
  }
}

// DELETE /api/decks/[id]/share — disable sharing
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const existing = await prisma.deck.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    await prisma.deck.update({
      where: { id },
      data: { shareToken: null, shareEnabled: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "[DELETE /api/decks/:id/share]",
      { id: String(id).slice(0, 50) },
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json(
      { error: "Failed to disable sharing" },
      { status: 500 }
    );
  }
}
