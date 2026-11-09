import { z } from "zod";
import type { TokenUsage } from "./usage/prices";

/** AI provider an API route sends its prompt to. */
export type AIProvider = "anthropic" | "openai";

/** One model request: the provider, the model and the output-token cap sent. */
export interface ModelCall {
  readonly provider: AIProvider;
  readonly model: string;
  readonly maxTokens: number;
}

/**
 * The provider stopped the reply because it reached the output-token cap.
 *
 * The reply is unfinished (for the AI routes, JSON cut off mid-object), so it
 * is reported as a truncation instead of the `SyntaxError` that parsing it
 * would raise. Every token up to the cap was billed. The fields are own
 * enumerable properties so the JSON log line carries them next to the message.
 */
export class ModelOutputTruncatedError extends Error {
  override readonly name = "ModelOutputTruncatedError";
  readonly provider: AIProvider;
  readonly model: string;
  readonly maxTokens: number;

  /** @param call - the request whose reply was cut off */
  constructor(call: ModelCall) {
    super(
      `${call.provider} reply from ${call.model} was cut off at the ${call.maxTokens}-token output cap`
    );
    this.provider = call.provider;
    this.model = call.model;
    this.maxTokens = call.maxTokens;
  }
}

/**
 * The provider declined to answer (`stop_reason: "refusal"` from Anthropic,
 * `finish_reason: "content_filter"` from OpenAI). Whatever text came back is
 * not the requested JSON, so it is never parsed.
 */
export class ModelRefusedError extends Error {
  override readonly name = "ModelRefusedError";
  readonly provider: AIProvider;
  readonly model: string;

  /** @param call - the request that was refused */
  constructor(call: ModelCall) {
    super(`${call.provider} model ${call.model} refused to answer`);
    this.provider = call.provider;
    this.model = call.model;
  }
}

/** How a provider ended its reply, in the routes' terms. */
export type ReplyEnding = "complete" | "truncated" | "refused";

/** One provider reply, read into the same shape for every provider. */
export interface ModelReply {
  /** The first text block or choice, or `undefined` when there is none. */
  readonly text: string | undefined;
  /** The provider's own stop value, kept for the ledger. */
  readonly stopReason: string | null;
  readonly ending: ReplyEnding;
  /** Tokens billed, from the response's `usage`; zero where it is absent. */
  readonly usage: TokenUsage;
}

/**
 * Maps a provider's stop value to how the reply ended.
 *
 * @param stopReason - the provider's stop or finish reason
 * @param truncatedAt - the value that means the output-token cap was reached
 * @param refusedAt - the value that means the provider declined to answer
 * @returns the reply's ending
 */
function endingFrom(
  stopReason: string | null,
  truncatedAt: string,
  refusedAt: string
): ReplyEnding {
  if (stopReason === truncatedAt) return "truncated";
  if (stopReason === refusedAt) return "refused";
  return "complete";
}

const TOKEN_COUNT = z.number().int().nonnegative().nullish();

/** The part of an Anthropic Messages response the AI routes read. */
const ANTHROPIC_REPLY = z.object({
  stop_reason: z.string().nullish(),
  content: z.array(z.object({ text: z.string().optional() })).optional(),
  usage: z
    .object({
      input_tokens: TOKEN_COUNT,
      output_tokens: TOKEN_COUNT,
      cache_creation_input_tokens: TOKEN_COUNT,
      cache_read_input_tokens: TOKEN_COUNT,
    })
    .optional(),
});

/**
 * Reads an Anthropic Messages reply.
 *
 * `input_tokens` already excludes cache reads and writes, which `usage`
 * reports separately.
 *
 * @param body - the parsed response body
 * @returns the text, the stop reason and how it ended, and the billed tokens
 */
export function readAnthropicReply(body: unknown): ModelReply {
  // An envelope of another shape reads as no text and no usage.
  const reply = ANTHROPIC_REPLY.safeParse(body).data;
  const stopReason = reply?.stop_reason ?? null;
  const usage = reply?.usage;
  return {
    text: reply?.content?.[0]?.text,
    stopReason,
    ending: endingFrom(stopReason, "max_tokens", "refusal"),
    usage: {
      inputTokens: usage?.input_tokens ?? 0,
      outputTokens: usage?.output_tokens ?? 0,
      cacheReadTokens: usage?.cache_read_input_tokens ?? 0,
      cacheWriteTokens: usage?.cache_creation_input_tokens ?? 0,
    },
  };
}

/** The part of an OpenAI Chat Completions response the AI routes read. */
const OPENAI_REPLY = z.object({
  choices: z
    .array(
      z.object({
        finish_reason: z.string().nullish(),
        message: z.object({ content: z.string().nullish() }).optional(),
      })
    )
    .optional(),
  usage: z
    .object({
      prompt_tokens: TOKEN_COUNT,
      completion_tokens: TOKEN_COUNT,
      prompt_tokens_details: z.object({ cached_tokens: TOKEN_COUNT }).nullish(),
    })
    .optional(),
});

/**
 * Reads an OpenAI Chat Completions reply.
 *
 * OpenAI counts cached prompt tokens inside `prompt_tokens`; they are split
 * out so every provider's input count means the same thing.
 *
 * @param body - the parsed response body
 * @returns the text, the finish reason and how it ended, and the billed tokens
 */
export function readOpenAIReply(body: unknown): ModelReply {
  const reply = OPENAI_REPLY.safeParse(body).data;
  const choice = reply?.choices?.[0];
  const stopReason = choice?.finish_reason ?? null;
  const promptTokens = reply?.usage?.prompt_tokens ?? 0;
  const cachedTokens = reply?.usage?.prompt_tokens_details?.cached_tokens ?? 0;
  return {
    text: choice?.message?.content ?? undefined,
    stopReason,
    ending: endingFrom(stopReason, "length", "content_filter"),
    usage: {
      inputTokens: Math.max(0, promptTokens - cachedTokens),
      outputTokens: reply?.usage?.completion_tokens ?? 0,
      cacheReadTokens: cachedTokens,
      cacheWriteTokens: 0,
    },
  };
}
