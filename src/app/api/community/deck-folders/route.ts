import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const FolderSchema = z.object({ name: z.string().trim().min(1).max(80) });

/** List the caller's private folders without leaking decks that are no longer public. */
export async function GET() {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;

    const userId = authentication.session.user.id;
    const [folders, unfiled] = await Promise.all([
      prisma.publicDeckFolder.findMany({
        where: { userId },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          savedDecks: {
            where: { deck: { isPublic: true } },
            orderBy: { createdAt: "desc" },
            select: {
              createdAt: true,
              deck: {
                select: {
                  id: true,
                  name: true,
                  commanderName: true,
                  user: { select: { username: true, name: true } },
                },
              },
            },
          },
        },
      }),
      prisma.savedPublicDeck.findMany({
        where: { userId, folderId: null, deck: { isPublic: true } },
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
          deck: {
            select: {
              id: true,
              name: true,
              commanderName: true,
              user: { select: { username: true, name: true } },
            },
          },
        },
      }),
    ]);
    return NextResponse.json({ folders, unfiled });
  } catch (error) {
    logger.error("Unexpected error", "GET /api/community/deck-folders", error);
    return NextResponse.json({ error: "Failed to load folders" }, { status: 500 });
  }
}

/** Create one private folder for organizing public-deck bookmarks. */
export async function POST(request: Request) {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = FolderSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid folder name" }, { status: 400 });
    }

    const folder = await prisma.publicDeckFolder.create({
      data: { userId: authentication.session.user.id, name: parsed.data.name },
      select: { id: true, name: true, createdAt: true },
    });
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    logger.error("Unexpected error", "POST /api/community/deck-folders", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
