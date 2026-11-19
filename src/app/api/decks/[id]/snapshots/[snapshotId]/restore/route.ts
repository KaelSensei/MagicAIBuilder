/**
 * POST puts the owner's deck back to one of its saved versions and answers
 * the deck with its restored cards. The route checks the owner and maps the
 * result of `deckSnapshots.restoreSnapshot` (`lib/deck/snapshot-use-cases.ts`)
 * to a status; an unreadable card list is a 500 and leaves the deck as it was.
 */
import { NextResponse } from "next/server";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { deckSnapshots } from "@/lib/deck/snapshot-use-cases.server";
import type { RestoreSnapshotResult } from "@/lib/deck/snapshot-use-cases";
import type { RouteParams } from "@/lib/api/route-kit";

function restoreResponse(result: RestoreSnapshotResult): NextResponse {
  switch (result.kind) {
    case "restored":
      return NextResponse.json(result.deck);
    case "snapshot-not-found":
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
}

// POST /api/decks/[id]/snapshots/[snapshotId]/restore — restore deck to snapshot state
export async function POST(
  _req: Request,
  { params }: RouteParams<"id" | "snapshotId">
) {
  const { id, snapshotId } = await params;
  try {
    const ownership = await requireDeckOwner(id);
    if (ownership.error) return ownership.error;

    return restoreResponse(await deckSnapshots.restoreSnapshot({ deckId: id, snapshotId }));
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "POST /api/decks/:id/snapshots/:snapshotId/restore");
    return NextResponse.json({ error: "Failed to restore snapshot" }, { status: 500 });
  }
}
