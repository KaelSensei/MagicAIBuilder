/*
 * POST /api/ai/build: builds a Commander deck from a colour identity, a
 * strategy, a bracket and an optional commander, then streams the checked list.
 */
import { NextResponse } from "next/server";
import { flattenError } from "zod";
import { buildSchema, sanitizeForPrompt } from "@/lib/validation/ai";
import { requireAuth } from "@/lib/auth/helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { mockDeck } from "./mock-deck";
import {
  isAIDeckResponse,
  validateGeneratedDeck,
} from "@/lib/ai/generated-deck-validation";
import { verifyGeneratedDeck } from "@/lib/ai/generated-deck-legality";
import {
  createDeckPlan,
  describeBracket,
  formatDeckPlanForPrompt,
} from "@/lib/ai/deck-plan";
import type { AIProvider, ModelCall } from "@/lib/ai/model-reply";
import {
  callModelMetered,
  chooseModelTarget,
  replyParseFailed,
  type ModelTarget,
  type ReplyInterpretation,
} from "@/lib/ai/metered-model";
import {
  recordPlaceholderAnswer,
  type AiCallTicket,
} from "@/lib/ai/usage/meter";
import { reserveAiCallForRoute } from "@/lib/ai/usage/route-gate";
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

const BUILD_CALLS: Readonly<Record<AIProvider, ModelCall>> = {
  anthropic: {
    provider: "anthropic",
    model: "claude-haiku-4-5",
    maxTokens: BUILD_MAX_OUTPUT_TOKENS,
  },
  openai: {
    provider: "openai",
    model: "gpt-4o-mini",
    maxTokens: BUILD_MAX_OUTPUT_TOKENS,
  },
};

/**
 * Where this request's decklist comes from: a metered model call holding a
 * reserved build, or the placeholder when no provider key is set.
 */
type DeckOrigin =
  | {
      readonly kind: "model";
      readonly target: ModelTarget;
      readonly ticket: AiCallTicket;
    }
  | { readonly kind: "placeholder" };

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

  // JSON encoding escapes the quotes inside a name such as
  // `Henzie "Toolbox" Torre`, so they cannot close the quoted value.
  const commanderStr = req.commanderName
    ? `Use exactly ${JSON.stringify(req.commanderName)} as the commander`
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
// Model reply
// ---------------------------------------------------------------------------
/**
 * Reads a complete model reply as a decklist.
 *
 * @param text - the reply's text
 * @returns the deck, or why it cannot be used: not JSON, or structurally
 *   invalid
 */
function interpretDeckReply(text: string): ReplyInterpretation<AIDeckResponse> {
  // Strip markdown fences if the model wrapped output anyway
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .trimEnd()
    .replace(/```$/, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    return replyParseFailed(error);
  }
  const issues = validateGeneratedDeck(parsed);
  if (issues.length > 0 || !isAIDeckResponse(parsed)) {
    return {
      ok: false,
      outcome: "rejectedByValidator",
      error: new Error(`Generated deck rejected: ${issues.join(" ")}`),
    };
  }
  return { ok: true, value: parsed };
}

/**
 * Produces the decklist, from the model or from the placeholder.
 *
 * @param origin - the metered model call, or the placeholder
 * @param body - the sanitized build request
 * @param userId - the caller, recorded with a placeholder answer
 * @param emit - sends a progress event
 * @returns a structurally valid deck
 */
async function generateDeck(
  origin: DeckOrigin,
  body: BuildRequest,
  userId: string,
  emit: (event: BuildEvent) => void
): Promise<AIDeckResponse> {
  switch (origin.kind) {
    case "model":
      emit({ type: "status", message: "Consulting the AI oracle…" });
      return callModelMetered({
        ticket: origin.ticket,
        target: origin.target,
        prompt: buildPrompt(body),
        interpret: interpretDeckReply,
      });
    case "placeholder": {
      // No provider key configured: fall back to a colour-correct
      // placeholder list, and flag it on "done" so the UI can say so.
      const deck = mockDeck(body);
      await recordPlaceholderAnswer(userId, "build");
      const issues = validateGeneratedDeck(deck);
      if (issues.length > 0) {
        throw new Error(`Generated deck rejected: ${issues.join(" ")}`);
      }
      return deck;
    }
    default: {
      const unreachable: never = origin;
      return unreachable;
    }
  }
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

  // A model call needs a build from this month's allowance before the stream
  // starts, so a refusal can still be an HTTP status.
  const userId = auth.session.user.id;
  const target = chooseModelTarget(BUILD_CALLS);
  let origin: DeckOrigin = { kind: "placeholder" };
  if (target) {
    const gate = await reserveAiCallForRoute(
      userId,
      "build",
      "POST /api/ai/build"
    );
    if (!gate.ok) return gate.response;
    origin = { kind: "model", target, ticket: gate.ticket };
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: BuildEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        emit({ type: "status", message: "Thinking…" });
        const deck = await generateDeck(origin, body, userId, emit);
        const source: BuildSource = origin.kind === "model" ? "ai" : "demo";

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
