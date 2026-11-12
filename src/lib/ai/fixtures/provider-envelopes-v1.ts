/**
 * Model provider response envelopes for the AI route suites, hand-written in
 * the shape each provider documents. No model was called to make them.
 *
 * Shapes, read 2026-11-11:
 * - Anthropic Messages `Message` and `Usage`:
 *   https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/resources/messages/messages.ts
 * - OpenAI Chat Completions `ChatCompletion` and `CompletionUsage`:
 *   https://github.com/openai/openai-node/blob/master/src/resources/chat/completions/completions.ts
 *   and https://github.com/openai/openai-node/blob/master/src/resources/completions.ts
 *
 * Fields the routes never read are kept, so the replies stay whole envelopes
 * when a stricter reader replaces `lib/ai/model-reply.ts`. The model ids are
 * dated snapshots, as the providers report the model that served an alias.
 */

/** Anthropic `StopReason` values. */
export type AnthropicStopReason =
  | "end_turn"
  | "max_tokens"
  | "stop_sequence"
  | "tool_use"
  | "pause_turn"
  | "refusal"
  | "model_context_window_exceeded";

/** OpenAI `finish_reason` values. */
export type OpenAIFinishReason =
  "stop" | "length" | "tool_calls" | "content_filter" | "function_call";

/** The tokens one reply reports, in the providers' own terms. */
export interface FixtureUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  /** Prompt tokens read from the provider's cache. */
  readonly cachedTokens: number;
}

/** Usage of a typical suggestion reply on a small model. */
export const TYPICAL_USAGE: FixtureUsage = {
  inputTokens: 1_850,
  outputTokens: 1_420,
  cachedTokens: 0,
};

/**
 * An Anthropic Messages response carrying `text` as its only content block.
 *
 * @param text - what the model wrote
 * @param stopReason - why the model stopped; `end_turn` for a complete reply
 * @param usage - the tokens the response reports
 * @returns the response body, as `POST /v1/messages` returns it
 */
export function anthropicMessage(
  text: string,
  stopReason: AnthropicStopReason = "end_turn",
  usage: FixtureUsage = TYPICAL_USAGE
) {
  return {
    id: "msg_01FixtureReplyV1",
    type: "message",
    role: "assistant",
    model: "claude-haiku-4-5-20251001",
    content: [{ type: "text", text, citations: null }],
    stop_reason: stopReason,
    stop_sequence: null,
    stop_details: null,
    container: null,
    usage: {
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: usage.cachedTokens,
      cache_creation: {
        ephemeral_5m_input_tokens: 0,
        ephemeral_1h_input_tokens: 0,
      },
      server_tool_use: null,
      service_tier: "standard",
    },
  };
}

/**
 * An OpenAI Chat Completions response carrying `text` as its only choice.
 *
 * `prompt_tokens` includes the cached tokens, as OpenAI reports them.
 *
 * @param text - what the model wrote; `null` when it wrote nothing
 * @param finishReason - why the model stopped; `stop` for a complete reply
 * @param usage - the tokens the response reports
 * @returns the response body, as `POST /v1/chat/completions` returns it
 */
export function openAIChatCompletion(
  text: string | null,
  finishReason: OpenAIFinishReason = "stop",
  usage: FixtureUsage = TYPICAL_USAGE
) {
  return {
    id: "chatcmpl-FixtureReplyV1",
    object: "chat.completion",
    // 2026-11-11T09:00:00Z
    created: 1_794_387_600,
    model: "gpt-4o-mini-2024-07-18",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: text,
          refusal: null,
          annotations: [],
        },
        logprobs: null,
        finish_reason: finishReason,
      },
    ],
    usage: {
      prompt_tokens: usage.inputTokens + usage.cachedTokens,
      completion_tokens: usage.outputTokens,
      total_tokens: usage.inputTokens + usage.cachedTokens + usage.outputTokens,
      prompt_tokens_details: {
        cached_tokens: usage.cachedTokens,
        audio_tokens: 0,
      },
      completion_tokens_details: {
        reasoning_tokens: 0,
        audio_tokens: 0,
        accepted_prediction_tokens: 0,
        rejected_prediction_tokens: 0,
      },
    },
    service_tier: "default",
    system_fingerprint: "fp_fixture_v1",
  };
}
