/**
 * The owner's saved versions of a deck: GET lists them, POST saves the deck
 * as a new one. The route checks the owner, parses the body and maps the
 * result of `deckSnapshots` (`lib/deck/snapshot-use-cases.ts`) to a status.
 */
import { NextResponse } from "next/server";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { readJsonBody, readRecord } from "@/lib/api/json-body";
import { deckSnapshots } from "@/lib/deck/snapshot-use-cases.server";
import type { SaveSnapshotResult } from "@/lib/deck/snapshot-use-cases";
import type { RouteParams } from "@/lib/api/route-kit";

function saveResponse(result: SaveSnapshotResult): NextResponse {
  switch (result.kind) {
    case "saved":
      return NextResponse.json(result.snapshot, { status: 201 });
    case "blank-name":
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    case "deck-not-found":
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
}

// GET /api/decks/[id]/snapshots — list snapshots for a deck
export async function GET(_req: Request, { params }: RouteParams<"id">) {
  const { id } = await params;
  try {
    const ownership = await requireDeckOwner(id);
    if (ownership.error) return ownership.error;

    return NextResponse.json(await deckSnapshots.listSnapshots(id));
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "GET /api/decks/:id/snapshots");
    return NextResponse.json({ error: "Failed to fetch snapshots" }, { status: 500 });
  }
}

// POST /api/decks/[id]/snapshots — create a snapshot
export async function POST(request: Request, { params }: RouteParams<"id">) {
  const { id } = await params;
  try {
    const ownership = await requireDeckOwner(id);
    if (ownership.error) return ownership.error;

    const jsonBody = await readJsonBody(request);

    if (!jsonBody.ok) return jsonBody.response;

    const rawName = readRecord(jsonBody.value).name;

    if (!rawName || typeof rawName !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    return saveResponse(await deckSnapshots.saveSnapshot({ deckId: id, rawName }));
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "POST /api/decks/:id/snapshots");
    return NextResponse.json({ error: "Failed to create snapshot" }, { status: 500 });
  }
}
