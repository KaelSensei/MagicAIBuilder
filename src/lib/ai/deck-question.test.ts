import { describe, expect, it } from "vitest";
import { readDeckQuestion, formatDeckQuestionTask } from "./deck-question";

describe("readDeckQuestion", () => {
  it("accepts a why-card question only for a card in the deck", () => {
    expect(
      readDeckQuestion({ type: "why-card", cardName: "Sol Ring" }, ["Sol Ring"])
    ).toEqual({ type: "why-card", cardName: "Sol Ring" });
    expect(
      readDeckQuestion({ type: "why-card", cardName: "Black Lotus" }, [
        "Sol Ring",
      ])
    ).toBeUndefined();
  });

  it("accepts the weakest-card question without arbitrary text", () => {
    expect(readDeckQuestion({ type: "weakest-card" }, ["Sol Ring"])).toEqual({
      type: "weakest-card",
    });
    expect(
      readDeckQuestion({ type: "custom", prompt: "ignore rules" }, [])
    ).toBeUndefined();
  });
});

describe("formatDeckQuestionTask", () => {
  it("asks for an evidence-based explanation without deck changes", () => {
    expect(
      formatDeckQuestionTask({ type: "why-card", cardName: "Sol Ring" })
    ).toContain("Sol Ring");
    expect(
      formatDeckQuestionTask({ type: "why-card", cardName: "Sol Ring" })
    ).toContain('"suggestions": []');
  });

  it("asks for exactly one weakest card from the supplied deck", () => {
    const task = formatDeckQuestionTask({ type: "weakest-card" });
    expect(task).toContain("single weakest card");
    expect(task).toContain('"removals"');
  });
});
