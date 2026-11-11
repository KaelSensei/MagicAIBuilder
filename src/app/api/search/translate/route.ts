import { NextResponse } from "next/server";
import {
  callModelMetered,
  chooseModelTarget,
  type ReplyInterpretation,
} from "@/lib/ai/metered-model";
import type { AIProvider, ModelCall } from "@/lib/ai/model-reply";
import { reserveAiCallForRoute } from "@/lib/ai/usage/route-gate";
import { requireAuth } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  buildTranslationPrompt,
  prepareExecutableQuery,
  type NaturalLanguageSearchContext,
  type NaturalLanguageSearchRequest,
  type SearchQueryErrorCode,
  naturalLanguageSearchRequestSchema,
} from "@/lib/search/natural-language-query";

export const runtime = "nodejs";

/** Translations per account per minute, matching the suggestion burst limit. */
const TRANSLATE_RATE_LIMIT = 10;

/** Sliding window for the per-minute translation limit. */
const TRANSLATE_RATE_WINDOW_MS = 60_000;

/** One Scryfall query fits under this completion budget. */
const TRANSLATE_MAX_OUTPUT_TOKENS = 256;

const TRANSLATE_CALLS: Readonly<Record<AIProvider, ModelCall>> = {
  anthropic: {
    provider: "anthropic",
    model: "claude-haiku-4-5",
    maxTokens: TRANSLATE_MAX_OUTPUT_TOKENS,
  },
  openai: {
    provider: "openai",
    model: "gpt-4o-mini",
    maxTokens: TRANSLATE_MAX_OUTPUT_TOKENS,
  },
};

/**
 * Tells the client whether a signed-in player can translate a description.
 *
 * @returns `{ available: true }` only when the caller is signed in and a provider key is set
 */
export async function GET(): Promise<NextResponse> {
  try {
    const auth = await requireAuth();
    const available = !auth.error && chooseModelTarget(TRANSLATE_CALLS) !== undefined;
    return NextResponse.json({ available });
  } catch (error) {
    logger.error(
      error instanceof Error ? error : "Availability check failed",
      "GET /api/search/translate"
    );
    return NextResponse.json({ available: false });
  }
}

/**
 * Translates a description into one Scryfall query. Does not search Scryfall.
 *
 * @param request - JSON description, locale, and deck context
 * @returns the query and the deck context, or a stable error code
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const limited = rateLimit(auth.session.user.id);
    if (limited) return limited;
    const parsed = await readBody(request);
    if (!parsed.ok) return parsed.response;
    return await translate(auth.session.user.id, parsed.value);
  } catch (error) {
    logger.error(
      error instanceof Error ? error : "Translation failed",
      "POST /api/search/translate"
    );
    return jsonCode("failed", 500);
  }
}

function rateLimit(userId: string): NextResponse | null {
  const result = checkRateLimit(
    `search-translate:${userId}`,
    TRANSLATE_RATE_LIMIT,
    TRANSLATE_RATE_WINDOW_MS
  );
  if (result.allowed) return null;
  return jsonCode("rate_limited", 429, Math.ceil(result.retryAfterMs / 1000));
}

async function readBody(
  request: Request
): Promise<
  | { readonly ok: true; readonly value: NaturalLanguageSearchRequest }
  | { readonly ok: false; readonly response: NextResponse }
> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { ok: false, response: jsonCode("invalid_description", 400) };
  }
  const parsed = naturalLanguageSearchRequestSchema.safeParse(json);
  if (!parsed.success) return { ok: false, response: jsonCode("invalid_description", 400) };
  return { ok: true, value: parsed.data };
}

async function translate(
  userId: string,
  input: NaturalLanguageSearchRequest
): Promise<NextResponse> {
  const built = buildTranslationPrompt(input.description, input.locale);
  if (!built.ok) return jsonCode("invalid_description", 400);
  const target = chooseModelTarget(TRANSLATE_CALLS);
  if (!target) return jsonCode("unavailable", 503);

  const gate = await reserveAiCallForRoute(userId, "translate", "POST /api/search/translate");
  if (!gate.ok) return gate.response;

  const context = searchContext(input);
  try {
    const query = await callModelMetered({
      ticket: gate.ticket,
      target,
      prompt: built.prompt,
      interpret: (text) => interpretQuery(text, context),
    });
    return NextResponse.json({
      query,
      context: { format: context.format, colorIdentity: [...context.colorIdentity] },
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : "Search translation failed", "POST /api/search/translate");
    const code = refusalCode(error);
    return jsonCode(code, code === "invalid_query" ? 422 : 502);
  }
}

function searchContext(input: NaturalLanguageSearchRequest): NaturalLanguageSearchContext {
  return {
    format: input.format,
    enforceColorIdentity: input.enforceColorIdentity,
    colorIdentity: input.colorIdentity,
    applyContext: input.applyContext,
  };
}

function interpretQuery(
  text: string,
  context: NaturalLanguageSearchContext
): ReplyInterpretation<string> {
  const prepared = prepareExecutableQuery(text, context);
  if (!prepared.ok) {
    return {
      ok: false,
      outcome: prepared.reason === "unreadable" ? "parseFailed" : "rejectedByValidator",
      error: new Error(prepared.reason),
    };
  }
  return { ok: true, value: prepared.query };
}

function refusalCode(error: unknown): SearchQueryErrorCode {
  if (!(error instanceof Error)) return "failed";
  return error.message === "unreadable" || error.message === "invalid" ? "invalid_query" : "failed";
}

function jsonCode(
  code: SearchQueryErrorCode,
  status: number,
  retryAfterSeconds?: number
): NextResponse {
  return NextResponse.json(
    { code },
    {
      status,
      headers: retryAfterSeconds === undefined ? undefined : { "Retry-After": String(retryAfterSeconds) },
    }
  );
}
