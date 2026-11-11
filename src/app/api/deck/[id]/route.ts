import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import { findDeckForViewer } from "@/lib/deck/deck-for-viewer";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/deck/[id] — public deck view, no auth required for a public deck.
 *
 * The owner gets their whole deck, public or private. Anyone else gets a
 * public deck read through the public allowlist, and a private deck 404s.
 * See {@link findDeckForViewer}.
 */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  if (!id || id.length > 50) {
    return NextResponse.json({ error: "Invalid deck id" }, { status: 400 });
  }

  try {
    const session = await auth();
    const deck = await findDeckForViewer(id, session?.user?.id ?? null);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }
    return NextResponse.json(deck);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/deck/:id",
      { id: String(id).slice(0, 50) }
    );
    return NextResponse.json({ error: "Failed to fetch deck" }, { status: 500 });
  }
}
