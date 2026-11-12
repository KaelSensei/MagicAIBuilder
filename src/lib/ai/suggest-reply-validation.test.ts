import { describe, expect, it } from "vitest";
import { SUGGEST_REPLY_V1 } from "./fixtures/suggest-reply-v1";
import { readSuggestReply } from "./suggest-reply-validation";

const SWAN_SONG = {
  name: "Swan Song",
  reason: "Protects Talrand.",
  category: "protection",
  priority: "high",
};

describe("readSuggestReply", () => {
  it("accepts the recorded reply unchanged", () => {
    expect(readSuggestReply(SUGGEST_REPLY_V1)).toEqual({
      ok: true,
      content: SUGGEST_REPLY_V1,
    });
  });

  it("reads absent or null suggestions and removals as empty lists", () => {
    expect(readSuggestReply({ analysis: "Fine as it is." })).toEqual({
      ok: true,
      content: { analysis: "Fine as it is.", suggestions: [], removals: [] },
    });
    expect(
      readSuggestReply({ analysis: "", suggestions: null, removals: null })
    ).toEqual({
      ok: true,
      content: { analysis: "", suggestions: [], removals: [] },
    });
  });

  it("accepts an empty object as an empty answer", () => {
    expect(readSuggestReply({})).toEqual({
      ok: true,
      content: { analysis: "", suggestions: [], removals: [] },
    });
  });

  it.each(["Sol Ring", 1, true, { name: "Sol Ring" }])(
    "rejects suggestions given as %j instead of a list",
    (suggestions) => {
      expect(readSuggestReply({ analysis: "x", suggestions })).toEqual({
        ok: false,
        reason: "The AI returned suggestions that are not a list.",
      });
    }
  );

  it.each(["Opt", 1, true, { name: "Opt" }])(
    "rejects removals given as %j instead of a list",
    (removals) => {
      expect(readSuggestReply({ analysis: "x", removals })).toEqual({
        ok: false,
        reason: "The AI returned removals that are not a list.",
      });
    }
  );

  it.each(["Sol Ring", 42, null, ["Sol Ring"]])(
    "rejects a reply that is %j rather than a JSON object",
    (reply) => {
      expect(readSuggestReply(reply)).toEqual({
        ok: false,
        reason: "The AI returned a reply that is not a JSON object.",
      });
    }
  );

  it("drops suggestions, removals and alternatives that name no card", () => {
    const reply = {
      analysis: "One card.",
      suggestions: [
        { reason: "Lost its name.", category: "draw", priority: "high" },
        { ...SWAN_SONG, name: "   " },
        "Swan Song",
        {
          ...SWAN_SONG,
          alternatives: [
            { reason: "Nameless alternative.", dimension: "budget" },
            { name: "Dispel", reason: "Cheaper.", dimension: "budget" },
          ],
        },
      ],
      removals: [{ reason: "Nameless cut." }, { name: "Opt", reason: "Weak." }],
    };

    expect(readSuggestReply(reply)).toEqual({
      ok: true,
      content: {
        analysis: "One card.",
        suggestions: [
          {
            ...SWAN_SONG,
            alternatives: [
              { name: "Dispel", reason: "Cheaper.", dimension: "budget" },
            ],
          },
        ],
        removals: [{ name: "Opt", reason: "Weak." }],
      },
    });
  });

  it("keeps a suggestion whose alternatives are not a list, without them", () => {
    const reply = { suggestions: [{ ...SWAN_SONG, alternatives: "Dispel" }] };

    expect(readSuggestReply(reply)).toEqual({
      ok: true,
      content: { analysis: "", suggestions: [SWAN_SONG], removals: [] },
    });
  });

  it("rejects a reply whose entries all lack a card name when it has no analysis", () => {
    const reply = {
      suggestions: [{ reason: "Lost its name." }],
      removals: [{ reason: "Nameless cut." }],
    };

    expect(readSuggestReply(reply)).toEqual({
      ok: false,
      reason: "The AI returned no usable suggestion, removal or analysis.",
    });
  });

  it("keeps a reply whose entries all lack a card name when its analysis answers", () => {
    const reply = {
      analysis: "Sol Ring accelerates Talrand.",
      suggestions: [{ reason: "Lost its name." }],
    };

    expect(readSuggestReply(reply)).toEqual({
      ok: true,
      content: {
        analysis: "Sol Ring accelerates Talrand.",
        suggestions: [],
        removals: [],
      },
    });
  });

  it("reads an analysis that is not text as none", () => {
    expect(readSuggestReply({ analysis: 42 })).toEqual({
      ok: true,
      content: { analysis: "", suggestions: [], removals: [] },
    });
  });
});
