/**
 * The caller's saved-deck library: `/api/community/deck-folders`.
 *
 * GET  — the folders with the public decks filed in each, and the unfiled ones
 * POST — create one private folder for organising public-deck bookmarks
 *
 * HTTP only: session, body parsing and the status for each outcome. The rules
 * live in `@/lib/community/saved-deck-library-use-cases`.
 */
import { NextResponse } from "next/server";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { LibraryFolderNameSchema } from "@/lib/community/library-folder-name";
import { savedDeckLibraryPorts } from "@/lib/community/saved-deck-library.server";
import {
  createLibraryFolder,
  readSavedDeckLibrary,
} from "@/lib/community/saved-deck-library-use-cases";
import { logger } from "@/lib/logger";

/** List the caller's private folders without leaking decks that are no longer public. */
export async function GET() {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;

    const userId = authentication.session.user.id;
    return NextResponse.json(
      await readSavedDeckLibrary(userId, savedDeckLibraryPorts)
    );
  } catch (error) {
    logger.error("Unexpected error", "GET /api/community/deck-folders", error);
    return NextResponse.json(
      { error: "Failed to load folders" },
      { status: 500 }
    );
  }
}

/** Create one private folder for organizing public-deck bookmarks. */
export async function POST(request: Request) {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = LibraryFolderNameSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid folder name" },
        { status: 400 }
      );
    }

    const draft = {
      userId: authentication.session.user.id,
      name: parsed.data.name,
    };
    const folder = await createLibraryFolder(draft, savedDeckLibraryPorts);
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    logger.error("Unexpected error", "POST /api/community/deck-folders", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}
