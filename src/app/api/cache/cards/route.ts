import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// GET /api/cache/cards?id=<scryfallId> — lookup cached card
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scryfallId = searchParams.get("id");

  if (!scryfallId) {
    return NextResponse.json(
      { error: "id query param is required" },
      { status: 400 }
    );
  }

  try {
    const cached = await prisma.cardCache.findUnique({
      where: { scryfallId },
    });

    if (!cached) {
      return NextResponse.json({ hit: false });
    }

    const age = Date.now() - new Date(cached.cachedAt).getTime();
    if (age > CACHE_TTL_MS) {
      // Stale — delete and report miss
      await prisma.cardCache.delete({ where: { scryfallId } });
      return NextResponse.json({ hit: false });
    }

    return NextResponse.json({ hit: true, data: cached.data });
  } catch (error) {
    console.error(`[GET /api/cache/cards?id=${scryfallId}]`, error);
    return NextResponse.json({ hit: false });
  }
}

// POST /api/cache/cards — store a card in the cache
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scryfallId, data } = body;

    if (!scryfallId || !data) {
      return NextResponse.json(
        { error: "scryfallId and data are required" },
        { status: 400 }
      );
    }

    const entry = await prisma.cardCache.upsert({
      where: { scryfallId },
      update: { data, cachedAt: new Date() },
      create: { scryfallId, data },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[POST /api/cache/cards]", error);
    return NextResponse.json(
      { error: "Failed to cache card" },
      { status: 500 }
    );
  }
}
