import { NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

const FolderSchema = z.object({ name: z.string().trim().min(1).max(80) });

/** Lists private folders used for decks owned by the caller. */
export async function GET() {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;
    const folders = await prisma.deckFolder.findMany({
      where: { userId: authentication.session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { decks: true } } },
    });
    return NextResponse.json({ folders });
  } catch (error) {
    logger.error("Unexpected error", "GET /api/deck-folders", error);
    return NextResponse.json(
      { error: "Failed to load deck folders" },
      { status: 500 }
    );
  }
}

/** Creates one private folder for decks owned by the caller. */
export async function POST(request: Request) {
  try {
    const authentication = await requireAuth();
    if (authentication.error) return authentication.error;
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const parsed = FolderSchema.safeParse(jsonBody.value);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid folder name" },
        { status: 400 }
      );
    }
    const folder = await prisma.deckFolder.create({
      data: { userId: authentication.session.user.id, name: parsed.data.name },
      select: { id: true, name: true },
    });
    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    logger.error("Unexpected error", "POST /api/deck-folders", error);
    return NextResponse.json(
      { error: "Failed to create deck folder" },
      { status: 500 }
    );
  }
}
