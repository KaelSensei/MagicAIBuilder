import { NextResponse } from "next/server";
import { buildSchema, sanitizeForPrompt } from "@/lib/validation/ai";
import { requireAuth } from "@/lib/auth/helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { mockDeck } from "./mock-deck";
import type {
  AIDeckResponse,
  Bracket,
  BuildEvent,
  BuildRequest,
  BuildSource,
} from "./types";

export const runtime = "nodejs";
/**
 * The provider call alone can take the better part of a minute. Without this the
 * platform default (10s) killed the response mid-stream, and the wizard sat on a
 * half-filled progress bar with no error.
 */
export const maxDuration = 60;

const RATE_LIMIT = 5; // max AI builds
const RATE_WINDOW = 60_000; // per 60 seconds per user

export type { BuildEvent, BuildRequest, BuildSource } from "./types";

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------
const BRACKET_DESCRIPTIONS: Record<Bracket, string> = {
  1: "Bracket 1 — Casual/precon level. No tutors, no combos, no game changers.",
  2: "Bracket 2 — Low power. 0-1 game changers max, no infinite combos, budget-friendly.",
  3: "Bracket 3 — Mid power. Up to 3 game changers, some strong synergies, no cEDH staples.",
  4: "Bracket 4 — High power. Fast combos and strong staples, short of a tuned cEDH list.",
  5: "Bracket 5 — cEDH. Any legal card, fully optimized for winning.",
};

const COLOR_NAMES: Record<string, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
  C: "Colorless",
};

function buildPrompt(req: BuildRequest): string {
  const colorStr =
    req.colors.length > 0
      ? req.colors.map((c) => COLOR_NAMES[c] ?? c).join(", ")
      : "Colorless";
  const colorSymbols = req.colors.filter((c) => c !== "C").join(""); // e.g. "UB" for Dimir
  const budgetStr = req.budget ? `$${req.budget} max per card` : "No limit";
  const bracketDesc = BRACKET_DESCRIPTIONS[req.bracket];

  const commanderStr = req.commanderName
    ? `Use exactly "${req.commanderName}" as the commander`
    : `Choose the best commander whose color identity is EXACTLY {${colorSymbols || "C"}} — meaning the commander uses ONLY these colors and no others`;

  return `You are a Magic: The Gathering Commander deck builder expert.

Build a complete Commander deck with these STRICT constraints:

COLOR IDENTITY (CRITICAL — DO NOT VIOLATE):
- Required colors: ${colorStr} (${colorSymbols || "Colorless"})
- The commander's color identity MUST be exactly {${colorSymbols || "C"}} — no more, no fewer colors
- Example: if colors are Blue + Black, use a Dimir commander (color identity UB), NOT a 4-color commander
- Every non-land card in the deck must be castable within the ${colorStr} color identity

STRATEGY: ${req.strategy}
BUDGET: ${budgetStr}
POWER LEVEL: ${bracketDesc}
COMMANDER: ${commanderStr}

Return a complete Commander decklist as ONLY valid JSON (no markdown, no text outside JSON):
{
  "commander": "Exact Commander Name",
  "partner": null,
  "cards": [
    { "name": "Exact Card Name", "quantity": 1, "category": "ramp|draw|removal|boardWipe|land|creature|protection|winCondition|other" }
  ]
}

STRICT RULES:
- The quantities in "cards" must sum to EXACTLY 99 — this is mandatory
- Every card except basic lands is singleton: give them "quantity": 1
- Group basic lands into a single entry each with the right quantity, e.g. { "name": "Island", "quantity": 12 }
- If using a partner commander, set "partner" and make the quantities sum to EXACTLY 98
- Include approximately 36-38 lands
- Use basic lands matching your color identity only (Plains/Island/Swamp/Mountain/Forest)
- All cards must be legal in Commander format
- No cards outside the commander's color identity
- Respect budget (skip expensive staples if over budget)
- Return ONLY the JSON object, nothing else`;
}

// ---------------------------------------------------------------------------
// AI call: Anthropic
// ---------------------------------------------------------------------------
async function callAnthropic(prompt: string): Promise<AIDeckResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
    // Must stay under maxDuration so a slow provider surfaces as an error
    // event rather than the platform truncating the stream.
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? "{}";
  // Strip markdown fences if the model wrapped output anyway
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
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
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
  const data = await response.json();
  const text: string = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(text) as AIDeckResponse;
}

// ---------------------------------------------------------------------------
// Stream helper
// ---------------------------------------------------------------------------
/**
 * Emits one event per decklist entry, carrying the entry's quantity so basics
 * survive the trip. There is deliberately no artificial per-card delay: it used
 * to burn three seconds of the function budget for a cosmetic effect.
 *
 * Not exported. A Next.js `route.ts` may only export the HTTP verbs and a
 * fixed set of config fields, so an exported helper fails the build with
 * "streamDeck is not a valid Route export field" — a check `tsc --noEmit`
 * does not run, which is why it passed locally and failed in CI.
 */
function streamDeck(
  emit: (event: BuildEvent) => void,
  deck: AIDeckResponse,
  source: BuildSource,
): void {
  emit({ type: "commander", name: deck.commander });
  emit({ type: "status", message: "Building card list…" });

  let total = 0;
  for (const card of deck.cards) {
    // Guard against a model returning 0, a negative, or a non-integer.
    const quantity = Math.max(1, Math.floor(card.quantity || 1));
    total += quantity;
    emit({ type: "card", name: card.name, category: card.category, quantity });
  }

  if (deck.partner) {
    total += 1;
    emit({
      type: "card",
      name: deck.partner,
      category: "commander",
      quantity: 1,
    });
  }

  emit({ type: "done", totalCards: total, source });
}

/** Narrows the validated bracket number to the Bracket union without a cast. */
function toBracket(value: number): Bracket {
  switch (value) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
      return value;
    default:
      return 2;
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const rl = checkRateLimit(
    `ai-build:${auth.session.user.id}`,
    RATE_LIMIT,
    RATE_WINDOW,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Too many requests. Please wait ${Math.ceil(rl.retryAfterMs / 1000)}s before retrying.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = buildSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Sanitize user-provided strings before injecting into prompts (prompt injection prevention)
  const body: BuildRequest = {
    budget: parsed.data.budget,
    colors: parsed.data.colors,
    strategy: sanitizeForPrompt(parsed.data.strategy, 50),
    commanderName: parsed.data.commanderName
      ? sanitizeForPrompt(parsed.data.commanderName, 200)
      : null,
    bracket: toBracket(parsed.data.bracket),
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: BuildEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        emit({ type: "status", message: "Thinking…" });

        let deck: AIDeckResponse;
        let source: BuildSource;

        if (process.env.ANTHROPIC_API_KEY) {
          emit({ type: "status", message: "Consulting the AI oracle…" });
          deck = await callAnthropic(buildPrompt(body));
          source = "ai";
        } else if (process.env.OPENAI_API_KEY) {
          emit({ type: "status", message: "Consulting the AI oracle…" });
          deck = await callOpenAI(buildPrompt(body));
          source = "ai";
        } else {
          // No provider key configured: fall back to a colour-correct
          // placeholder list, and flag it on "done" so the UI can say so.
          deck = mockDeck(body);
          source = "demo";
        }

        streamDeck(emit, deck, source);
      } catch (error) {
        // The cause is logged; the client gets a fixed line so provider
        // errors (quota, model names, stack fragments) never reach the UI.
        logger.error(
          error instanceof Error ? error.message : String(error),
          "POST /api/ai/build",
        );
        emit({ type: "error", message: "AI deck build failed" });
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
