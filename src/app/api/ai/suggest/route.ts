import { NextResponse } from "next/server";
import { sanitizeForPrompt } from "@/lib/validation/ai";
import { ARCHETYPE_PROMPT_HINTS, ARCHETYPES } from "@/lib/ai/archetypes";
import type { Archetype } from "@/lib/ai/archetypes";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth/helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db/prisma";
import { formatPlaytestEvidenceForPrompt } from "@/lib/playtest/ai-context";
import {
  formatDeckBriefForPrompt,
  normalizeDeckBrief,
} from "@/lib/ai/deck-brief";
import { getCardCollection } from "@/lib/scryfall/client";
import { buildSuggestionEvidence } from "@/lib/ai/suggestion-evidence";
import type { SuggestionEvidence } from "@/lib/ai/suggestion-evidence";

export const runtime = "nodejs";

const RATE_LIMIT = 10; // max AI suggestion requests
const RATE_WINDOW = 60_000; // per 60 seconds per user

interface BracketDimensions {
  ramp: number;
  draw: number;
  removal: number;
  tutors: number;
  winSpeed: number;
  avgCmc: number;
}

interface SuggestRequest {
  deckId: string;
  commanderName: string | null;
  partnerName: string | null;
  colorIdentity: string[];
  cardNames: string[];
  categories: Record<string, number>;
  avgCmc: number;
  bracket: number;
  bracketDimensions?: BracketDimensions;
  bracketWarnings?: string[];
  targetBracket: number;
  budget: number | null;
  gameChangersCount: number;
  gameChangersList?: string[];
  detectedThemes?: string[];
  archetype?: string;
  budgetPerCard?: number | null;
  cardPrices?: Record<string, number | null>; // name → price for budget filtering
  brief?: unknown;
}

export interface CardSuggestion {
  name: string;
  reason: string;
  category: string;
  priority: "high" | "medium" | "low";
  evidence?: SuggestionEvidence;
}

export interface CardRemoval {
  name: string;
  reason: string;
}

export interface SuggestResponse {
  suggestions: CardSuggestion[];
  removals: CardRemoval[];
  analysis: string;
  provider: "anthropic" | "openai" | "mock";
}

export type StreamEvent =
  | {
      type: "analysis";
      content: string;
      provider: "anthropic" | "openai" | "mock";
    }
  | { type: "suggestion"; data: CardSuggestion }
  | { type: "removal"; data: CardRemoval }
  | { type: "done" }
  | { type: "error"; message: string };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveCommanderLabel(req: SuggestRequest): string {
  if (!req.commanderName) return "No commander set";
  if (req.partnerName) return `${req.commanderName} + ${req.partnerName}`;
  return req.commanderName;
}

function resolveBudgetConstraint(req: SuggestRequest): string {
  if (req.budgetPerCard != null) {
    return `$${req.budgetPerCard.toFixed(2)} max per card — NEVER suggest a card above this price. If the ideal card exceeds budget, suggest a budget alternative and say why.`;
  }
  return req.budget
    ? `$${req.budget} total deck budget`
    : "No per-card budget limit";
}

function resolveArchetype(req: SuggestRequest): Archetype | undefined {
  return req.archetype &&
    (ARCHETYPES as readonly string[]).includes(req.archetype)
    ? (req.archetype as Archetype)
    : undefined;
}

async function loadPlaytestEvidence(
  deckId: string,
  userId: string
): Promise<string> {
  try {
    const sessions = await prisma.playtestSession.findMany({
      where: {
        deckId,
        userId,
        OR: [{ notes: { not: null } }, { proposedChange: { not: null } }],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        result: true,
        turns: true,
        mulliganCount: true,
        difficulty: true,
        notes: true,
        proposedChange: true,
      },
    });

    return formatPlaytestEvidenceForPrompt(
      sessions.map((session) => ({
        result:
          session.result === "win" || session.result === "draw"
            ? session.result
            : "loss",
        turns: session.turns,
        mulliganCount: session.mulliganCount,
        difficulty:
          session.difficulty === "budget" ||
          session.difficulty === "mid-range" ||
          session.difficulty === "cedh"
            ? session.difficulty
            : undefined,
        notes: session.notes ?? undefined,
        proposedChange: session.proposedChange ?? undefined,
      }))
    );
  } catch (error) {
    logger.error(
      "Playtest evidence unavailable",
      "POST /api/ai/suggest",
      error
    );
    return formatPlaytestEvidenceForPrompt([]);
  }
}

function buildPrompt(req: SuggestRequest, playtestEvidence: string): string {
  const commander = resolveCommanderLabel(req);
  const colors =
    req.colorIdentity.length > 0 ? req.colorIdentity.join("") : "Colorless";
  const budgetConstraint = resolveBudgetConstraint(req);
  const archetype = resolveArchetype(req);
  const archetypeHint = archetype
    ? ARCHETYPE_PROMPT_HINTS[archetype]
    : ARCHETYPE_PROMPT_HINTS["Goodstuff"];

  const categoryBreakdown = Object.entries(req.categories)
    .filter(([, count]) => count > 0)
    .map(([cat, count]) => `  ${cat}: ${count}`)
    .join("\n");

  const cardList = req.cardNames.join(", ");

  const dimensionInfo = req.bracketDimensions
    ? Object.entries(req.bracketDimensions)
        .map(([dim, score]) => `  ${dim}: ${score}/4`)
        .join("\n")
    : "  (not available)";

  const warningsInfo =
    req.bracketWarnings && req.bracketWarnings.length > 0
      ? req.bracketWarnings.map((w) => `  - ${w}`).join("\n")
      : "  None";

  const themesInfo =
    req.detectedThemes && req.detectedThemes.length > 0
      ? req.detectedThemes.join(", ")
      : "None detected";

  const gcInfo =
    req.gameChangersList && req.gameChangersList.length > 0
      ? req.gameChangersList.join(", ")
      : "None";
  const deckBrief = formatDeckBriefForPrompt(normalizeDeckBrief(req.brief));

  return `You are a Magic: The Gathering Commander expert. Analyze this deck and suggest targeted improvements.

DECK INFO:
- Commander: ${commander}
- Color Identity: ${colors}
- Total cards: ${req.cardNames.length + (req.commanderName ? 1 : 0) + (req.partnerName ? 1 : 0)}
- Average CMC: ${req.avgCmc.toFixed(2)}
- Current Bracket: ${req.bracket}/5
- Target Bracket: ${req.targetBracket}/5
- Budget: ${budgetConstraint}
- Archetype: ${archetype ?? "Auto-detect from deck composition"}
- Detected Themes: ${themesInfo}

${deckBrief}

CATEGORY BREAKDOWN:
${categoryBreakdown || "  (empty deck)"}

BRACKET DIMENSION SCORES (1=weak, 5=strong):
${dimensionInfo}

GAME CHANGERS IN DECK (${req.gameChangersCount}):
  ${gcInfo}

IDENTIFIED GAPS / WARNINGS:
${warningsInfo}

ALL CURRENT CARDS (${req.cardNames.length}):
${cardList || "(none)"}

${playtestEvidence}

ARCHETYPE GUIDANCE (${archetype ?? "Goodstuff"}):
${archetypeHint}

TASK:
1. Suggest exactly 8 cards to ADD. They should synergize with ${commander}, align with the archetype above, fill the gaps, match bracket ${req.targetBracket}, respect budget, and NOT already be in the deck. Include 2–4 sentences of rationale per card.
2. Suggest exactly 4 cards to REMOVE. They must be actual cards from the deck above that have low synergy with the archetype, are redundant, or push the bracket too high. Include an explanation per removal.

Respond ONLY in this JSON format (no markdown):
{
  "analysis": "2-3 sentences on current state, strengths, and main gaps",
  "suggestions": [
    {
      "name": "Exact Card Name",
      "reason": "One sentence explaining synergy with ${commander}",
      "category": "ramp|draw|removal|boardWipe|creature|land|protection|winCondition|other",
      "priority": "high|medium|low"
    }
  ],
  "removals": [
    {
      "name": "Exact Card Name From Deck",
      "reason": "One sentence explaining why it underperforms"
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
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
  const data = await response.json();
  const text = data.content?.[0]?.text ?? "{}";
  const parsed = JSON.parse(text);
  return {
    suggestions: parsed.suggestions ?? [],
    removals: parsed.removals ?? [],
    analysis: parsed.analysis ?? "",
    provider: "anthropic",
  };
}

async function callOpenAI(prompt: string): Promise<SuggestResponse> {
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
      max_tokens: 2048,
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(text);
  return {
    suggestions: parsed.suggestions ?? [],
    removals: parsed.removals ?? [],
    analysis: parsed.analysis ?? "",
    provider: "openai",
  };
}

function mockSuggestions(req: SuggestRequest): SuggestResponse {
  const suggestions: CardSuggestion[] = (
    [
      {
        name: "Sol Ring",
        reason: "Staple ramp in any Commander deck",
        category: "ramp",
        priority: "high" as const,
      },
      {
        name: "Arcane Signet",
        reason: "Efficient mana rock for your color identity",
        category: "ramp",
        priority: "high" as const,
      },
      {
        name: "Command Tower",
        reason: "Dual land for all your colors",
        category: "land",
        priority: "high" as const,
      },
      {
        name: "Rhystic Study",
        reason: "Powerful card draw engine",
        category: "draw",
        priority: "medium" as const,
      },
      {
        name: "Swords to Plowshares",
        reason: "Efficient single-target removal",
        category: "removal",
        priority: "medium" as const,
      },
      {
        name: "Cyclonic Rift",
        reason: "One-sided board reset",
        category: "boardWipe",
        priority: "medium" as const,
      },
      {
        name: "Swiftfoot Boots",
        reason: "Protects your commander from removal",
        category: "protection",
        priority: "low" as const,
      },
      {
        name: "Cultivate",
        reason: "Ramp + land smoothing",
        category: "ramp",
        priority: "low" as const,
      },
    ] as CardSuggestion[]
  )
    .filter((s) => !req.cardNames.includes(s.name))
    .slice(0, 8);

  const removalCandidates = req.cardNames
    .filter((n) => !suggestions.some((s) => s.name === n))
    .slice(0, 4);
  const removals: CardRemoval[] = removalCandidates.map((name) => ({
    name,
    reason:
      "Configure ANTHROPIC_API_KEY or OPENAI_API_KEY for personalized removal suggestions.",
  }));

  return {
    suggestions,
    removals,
    analysis: `Configure ANTHROPIC_API_KEY or OPENAI_API_KEY in your environment to get personalized AI suggestions for ${req.commanderName ?? "your deck"}.`,
    provider: "mock",
  };
}

async function enrichSuggestionEvidence(
  result: SuggestResponse,
  req: SuggestRequest
): Promise<SuggestResponse> {
  if (result.suggestions.length === 0) return result;

  let cardsByName = new Map<
    string,
    Awaited<ReturnType<typeof getCardCollection>>["data"][number]
  >();
  try {
    const collection = await getCardCollection(
      result.suggestions.map(({ name }) => ({ name }))
    );
    cardsByName = new Map(
      collection.data.map((card) => [card.name.toLowerCase(), card])
    );
  } catch (error) {
    logger.error(
      "Suggestion evidence unavailable",
      "POST /api/ai/suggest",
      error
    );
  }

  return {
    ...result,
    suggestions: result.suggestions.map((suggestion) => ({
      ...suggestion,
      evidence: buildSuggestionEvidence(
        suggestion,
        cardsByName.get(suggestion.name.toLowerCase()),
        { deckColors: req.colorIdentity, averageCmc: req.avgCmc }
      ),
    })),
  };
}

async function streamResponse(
  controller: ReadableStreamDefaultController<Uint8Array>,
  result: SuggestResponse
): Promise<void> {
  const encoder = new TextEncoder();
  const emit = (event: StreamEvent) =>
    controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

  emit({
    type: "analysis",
    content: result.analysis,
    provider: result.provider,
  });
  for (const suggestion of result.suggestions) {
    await delay(80);
    emit({ type: "suggestion", data: suggestion });
  }
  for (const removal of result.removals) {
    await delay(80);
    emit({ type: "removal", data: removal });
  }
  emit({ type: "done" });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const rl = checkRateLimit(
    `ai-suggest:${auth.session.user.id}`,
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

  let body: SuggestRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (
    typeof body.deckId !== "string" ||
    !body.colorIdentity ||
    !Array.isArray(body.cardNames)
  )
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // Sanitize user-provided strings before injecting into prompts (prompt injection prevention)
  if (body.commanderName)
    body.commanderName = sanitizeForPrompt(body.commanderName, 200);
  if (body.partnerName)
    body.partnerName = sanitizeForPrompt(body.partnerName, 200);

  const playtestEvidence = await loadPlaytestEvidence(
    body.deckId,
    auth.session.user.id
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const prompt = buildPrompt(body, playtestEvidence);
        let result: SuggestResponse;
        if (process.env.ANTHROPIC_API_KEY) result = await callAnthropic(prompt);
        else if (process.env.OPENAI_API_KEY) result = await callOpenAI(prompt);
        else result = mockSuggestions(body);
        await streamResponse(
          controller,
          await enrichSuggestionEvidence(result, body)
        );
      } catch (error) {
        // Logged in full, sent generic — provider errors stay server-side.
        logger.error(
          error instanceof Error ? error.message : String(error),
          "POST /api/ai/suggest"
        );
        const event: StreamEvent = {
          type: "error",
          message: "AI suggestion failed",
        };
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
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
