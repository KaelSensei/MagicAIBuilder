import { NextResponse } from "next/server";

const SPELLBOOK_BASE = "https://backend.commanderspellbook.com/variants";
const ALLOWED_PARAMS = new Set(["cards", "format"]);

// GET /api/combos?cards=<name>&format=json
// Proxies Commander Spellbook to avoid CORS issues and keep the external API server-side.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const forwardParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (ALLOWED_PARAMS.has(key)) {
      forwardParams.set(key, value.slice(0, 500));
    }
  }

  const cardsParam = forwardParams.get("cards");
  if (!cardsParam) {
    return NextResponse.json({ count: 0, results: [] });
  }

  try {
    const url = `${SPELLBOOK_BASE}/?${forwardParams.toString()}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json({ count: 0, results: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ count: 0, results: [] });
  }
}
