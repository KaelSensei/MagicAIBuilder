import { NextResponse } from "next/server";
import { z } from "zod";
import { importFromUrl } from "@/lib/import/url-import";

const bodySchema = z.object({
  url: z.string().url().max(500),
});

// POST /api/import/url — proxy import from Moxfield or Archidekt
// No auth required: importing is a public feature
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  try {
    const result = await importFromUrl(parsed.data.url);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed.";
    // Surface user-facing errors as 422, unexpected ones as 500
    const isUserError =
      message.includes("not found") ||
      message.includes("private") ||
      message.includes("not recognised") ||
      message.includes("HTTP 4");

    return NextResponse.json(
      { error: message },
      { status: isUserError ? 422 : 500 }
    );
  }
}
