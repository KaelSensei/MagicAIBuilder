/**
 * The one server module that sends prompts to a model provider.
 *
 * Every call is metered: the caller holds a ticket from `reserveAiCall`, and
 * this module settles it with the tokens the provider reported, whatever the
 * call's outcome. Nothing else in `src/` may call a provider endpoint; a test
 * enforces it.
 */
import {
  ModelOutputTruncatedError,
  ModelRefusedError,
  readAnthropicReply,
  readOpenAIReply,
  type AIProvider,
  type ModelCall,
  type ModelReply,
} from "./model-reply";
import { NO_TOKENS, settleAiCall, type AiCallTicket } from "./usage/meter";
import type { AiCallOutcome } from "./usage/policy";

/**
 * How long a provider may take. It stays under the routes' `maxDuration`
 * (60 s) so a slow provider surfaces as an error event rather than the
 * platform cutting the stream.
 */
const PROVIDER_TIMEOUT_MS = 45_000;

/** The request a route will send, and the key that pays for it. */
export interface ModelTarget {
  readonly call: ModelCall;
  readonly apiKey: string;
}

/**
 * Picks the provider whose key is configured, Anthropic first.
 *
 * @param calls - the request the route would send to each provider
 * @returns the request and its key, or `undefined` when no key is set (the
 *   route then answers with its placeholder)
 */
export function chooseModelTarget(
  calls: Readonly<Record<AIProvider, ModelCall>>
): ModelTarget | undefined {
  // The key that selects a provider is the one sent to it.
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) return { call: calls.anthropic, apiKey: anthropicKey };
  const openAIKey = process.env.OPENAI_API_KEY;
  if (openAIKey) return { call: calls.openai, apiKey: openAIKey };
  return undefined;
}

/** What a route made of a complete reply's text. */
export type ReplyInterpretation<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false;
      readonly outcome: Extract<
        AiCallOutcome,
        "parseFailed" | "rejectedByValidator"
      >;
      readonly error: Error;
    };

/**
 * The interpretation of a reply that is not valid JSON.
 *
 * @param error - what `JSON.parse` threw
 * @returns a `parseFailed` interpretation carrying the error
 */
export function replyParseFailed(error: unknown): ReplyInterpretation<never> {
  return {
    ok: false,
    outcome: "parseFailed",
    error: error instanceof Error ? error : new Error(String(error)),
  };
}

/** One metered model call. */
export interface MeteredModelRequest<T> {
  /** The allowance unit reserved for this call. */
  readonly ticket: AiCallTicket;
  readonly target: ModelTarget;
  readonly prompt: string;
  /** Turns the reply's text into the route's result, or says why it cannot. */
  readonly interpret: (text: string) => ReplyInterpretation<T>;
}

/**
 * Sends one prompt to a provider.
 *
 * @param target - the request and its key
 * @param prompt - the user message
 * @returns the reply, read into the shared shape
 * @throws when the request fails, times out or returns an HTTP error
 */
async function sendModelRequest(
  { call, apiKey }: ModelTarget,
  prompt: string
): Promise<ModelReply> {
  switch (call.provider) {
    case "anthropic": {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: call.model,
          max_tokens: call.maxTokens,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }
      return readAnthropicReply(await response.json());
    }
    case "openai": {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: call.model,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            max_tokens: call.maxTokens,
          }),
          signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        }
      );
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      return readOpenAIReply(await response.json());
    }
    default: {
      const unreachable: never = call.provider;
      return unreachable;
    }
  }
}

/**
 * Sends a prompt, interprets the reply and settles the reserved unit.
 *
 * The call is recorded with the provider's `usage` on every path. A reply cut
 * off at the token cap or refused is never interpreted. A request that failed
 * before a reply is recorded with zero tokens: an HTTP error is not billed,
 * and a timed-out request reports no usage to read.
 *
 * @param request - the ticket, the target, the prompt and the interpreter
 * @returns the route's result
 * @throws {ModelOutputTruncatedError} when the reply reached the token cap
 * @throws {ModelRefusedError} when the provider declined to answer
 * @throws the interpreter's error, or the provider error, otherwise
 */
export async function callModelMetered<T>({
  ticket,
  target,
  prompt,
  interpret,
}: MeteredModelRequest<T>): Promise<T> {
  const { call } = target;
  let reply: ModelReply;
  try {
    reply = await sendModelRequest(target, prompt);
  } catch (error) {
    await settleAiCall(ticket, {
      provider: call.provider,
      model: call.model,
      usage: NO_TOKENS,
      stopReason: null,
      outcome: "providerError",
    });
    throw error;
  }

  const settle = (outcome: AiCallOutcome): Promise<void> =>
    settleAiCall(ticket, {
      provider: call.provider,
      model: call.model,
      usage: reply.usage,
      stopReason: reply.stopReason,
      outcome,
    });

  switch (reply.ending) {
    case "truncated":
      await settle("truncated");
      throw new ModelOutputTruncatedError(call);
    case "refused":
      await settle("refused");
      throw new ModelRefusedError(call);
    case "complete":
      break;
    default: {
      const unreachable: never = reply.ending;
      return unreachable;
    }
  }

  // An envelope without text reads as an empty object, as it did before.
  const interpretation = interpret(reply.text ?? "{}");
  await settle(interpretation.ok ? "ok" : interpretation.outcome);
  if (!interpretation.ok) throw interpretation.error;
  return interpretation.value;
}
