import { describe, expect, it } from "vitest";
import {
  anthropicMessage,
  openAIChatCompletion,
} from "./fixtures/provider-envelopes-v1";
import { readAnthropicReply, readOpenAIReply } from "./model-reply";

/** 1,200 fresh prompt tokens, 600 read from the cache, 300 generated. */
const CACHED_USAGE = {
  inputTokens: 1_200,
  outputTokens: 300,
  cachedTokens: 600,
};

describe("readAnthropicReply", () => {
  it("reads the text, the stop reason and the billed tokens of a complete reply", () => {
    expect(
      readAnthropicReply(
        anthropicMessage('{"analysis":""}', "end_turn", CACHED_USAGE)
      )
    ).toEqual({
      text: '{"analysis":""}',
      stopReason: "end_turn",
      ending: "complete",
      usage: {
        inputTokens: 1_200,
        outputTokens: 300,
        cacheReadTokens: 600,
        cacheWriteTokens: 0,
      },
    });
  });

  it.each([
    ["max_tokens", "truncated"],
    ["refusal", "refused"],
    ["stop_sequence", "complete"],
    ["model_context_window_exceeded", "complete"],
  ] as const)("reads stop reason %s as %s", (stopReason, ending) => {
    expect(readAnthropicReply(anthropicMessage("{", stopReason)).ending).toBe(
      ending
    );
  });

  it.each([
    [
      "an error envelope",
      { type: "error", error: { type: "overloaded_error" } },
    ],
    ["a value that is not an object", "Overloaded"],
  ])(
    "reads %s as a complete reply with no text and no tokens",
    (_case, body) => {
      expect(readAnthropicReply(body)).toEqual({
        text: undefined,
        stopReason: null,
        ending: "complete",
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
        },
      });
    }
  );
});

describe("readOpenAIReply", () => {
  it("splits the cached tokens out of OpenAI's prompt count", () => {
    expect(
      readOpenAIReply(
        openAIChatCompletion('{"analysis":""}', "stop", CACHED_USAGE)
      )
    ).toEqual({
      text: '{"analysis":""}',
      stopReason: "stop",
      ending: "complete",
      usage: {
        inputTokens: 1_200,
        outputTokens: 300,
        cacheReadTokens: 600,
        cacheWriteTokens: 0,
      },
    });
  });

  it.each([
    ["length", "truncated"],
    ["content_filter", "refused"],
    ["tool_calls", "complete"],
  ] as const)("reads finish reason %s as %s", (finishReason, ending) => {
    expect(
      readOpenAIReply(openAIChatCompletion("{", finishReason)).ending
    ).toBe(ending);
  });

  it("reads a choice whose content is null as no text", () => {
    expect(readOpenAIReply(openAIChatCompletion(null)).text).toBeUndefined();
  });
});
