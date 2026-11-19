/**
 * DELETE removes one saved version of the owner's deck. The route checks the
 * owner and maps the result of `deckSnapshots.deleteSnapshot`
 * (`lib/deck/snapshot-use-cases.ts`) to a status.
 */
import { NextResponse } from "next/server";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { deckSnapshots } from "@/lib/deck/snapshot-use-cases.server";
import type { DeleteSnapshotResult } from "@/lib/deck/snapshot-use-cases";
import type { RouteParams } from "@/lib/api/route-kit";

function deleteResponse(result: DeleteSnapshotResult): NextResponse {
  switch (result.kind) {
    case "deleted":
      return NextResponse.json({ success: true });
    case "snapshot-not-found":
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
}

// DELETE /api/decks/[id]/snapshots/[snapshotId] — delete a snapshot
export async function DELETE(
  _req: Request,
  { params }: RouteParams<"id" | "snapshotId">
) {
  const { id, snapshotId } = await params;
  try {
    const ownership = await requireDeckOwner(id);
    if (ownership.error) return ownership.error;

    return deleteResponse(await deckSnapshots.deleteSnapshot({ deckId: id, snapshotId }));
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "DELETE /api/decks/:id/snapshots/:snapshotId");
    return NextResponse.json({ error: "Failed to delete snapshot" }, { status: 500 });
  }
}
