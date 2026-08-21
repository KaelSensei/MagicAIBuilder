/**
 * Favorites API Routes
 * GET /api/favorites — list user's favorites
 * POST /api/favorites — add a card to favorites
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readJsonBody } from "@/lib/api/json-body";

const AddFavoriteSchema = z.object({
  scryfallId: z.string().min(1),
  name: z.string().min(1),
  typeLine: z.string(),
  cmc: z.number().min(0).default(0),
  price: z.number().nullable().optional(),
  imageUri: z.string().default(""),
});

export async function GET() {
  // Persistence is intentionally deferred for the MVP favorites route.
  return NextResponse.json([], { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.value;
    const validation = AddFavoriteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: z.flattenError(validation.error).fieldErrors },
        { status: 400 }
      );
    }

    // Persistence is intentionally deferred for the MVP favorites route.
    return NextResponse.json({ ...validation.data, addedAt: new Date() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}
