import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface SuggestRequest {
  commanderName: string | null;
  partnerName: string | null;
  colorIdentity: string[];
  cardNames: string[];
  categories: Record<string, number>; // category -> count
  avgCmc: number;
  bracket: number;
  targetBracket: number;
  budget: number | null;
  gameChangersCount: number;
}

interface CardSuggestion {
  name: string;
  reason: string;
  category: string;
  priority: "high" | "medium" | "low";
}

interface SuggestResponse {
  suggestions: CardSuggestion[];
  analysis: string;
  provider: "anthropic" | "openai" | "mock";
}

function buildPrompt(req: SuggestRequest): string {
  const commander = req.commanderName
    ? req.partnerName
      ? `${req.commanderName} + ${req.partnerName}`
      : req.commanderName
    : "No commander set";

  const colors = req.colorIdentity.length > 0
    ? req.colorIdentity.join("")
    : "Colorless";

  const categoryBreakdown = Object.entries(req.categories)
    .filter(([, count]) => count > 0)
    .map(([cat, count]) => `  ${cat}: ${count}`)
    .join("\n");

  const cardList = req.cardNames.slice(0, 60).join(", ");

  return `You are a Magic: The Gathering Commander expert. Analyze this deck and suggest improvements.

DECK INFO:
- Commander: ${commander}
- Color Identity: ${colors}
- Total cards: ${req.cardNames.length + (req.commanderName ? 1 : 0) + (req.partnerName ? 1 : 0)}
- Average CMC: ${req.avgCmc.toFixed(2)}
- Current Bracket: ${req.bracket}
- Target Bracket: ${req.targetBracket}
- Budget: ${req.budget ? `$${req.budget} per card` : "No limit"}
- Game Changers: ${req.gameChangersCount}

CATEGORY BREAKDOWN:
${categoryBreakdown || "  (empty deck)"}

CURRENT CARDS (up to 60):
${cardList || "(none)"}

TASK:
Suggest exactly 8 cards to add to this deck. For each card:
1. Choose cards that synergize with the commander and color identity
2. Target the bracket level (${req.targetBracket}) — avoid Game Changers if targeting bracket 1-2
3. Consider the category gaps (if low on ramp or draw, prioritize those)
4. Respect the budget if set

Respond in this EXACT JSON format (no markdown, no explanation outside the JSON):
{
  "analysis": "2-3 sentence analysis of the deck's current state and main gaps",
  "suggestions": [
    {
      "name": "Exact Card Name",
      "reason": "One sentence explaining why this card fits",
      "category": "ramp|draw|removal|boardWipe|creature|land|protection|winCondition|other",
      "priority": "high|medium|low"
    }
  ]
}`;
}

async function callAnthropic(prompt: string): Promise<SuggestResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "{}";
  const parsed = JSON.parse(text);
  return { ...parsed, provider: "anthropic" };
}

async function callOpenAI(prompt: string): Promise<SuggestResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(text);
  return { ...parsed, provider: "openai" };
}

function mockSuggestions(req: SuggestRequest): SuggestResponse {
  // Fallback when no API key is configured — generic suggestions
  const suggestions: CardSuggestion[] = (
    [
      { name: "Sol Ring", reason: "Staple ramp in any Commander deck", category: "ramp", priority: "high" as const },
      { name: "Arcane Signet", reason: "Efficient mana rock for your color identity", category: "ramp", priority: "high" as const },
      { name: "Command Tower", reason: "Dual land for all your colors", category: "land", priority: "high" as const },
      { name: "Rhystic Study", reason: "Powerful card draw engine", category: "draw", priority: "medium" as const },
      { name: "Swords to Plowshares", reason: "Efficient single-target removal", category: "removal", priority: "medium" as const },
      { name: "Cyclonic Rift", reason: "One-sided board reset", category: "boardWipe", priority: "medium" as const },
      { name: "Swiftfoot Boots", reason: "Protects your commander from removal", category: "protection", priority: "low" as const },
      { name: "Cultivate", reason: "Ramp + land smoothing", category: "ramp", priority: "low" as const },
    ] as CardSuggestion[]
  ).filter((s) => !req.cardNames.includes(s.name)).slice(0, 8);

  return {
    suggestions,
    analysis: `Configure ANTHROPIC_API_KEY or OPENAI_API_KEY in your environment to get personalized AI suggestions for ${req.commanderName ?? "your deck"}.`,
    provider: "mock",
  };
}

export async function POST(request: Request) {
  try {
    const body: SuggestRequest = await request.json();

    if (!body.colorIdentity || !Array.isArray(body.cardNames)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const prompt = buildPrompt(body);
    let result: SuggestResponse;

    if (process.env.ANTHROPIC_API_KEY) {
      result = await callAnthropic(prompt);
      result.provider = "anthropic";
    } else if (process.env.OPENAI_API_KEY) {
      result = await callOpenAI(prompt);
      result.provider = "openai";
    } else {
      result = mockSuggestions(body);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/ai/suggest]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "AI suggestion failed" }, { status: 500 });
  }
}
