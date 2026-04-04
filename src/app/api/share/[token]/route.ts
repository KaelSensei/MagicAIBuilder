import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

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

    // Strip shareToken before returning the public response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructuring to omit shareToken from response
    const { shareToken: _omitted, ...publicDeck } = deck;
    return NextResponse.json(publicDeck);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/share/:token",
      { token: String(token).slice(0, 20) }
    );
    return NextResponse.json(
      { error: "Failed to fetch shared deck" },
      { status: 500 }
    );
  }
}
