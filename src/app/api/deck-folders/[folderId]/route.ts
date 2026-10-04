import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const RenameSchema = z.object({ name: z.string().trim().min(1).max(80) });
interface RouteContext {
  readonly params: Promise<{ readonly folderId: string }>;
}

/** Renames a folder owned by the authenticated user. */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;
    const { folderId } = await context.params;
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = RenameSchema.safeParse(jsonBody.value);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid folder name" },
        { status: 400 }
      );

    const renamed = await prisma.deckFolder.updateMany({
      where: { id: folderId, userId: authentication.session.user.id },
      data: { name: parsed.data.name },
    });
    if (renamed.count === 0)
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    return NextResponse.json({ id: folderId, name: parsed.data.name });
  } catch (error) {
    logger.error(
      "Unexpected error",
      "PATCH /api/deck-folders/:folderId",
      error
    );
    return NextResponse.json(
      { error: "Failed to rename deck folder" },
      { status: 500 }
    );
  }
}

/** Deletes an owned folder after safely returning its decks to the unfiled library. */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;
    const userId = authentication.session.user.id;
    const { folderId } = await context.params;
    const deleted = await prisma.$transaction(async (transaction) => {
      const folder = await transaction.deckFolder.findFirst({
        where: { id: folderId, userId },
        select: { id: true },
      });
      if (!folder) return false;
      await transaction.deck.updateMany({
        where: { folderId, userId },
        data: { folderId: null },
      });
      await transaction.deckFolder.delete({ where: { id: folderId } });
      return true;
    });
    if (!deleted)
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error(
      "Unexpected error",
      "DELETE /api/deck-folders/:folderId",
      error
    );
    return NextResponse.json(
      { error: "Failed to delete deck folder" },
      { status: 500 }
    );
  }
}
