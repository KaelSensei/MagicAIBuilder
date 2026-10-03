import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const FolderNameSchema = z.object({ name: z.string().trim().min(1).max(80) });
const FolderIdSchema = z.string().min(1).max(50);

interface RouteContext {
  readonly params: Promise<{ readonly folderId: string }>;
}

/** Rename one of the caller's private saved-deck folders. */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;

    const { folderId } = await context.params;
    if (!FolderIdSchema.safeParse(folderId).success) {
      return NextResponse.json({ error: "Invalid folder id" }, { status: 400 });
    }

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = FolderNameSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid folder name" }, { status: 400 });
    }

    const result = await prisma.publicDeckFolder.updateMany({
      where: { id: folderId, userId: authentication.session.user.id },
      data: { name: parsed.data.name },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ id: folderId, name: parsed.data.name });
  } catch (error) {
    logger.error("Unexpected error", "PATCH /api/community/deck-folders/:folderId", error);
    return NextResponse.json({ error: "Failed to rename folder" }, { status: 500 });
  }
}

/** Delete one owned folder while preserving its bookmarks as unfiled entries. */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;

    const { folderId } = await context.params;
    if (!FolderIdSchema.safeParse(folderId).success) {
      return NextResponse.json({ error: "Invalid folder id" }, { status: 400 });
    }

    const userId = authentication.session.user.id;
    const [, deleted] = await prisma.$transaction([
      prisma.savedPublicDeck.updateMany({
        where: { folderId, userId },
        data: { folderId: null },
      }),
      prisma.publicDeckFolder.deleteMany({ where: { id: folderId, userId } }),
    ]);
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    logger.error("Unexpected error", "DELETE /api/community/deck-folders/:folderId", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
