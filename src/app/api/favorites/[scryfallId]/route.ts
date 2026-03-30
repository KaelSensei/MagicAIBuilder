/**
 * DELETE /api/favorites/[scryfallId] — remove a card from favorites
 */

import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ scryfallId: string }> }
) {
  const { scryfallId } = await params;

  if (!scryfallId) {
    return NextResponse.json({ error: "scryfallId required" }, { status: 400 });
  }

  // Persistence is intentionally deferred for the MVP favorites route.
  return NextResponse.json({ deleted: scryfallId }, { status: 200 });
}
