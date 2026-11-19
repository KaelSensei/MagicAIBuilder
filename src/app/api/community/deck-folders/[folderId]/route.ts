/**
 * One folder of the caller's saved-deck library:
 * `/api/community/deck-folders/[folderId]`.
 *
 * PATCH  — rename the folder
 * DELETE — delete the folder; its bookmarks stay in the library, unfiled
 *
 * HTTP only: session, input parsing and the status for each outcome. The
 * rules live in `@/lib/community/saved-deck-library-use-cases`. Another
 * user's folder answers 404, as a missing one does.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { LibraryFolderNameSchema } from "@/lib/community/library-folder-name";
import { savedDeckLibraryPorts } from "@/lib/community/saved-deck-library.server";
import {
  deleteLibraryFolder,
  renameLibraryFolder,
} from "@/lib/community/saved-deck-library-use-cases";
import { logger } from "@/lib/logger";

const FolderIdSchema = z.string().min(1).max(50);

interface RouteContext {
  readonly params: Promise<{ readonly folderId: string }>;
}

const folderNotFound = () =>
  NextResponse.json({ error: "Folder not found" }, { status: 404 });

const invalidFolderId = () =>
  NextResponse.json({ error: "Invalid folder id" }, { status: 400 });

/** Rename one of the caller's private saved-deck folders. */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;

    const { folderId } = await context.params;
    if (!FolderIdSchema.safeParse(folderId).success) return invalidFolderId();

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = LibraryFolderNameSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid folder name" },
        { status: 400 }
      );
    }

    const rename = {
      folderId,
      userId: authentication.session.user.id,
      name: parsed.data.name,
    };
    const result = await renameLibraryFolder(rename, savedDeckLibraryPorts);
    if (result.kind === "folder-not-found") return folderNotFound();
    return NextResponse.json({ id: result.id, name: result.name });
  } catch (error) {
    logger.error(
      "Unexpected error",
      "PATCH /api/community/deck-folders/:folderId",
      error
    );
    return NextResponse.json(
      { error: "Failed to rename folder" },
      { status: 500 }
    );
  }
}

/** Delete one owned folder while preserving its bookmarks as unfiled entries. */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;

    const { folderId } = await context.params;
    if (!FolderIdSchema.safeParse(folderId).success) return invalidFolderId();

    const folder = { folderId, userId: authentication.session.user.id };
    const result = await deleteLibraryFolder(folder, savedDeckLibraryPorts);
    if (result.kind === "folder-not-found") return folderNotFound();
    return NextResponse.json({ deleted: true });
  } catch (error) {
    logger.error(
      "Unexpected error",
      "DELETE /api/community/deck-folders/:folderId",
      error
    );
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    );
  }
}
