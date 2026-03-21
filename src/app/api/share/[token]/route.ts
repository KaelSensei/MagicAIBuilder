import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type Params = { params: Promise<{ token: string }> };

// GET /api/share/[token] — public read-only deck endpoint (no auth required)
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;

  // Basic token validation
  if (!token || token.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  try {
    const deck = await prisma.deck.findUnique({
      where: { shareToken: token },
      include: { cards: true },
    });

    if (!deck?.shareEnabled) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Return deck but strip share token from public response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { shareToken: _token, ...publicDeck } = deck;
    return NextResponse.json(publicDeck);
  } catch (error) {
    console.error(
      "[GET /api/share/:token]",
      { token: String(token).slice(0, 20) },
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json(
      { error: "Failed to fetch shared deck" },
      { status: 500 }
    );
  }
}
