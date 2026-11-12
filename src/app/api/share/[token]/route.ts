import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { findSharedDeck } from "@/lib/deck/shared-deck-lookup";

type Params = { params: Promise<{ token: string }> };

/**
 * GET /api/share/[token] — read-only deck behind a share link, no auth required.
 *
 * The token opens the deck, public or private, while its owner keeps sharing
 * enabled; a malformed token 400s and an unknown or revoked token 404s. The
 * read is {@link findSharedDeck}, shared with the share page, so the link
 * holder receives what the page renders and nothing else: never the token,
 * the owner or owner-only columns.
 */
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;

  try {
    const lookup = await findSharedDeck(token);
    switch (lookup.status) {
      case "invalid-token":
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
      case "not-found":
        return NextResponse.json({ error: "Deck not found" }, { status: 404 });
      case "found":
        return NextResponse.json(lookup.deck);
      default: {
        const unhandled: never = lookup;
        return unhandled;
      }
    }
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/share/:token"
    );
    return NextResponse.json(
      { error: "Failed to fetch shared deck" },
      { status: 500 }
    );
  }
}
