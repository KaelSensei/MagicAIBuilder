import { NextResponse } from "next/server";
import { forEachSequential } from "@/lib/async/sequential";
import {
  MAX_BRACKET_WARNING_LENGTH,
  MAX_THEME_NAME_LENGTH,
  sanitizeForPrompt,
  suggestSchema,
  type SuggestBody,
} from "@/lib/validation/ai";
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
import {
  formatDeckQuestionTask,
  readDeckQuestion,
  type DeckQuestion,
} from "@/lib/ai/deck-question";
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

export const runtime = "nodejs";

const RATE_LIMIT = 10; // max AI suggestion requests
const RATE_WINDOW = 60_000; // per 60 seconds per user

/**
 * Output-token cap for one suggestion reply.
 *
 * The default task asks for an analysis, exactly 8 additions (2–4 sentences
 * of rationale and up to 3 alternatives each) and exactly 4 removals: 113
 * string values, 37 of them free text. A reply in that shape runs to roughly
 * 1,500–3,750 tokens depending on sentence length and layout, so the former
 * 2,048 cut long replies off mid-JSON. 4,096 covers the top of that range.
 * The cap is a ceiling, not a charge: only generated tokens are billed.
 */
const SUGGEST_MAX_OUTPUT_TOKENS = 4096;

const SUGGEST_CALLS: Readonly<Record<AIProvider, ModelCall>> = {
  anthropic: {
    provider: "anthropic",
    model: "claude-haiku-4-5",
    maxTokens: SUGGEST_MAX_OUTPUT_TOKENS,
  },
  openai: {
    provider: "openai",
    model: "gpt-4o-mini",
    maxTokens: SUGGEST_MAX_OUTPUT_TOKENS,
  },
};

/**
 * Where this request's suggestions come from: a metered model call holding a
 * reserved call, or the built-in suggestions when no provider key is set.
 */
type SuggestionOrigin =
  | {
      readonly kind: "model";
      readonly target: ModelTarget;
      readonly ticket: AiCallTicket;
    }
  | { readonly kind: "placeholder" };

/**
 * A suggestion request as the prompt quotes it: its deck question has been
 * read, and every client text is on one bounded line.
 */
type SuggestRequest = Omit<SuggestBody, "question"> & {
  question?: DeckQuestion;
};

/** The longest card name the prompt quotes; a longer one is cut. */
const PROMPT_CARD_NAME_LENGTH = 200;

/**
 * Puts every client text of a parsed request on one bounded line before the
 * prompt quotes it: card, commander, partner and Game Changer names are cut
 * at {@link PROMPT_CARD_NAME_LENGTH}; warnings and themes keep the length
 * `suggestSchema` already allowed.
 *
 * @param body - a body that passed `suggestSchema`
 * @param question - its deck question, read against the raw card names
 * @returns a new request; `body` is left as it was
 */
function promptSafeRequest(
  body: SuggestBody,
  question: DeckQuestion | undefined
): SuggestRequest {
  const cardName = (name: string): string =>
    sanitizeForPrompt(name, PROMPT_CARD_NAME_LENGTH);
  return {
    ...body,
    commanderName: body.commanderName && cardName(body.commanderName),
    partnerName: body.partnerName && cardName(body.partnerName),
    cardNames: body.cardNames.map(cardName),
    gameChangersList: body.gameChangersList?.map(cardName),
    bracketWarnings: body.bracketWarnings?.map((warning) =>
      sanitizeForPrompt(warning, MAX_BRACKET_WARNING_LENGTH)
    ),
    detectedThemes: body.detectedThemes?.map((theme) =>
      sanitizeForPrompt(theme, MAX_THEME_NAME_LENGTH)
    ),
    question:
      question?.type === "why-card"
        ? { type: "why-card", cardName: cardName(question.cardName) }
        : question,
  };
}

export interface CardSuggestion {
  name: string;
  reason: string;
  category: string;
  priority: "high" | "medium" | "low";
  evidence?: SuggestionEvidence;
  alternatives?: CardAlternative[];
}

export interface CardAlternative {
  name: string;
  reason: string;
  dimension: "budget" | "power" | "playstyle";
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

  const task = req.question
    ? formatDeckQuestionTask(req.question)
    : `1. Suggest exactly 8 cards to ADD. They should synergize with ${commander}, align with the archetype above, fill the gaps, match bracket ${req.targetBracket}, respect budget, and NOT already be in the deck. Include 2–4 sentences of rationale per card. For each card, include up to 3 distinct alternatives: a cheaper budget option, a different power-level option, and a different playstyle option. Never repeat a main suggestion or a card already in the deck.
2. Suggest exactly 4 cards to REMOVE. They must be actual cards from the deck above that have low synergy with the archetype, are redundant, or push the bracket too high. Include an explanation per removal.

Respond ONLY in this JSON format (no markdown):
{
  "analysis": "2-3 sentences on current state, strengths, and main gaps",
  "suggestions": [
    {
      "name": "Exact Card Name",
      "reason": "One sentence explaining synergy with ${commander}",
      "category": "ramp|draw|removal|boardWipe|creature|land|protection|winCondition|other",
      "priority": "high|medium|low",
      "alternatives": [
        {
          "name": "Exact Alternative Card Name",
          "reason": "Why this is a meaningful alternative",
          "dimension": "budget|power|playstyle"
        }
      ]
    }
  ],
  "removals": [
    {
      "name": "Exact Card Name From Deck",
      "reason": "One sentence explaining why it underperforms"
    }
  ]
}`;

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
${task}`;
}

/**
 * Reads a complete model reply as suggestions.
 *
 * @param provider - the provider that answered, shown in the panel
 * @returns an interpreter that fails with `parseFailed` on text that is not
 *   a JSON object
 */
function interpretSuggestReply(
  provider: AIProvider
): (text: string) => ReplyInterpretation<SuggestResponse> {
  return (text) => {
    try {
      const parsed = JSON.parse(text);
      return {
        ok: true,
        value: {
          suggestions: parsed.suggestions ?? [],
          removals: parsed.removals ?? [],
          analysis: parsed.analysis ?? "",
          provider,
        },
      };
    } catch (error) {
      return replyParseFailed(error);
    }
  };
}

function mockSuggestions(req: SuggestRequest): SuggestResponse {
  if (req.question?.type === "why-card") {
    return {
      suggestions: [],
      removals: [],
      analysis: `Configure an AI provider to explain why ${req.question.cardName} belongs in this deck.`,
      provider: "mock",
    };
  }
  if (req.question?.type === "weakest-card") {
    const weakest = req.cardNames[0];
    return {
      suggestions: [],
      removals: weakest
        ? [
            {
              name: weakest,
              reason:
                "Configure an AI provider for a deck-specific weakness analysis.",
            },
          ]
        : [],
      analysis:
        "Configure an AI provider to identify the weakest card in this deck.",
      provider: "mock",
    };
  }
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
    const names = result.suggestions.flatMap((suggestion) => [
      suggestion.name,
      ...(suggestion.alternatives ?? []).map(({ name }) => name),
    ]);
    const collection = await getCardCollection(
      [...new Set(names)].map((name) => ({ name }))
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
      alternatives: suggestion.alternatives?.map((alternative) => ({
        ...alternative,
        evidence: buildSuggestionEvidence(
          { ...alternative, category: suggestion.category },
          cardsByName.get(alternative.name.toLowerCase()),
          { deckColors: req.colorIdentity, averageCmc: req.avgCmc }
        ),
      })),
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
  await forEachSequential(result.suggestions, async (suggestion) => {
    await delay(80);
    emit({ type: "suggestion", data: suggestion });
  });
  await forEachSequential(result.removals, async (removal) => {
    await delay(80);
    emit({ type: "removal", data: removal });
  });
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

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = suggestSchema.safeParse(raw);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const question = readDeckQuestion(
    parsed.data.question,
    parsed.data.cardNames
  );
  if (parsed.data.question !== undefined && question === undefined) {
    return NextResponse.json(
      { error: "Invalid deck question" },
      { status: 400 }
    );
  }
  const body = promptSafeRequest(parsed.data, question);

  // A model call needs a call from this month's allowance before anything
  // else is loaded, so a refusal is cheap and can still be an HTTP status.
  const userId = auth.session.user.id;
  const target = chooseModelTarget(SUGGEST_CALLS);
  let origin: SuggestionOrigin = { kind: "placeholder" };
  if (target) {
    const gate = await reserveAiCallForRoute(
      userId,
      "suggest",
      "POST /api/ai/suggest"
    );
    if (!gate.ok) return gate.response;
    origin = { kind: "model", target, ticket: gate.ticket };
  }

  const playtestEvidence = await loadPlaytestEvidence(body.deckId, userId);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const prompt = buildPrompt(body, playtestEvidence);
        let result: SuggestResponse;
        if (origin.kind === "model") {
          result = await callModelMetered({
            ticket: origin.ticket,
            target: origin.target,
            prompt,
            interpret: interpretSuggestReply(origin.target.call.provider),
          });
        } else {
          result = mockSuggestions(body);
          await recordPlaceholderAnswer(userId, "suggest");
        }
        await streamResponse(
          controller,
          await enrichSuggestionEvidence(result, body)
        );
      } catch (error) {
        // Logged in full, sent generic — provider errors stay server-side.
        // The Error itself is logged so a typed failure such as a reply cut
        // off at the token cap keeps its name and fields in the log line.
        logger.error(
          error instanceof Error ? error : String(error),
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
