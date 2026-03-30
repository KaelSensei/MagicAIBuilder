/**
 * Favorites API Routes
 * GET /api/favorites — list user's favorites
 * POST /api/favorites — add a card to favorites
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const AddFavoriteSchema = z.object({
  scryfallId: z.string().min(1),
  name: z.string().min(1),
  typeLine: z.string(),
  cmc: z.number().min(0).default(0),
  price: z.number().nullable().optional(),
  imageUri: z.string().default(""),
});

export async function GET() {
  // TODO: get userId from session + fetch from DB
  // For MVP: return empty array (DB integration after migration)
  return NextResponse.json([], { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = AddFavoriteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // TODO: get userId from session + save to DB
    return NextResponse.json({ ...validation.data, addedAt: new Date() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}
