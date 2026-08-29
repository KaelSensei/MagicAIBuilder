import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchMoxfieldUserDecks } from "@/lib/import/moxfield-user";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  username: z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/, "Invalid Moxfield username"),
});

/** POST /api/import/moxfield-user — list public decks for a Moxfield username. */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid Moxfield username" }, { status: 400 });
  }

  try {
    return NextResponse.json(await fetchMoxfieldUserDecks(parsed.data.username));
  } catch (cause) {
    logger.error(cause instanceof Error ? cause.message : "Moxfield profile import failed", "POST /api/import/moxfield-user");
    return NextResponse.json({ error: "Could not load Moxfield decks." }, { status: 502 });
  }
}
