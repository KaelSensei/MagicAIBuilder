import { z } from "zod";

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

/** The part of an Anthropic Messages response the AI routes read. */
const ANTHROPIC_REPLY = z.object({
  stop_reason: z.string().nullish(),
  content: z.array(z.object({ text: z.string().optional() })).optional(),
});

/**
 * Reads the text of an Anthropic Messages reply, refusing a truncated one.
 *
 * @param body - the parsed response body
 * @param call - the request that produced it, reported if it was cut off
 * @returns the first content block's text, or `undefined` when there is none
 * @throws {ModelOutputTruncatedError} when `stop_reason` is `"max_tokens"`
 */
export function readAnthropicReplyText(
  body: unknown,
  call: ModelCall
): string | undefined {
  // An envelope of another shape reads as no text, as it did before parsing.
  const reply = ANTHROPIC_REPLY.safeParse(body).data;
  if (reply?.stop_reason === "max_tokens") {
    throw new ModelOutputTruncatedError(call);
  }
  return reply?.content?.[0]?.text;
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
});

/**
 * Reads the text of an OpenAI Chat Completions reply, refusing a truncated one.
 *
 * @param body - the parsed response body
 * @param call - the request that produced it, reported if it was cut off
 * @returns the first choice's message content, or `undefined` when there is none
 * @throws {ModelOutputTruncatedError} when `finish_reason` is `"length"`
 */
export function readOpenAIReplyText(
  body: unknown,
  call: ModelCall
): string | undefined {
  const choice = OPENAI_REPLY.safeParse(body).data?.choices?.[0];
  if (choice?.finish_reason === "length") {
    throw new ModelOutputTruncatedError(call);
  }
  return choice?.message?.content ?? undefined;
}
