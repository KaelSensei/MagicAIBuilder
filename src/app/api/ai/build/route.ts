import { NextResponse } from "next/server";
import { flattenError } from "zod";
import { buildSchema, sanitizeForPrompt } from "@/lib/validation/ai";
import { requireAuth } from "@/lib/auth/helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { mockDeck } from "./mock-deck";
import { validateGeneratedDeck } from "@/lib/ai/generated-deck-validation";
import { verifyGeneratedDeck } from "@/lib/ai/generated-deck-legality";
import {
  createDeckPlan,
  describeBracket,
  formatDeckPlanForPrompt,
} from "@/lib/ai/deck-plan";
import {
  readAnthropicReplyText,
  readOpenAIReplyText,
  type ModelCall,
} from "@/lib/ai/model-reply";
import type {
  AIDeckResponse,
  Bracket,
  BuildEvent,
  BuildRequest,
  BuildSource,
  DeckCorrection,
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

/**
 * Output-token cap for one decklist reply.
 *
 * The prompt asks for a commander, a partner and a "cards" array whose
 * quantities sum to 99, with basic lands grouped: about 70–95 entries of
 * three fields (name, quantity, category), roughly 1,400–2,900 tokens of JSON
 * depending on layout. 4,096 covers the top of that range. A reply that still
 * reaches the cap is reported as truncated rather than parsed.
 */
const BUILD_MAX_OUTPUT_TOKENS = 4096;

const ANTHROPIC_BUILD_CALL: ModelCall = {
  provider: "anthropic",
  model: "claude-haiku-4-5",
  maxTokens: BUILD_MAX_OUTPUT_TOKENS,
};

const OPENAI_BUILD_CALL: ModelCall = {
  provider: "openai",
  model: "gpt-4o-mini",
  maxTokens: BUILD_MAX_OUTPUT_TOKENS,
};

export type { BuildEvent, BuildRequest, BuildSource } from "./types";

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------
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
  const bracketDesc = describeBracket(req.bracket);
  const deckPlan = formatDeckPlanForPrompt(createDeckPlan(req));

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

PLAYER-REVIEWED DECK PLAN (FOLLOW THIS STRUCTURE):
${deckPlan}

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
async function callAnthropic(
  prompt: string,
  apiKey: string
): Promise<AIDeckResponse> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_BUILD_CALL.model,
      max_tokens: ANTHROPIC_BUILD_CALL.maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
    // Must stay under maxDuration so a slow provider surfaces as an error
    // event rather than the platform truncating the stream.
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
  const text =
    readAnthropicReplyText(await response.json(), ANTHROPIC_BUILD_CALL) ?? "{}";
  // Strip markdown fences if the model wrapped output anyway
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .trimEnd()
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned) as AIDeckResponse;
}

// ---------------------------------------------------------------------------
// AI call: OpenAI
// ---------------------------------------------------------------------------
async function callOpenAI(
  prompt: string,
  apiKey: string
): Promise<AIDeckResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_BUILD_CALL.model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: OPENAI_BUILD_CALL.maxTokens,
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
  const text =
    readOpenAIReplyText(await response.json(), OPENAI_BUILD_CALL) ?? "{}";
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
  corrections: readonly DeckCorrection[]
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

  emit({ type: "done", totalCards: total, source, corrections });
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
    RATE_WINDOW
  );
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Too many requests. Please wait ${Math.ceil(rl.retryAfterMs / 1000)}s before retrying.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
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
      { error: "Invalid request body", details: flattenError(parsed.error) },
      { status: 400 }
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

        // The key that selects a provider is the one sent to it.
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        const openAIKey = process.env.OPENAI_API_KEY;
        if (anthropicKey) {
          emit({ type: "status", message: "Consulting the AI oracle…" });
          deck = await callAnthropic(buildPrompt(body), anthropicKey);
          source = "ai";
        } else if (openAIKey) {
          emit({ type: "status", message: "Consulting the AI oracle…" });
          deck = await callOpenAI(buildPrompt(body), openAIKey);
          source = "ai";
        } else {
          // No provider key configured: fall back to a colour-correct
          // placeholder list, and flag it on "done" so the UI can say so.
          deck = mockDeck(body);
          source = "demo";
        }

        const validationIssues = validateGeneratedDeck(deck);
        if (validationIssues.length > 0) {
          throw new Error(
            `Generated deck rejected: ${validationIssues.join(" ")}`
          );
        }

        // Card data, not the model, decides what reaches the player: illegal
        // cards are repaired and every change rides on the "done" event.
        const verdict = await verifyGeneratedDeck(deck);
        if (verdict.status === "rejected") {
          throw new Error(
            `Generated deck rejected: ${verdict.reasons.join(" ")}`
          );
        }

        streamDeck(emit, verdict.deck, source, verdict.corrections);
      } catch (error) {
        // The cause is logged; the client gets a fixed line so provider
        // errors (quota, model names, stack fragments) never reach the UI.
        // The Error itself is logged so a typed failure such as a reply cut
        // off at the token cap keeps its name and fields in the log line.
        logger.error(
          error instanceof Error ? error : String(error),
          "POST /api/ai/build"
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
