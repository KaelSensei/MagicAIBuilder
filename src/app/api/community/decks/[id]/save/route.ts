/**
 * Bookmarks of a public deck: `/api/community/decks/[id]/save`.
 *
 * POST   — save the deck into the caller's library, optionally in one of their folders
 * DELETE — remove only the caller's bookmark; the deck itself is untouched
 *
 * HTTP only: session, body parsing and the status for each outcome. The rules
 * live in the use cases of `@/lib/community/saved-deck-use-cases`.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { savedDeckUseCasePorts } from "@/lib/community/deck-action-server";
import {
  removeSavedDeck,
  savePublicDeck,
  type SavePublicDeckResult,
} from "@/lib/community/saved-deck-use-cases";
import { logger } from "@/lib/logger";

type Params = { readonly params: Promise<{ readonly id: string }> };

const SaveSchema = z.object({ folderId: z.string().min(1).nullable() });

/** The bookmark as the body, or the 404 a hidden deck or a foreign folder earns. */
function saveResponse(result: SavePublicDeckResult) {
  switch (result.kind) {
    case "saved":
      return NextResponse.json(
        { saved: true, folderId: result.folderId },
        { status: 201 }
      );
    case "deck-not-found":
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    case "folder-not-found":
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    default: {
      const unreachable: never = result;
      return unreachable;
    }
  }
}

// POST /api/community/decks/[id]/save
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;
    const userId = authentication.session.user.id;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = SaveSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    const command = { deckId: id, userId, folderId: parsed.data.folderId };
    return saveResponse(await savePublicDeck(command, savedDeckUseCasePorts));
  } catch (error) {
    logger.error(
      "Unexpected error",
      "POST /api/community/decks/:id/save",
      error
    );
    return NextResponse.json({ error: "Failed to save deck" }, { status: 500 });
  }
}

// DELETE /api/community/decks/[id]/save
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;

    await removeSavedDeck(
      { deckId: id, userId: authentication.session.user.id },
      savedDeckUseCasePorts
    );
    return NextResponse.json({ saved: false });
  } catch (error) {
    logger.error(
      "Unexpected error",
      "DELETE /api/community/decks/:id/save",
      error
    );
    return NextResponse.json(
      { error: "Failed to remove saved deck" },
      { status: 500 }
    );
  }
}
