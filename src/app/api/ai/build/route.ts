import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------
export interface BuildRequest {
  budget: number | null; // null = no limit
  colors: string[]; // ["W", "U", "B", "R", "G"]
  strategy: string; // "Aggro" | "Control" | etc.
  commanderName: string | null; // null = let AI pick
}

export type BuildEvent =
  | { type: "status"; message: string }
  | { type: "commander"; name: string }
  | { type: "card"; name: string; category: string }
  | { type: "done"; totalCards: number }
  | { type: "error"; message: string };

interface AICard {
  name: string;
  quantity: number;
  category: string;
}

interface AIDeckResponse {
  commander: string;
  partner: string | null;
  cards: AICard[];
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------
function buildPrompt(req: BuildRequest): string {
  const colorStr = req.colors.length > 0 ? req.colors.join(", ") : "Colorless";
  const budgetStr = req.budget ? `$${req.budget} max per card` : "No limit";
  const commanderStr = req.commanderName ?? "Choose the best commander for these colors and strategy";

  return `You are a Magic: The Gathering Commander deck builder expert.

Build a complete Commander deck with these constraints:
- Colors: ${colorStr}
- Strategy/Archetype: ${req.strategy}
- Budget: ${budgetStr}
- Commander: ${commanderStr}

Return a complete 100-card Commander decklist in JSON:
{
  "commander": "Commander Name",
  "partner": null,
  "cards": [
    { "name": "Card Name", "quantity": 1, "category": "ramp|draw|removal|land|creature|other" }
  ]
}

Rules:
- Exactly 1 commander (or 2 with partner — add partner in "partner" field and include 98 cards)
- Exactly 99 other cards (98 with partner)
- All cards must be legal in Commander format
- All non-commander cards must fit the commander's color identity
- Include approximately 38 lands (with a mix of basics and non-basics)
- Respect budget constraint (max price per card)
- Optimize for the ${req.strategy} archetype
- No banned cards (no Jeweled Lotus in budget builds, no Thassa's Oracle unless Combo, etc.)
- Return ONLY valid JSON, no markdown, no explanation`;
}

// ---------------------------------------------------------------------------
// AI call: Anthropic
// ---------------------------------------------------------------------------
async function callAnthropic(prompt: string): Promise<AIDeckResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? "{}";
  // Strip markdown fences if the model wrapped output anyway
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  return JSON.parse(cleaned) as AIDeckResponse;
}

// ---------------------------------------------------------------------------
// AI call: OpenAI
// ---------------------------------------------------------------------------
async function callOpenAI(prompt: string): Promise<AIDeckResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
  const data = await response.json();
  const text: string = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(text) as AIDeckResponse;
}

// ---------------------------------------------------------------------------
// Mock deck for development (no API key)
// ---------------------------------------------------------------------------
function mockDeck(req: BuildRequest): AIDeckResponse {
  const commander = req.commanderName ?? "Atraxa, Praetors' Voice";

  const lands: AICard[] = [
    { name: "Command Tower", quantity: 1, category: "land" },
    { name: "Arcane Sanctum", quantity: 1, category: "land" },
    { name: "Exotic Orchard", quantity: 1, category: "land" },
    { name: "Evolving Wilds", quantity: 1, category: "land" },
    { name: "Terramorphic Expanse", quantity: 1, category: "land" },
    { name: "Plains", quantity: 6, category: "land" },
    { name: "Island", quantity: 6, category: "land" },
    { name: "Swamp", quantity: 6, category: "land" },
    { name: "Forest", quantity: 6, category: "land" },
    { name: "Mountain", quantity: 4, category: "land" },
    { name: "Reliquary Tower", quantity: 1, category: "land" },
    { name: "Temple of Mystery", quantity: 1, category: "land" },
  ];

  const ramp: AICard[] = [
    { name: "Sol Ring", quantity: 1, category: "ramp" },
    { name: "Arcane Signet", quantity: 1, category: "ramp" },
    { name: "Commander's Sphere", quantity: 1, category: "ramp" },
    { name: "Cultivate", quantity: 1, category: "ramp" },
    { name: "Kodama's Reach", quantity: 1, category: "ramp" },
    { name: "Rampant Growth", quantity: 1, category: "ramp" },
    { name: "Farseek", quantity: 1, category: "ramp" },
  ];

  const draw: AICard[] = [
    { name: "Rhystic Study", quantity: 1, category: "draw" },
    { name: "Mystic Remora", quantity: 1, category: "draw" },
    { name: "Phyrexian Arena", quantity: 1, category: "draw" },
    { name: "Harmonize", quantity: 1, category: "draw" },
    { name: "Windfall", quantity: 1, category: "draw" },
    { name: "Brainstorm", quantity: 1, category: "draw" },
    { name: "Ponder", quantity: 1, category: "draw" },
  ];

  const removal: AICard[] = [
    { name: "Swords to Plowshares", quantity: 1, category: "removal" },
    { name: "Path to Exile", quantity: 1, category: "removal" },
    { name: "Counterspell", quantity: 1, category: "removal" },
    { name: "Swan Song", quantity: 1, category: "removal" },
    { name: "Cyclonic Rift", quantity: 1, category: "removal" },
    { name: "Wrath of God", quantity: 1, category: "removal" },
    { name: "Damnation", quantity: 1, category: "removal" },
    { name: "Generous Gift", quantity: 1, category: "removal" },
  ];

  const creatures: AICard[] = [
    { name: "Eternal Witness", quantity: 1, category: "creature" },
    { name: "Reclamation Sage", quantity: 1, category: "creature" },
    { name: "Mulldrifter", quantity: 1, category: "creature" },
    { name: "Solemn Simulacrum", quantity: 1, category: "creature" },
    { name: "Burnished Hart", quantity: 1, category: "creature" },
    { name: "Sun Titan", quantity: 1, category: "creature" },
    { name: "Avacyn, Angel of Hope", quantity: 1, category: "creature" },
    { name: "Consecrated Sphinx", quantity: 1, category: "creature" },
    { name: "Selvala, Heart of the Wilds", quantity: 1, category: "creature" },
    { name: "Seedborn Muse", quantity: 1, category: "creature" },
    { name: "Glen Elendra Archmage", quantity: 1, category: "creature" },
    { name: "Mystic Snake", quantity: 1, category: "creature" },
  ];

  const other: AICard[] = [
    { name: "Swiftfoot Boots", quantity: 1, category: "other" },
    { name: "Lightning Greaves", quantity: 1, category: "other" },
    { name: "Sensei's Divining Top", quantity: 1, category: "other" },
    { name: "Mimic Vat", quantity: 1, category: "other" },
    { name: "Strionic Resonator", quantity: 1, category: "other" },
    { name: "The Ozolith", quantity: 1, category: "other" },
    { name: "Doubling Season", quantity: 1, category: "other" },
    { name: "Parallel Lives", quantity: 1, category: "other" },
    { name: "Hardened Scales", quantity: 1, category: "other" },
    { name: "Inexorable Tide", quantity: 1, category: "other" },
    { name: "Contagion Engine", quantity: 1, category: "other" },
    { name: "Sword of Truth and Justice", quantity: 1, category: "other" },
    { name: "Grafted Exoskeleton", quantity: 1, category: "other" },
    { name: "Rings of Brighthearth", quantity: 1, category: "other" },
  ];

  const allCards = [...lands, ...ramp, ...draw, ...removal, ...creatures, ...other];

  // Count total (respecting quantity)
  const total = allCards.reduce((sum, c) => sum + c.quantity, 0);
  // Trim or pad to reach 99
  const flat: AICard[] = [];
  for (const c of allCards) {
    for (let i = 0; i < c.quantity; i++) {
      flat.push({ name: c.name, quantity: 1, category: c.category });
    }
  }
  const trimmed = flat.slice(0, 99);

  void req; // suppress unused var warning
  void total;

  return {
    commander,
    partner: null,
    cards: trimmed,
  };
}

// ---------------------------------------------------------------------------
// Stream helper
// ---------------------------------------------------------------------------
function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function streamDeck(
  controller: ReadableStreamDefaultController<Uint8Array>,
  deck: AIDeckResponse
) {
  const encoder = new TextEncoder();
  const emit = (event: BuildEvent) =>
    controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

  emit({ type: "status", message: "Commander selected…" });
  await delay(60);
  emit({ type: "commander", name: deck.commander });

  emit({ type: "status", message: "Building card list…" });

  for (const card of deck.cards) {
    await delay(30);
    emit({ type: "card", name: card.name, category: card.category });
  }

  if (deck.partner) {
    await delay(30);
    emit({ type: "card", name: deck.partner, category: "commander" });
  }

  const total = deck.cards.length + (deck.partner ? 1 : 0);
  emit({ type: "done", totalCards: total });
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  let body: BuildRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.colors) || typeof body.strategy !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: BuildEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        emit({ type: "status", message: "Thinking…" });

        let deck: AIDeckResponse;

        if (process.env.ANTHROPIC_API_KEY) {
          emit({ type: "status", message: "Consulting the AI oracle…" });
          deck = await callAnthropic(buildPrompt(body));
        } else if (process.env.OPENAI_API_KEY) {
          emit({ type: "status", message: "Consulting the AI oracle…" });
          deck = await callOpenAI(buildPrompt(body));
        } else {
          emit({ type: "status", message: "Using demo deck (no API key configured)…" });
          deck = mockDeck(body);
        }

        await streamDeck(controller, deck);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "AI deck build failed";
        console.error("[POST /api/ai/build]", message);
        emit({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
