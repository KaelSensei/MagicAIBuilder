export type DeckQuestion =
  | { readonly type: "why-card"; readonly cardName: string }
  | { readonly type: "weakest-card" };

/** Reads a bounded deck question without accepting arbitrary prompt text. */
export function readDeckQuestion(
  value: unknown,
  cardNames: readonly string[]
): DeckQuestion | undefined {
  if (typeof value !== "object" || value === null || !("type" in value))
    return undefined;
  if (value.type === "weakest-card") return { type: "weakest-card" };
  if (
    value.type === "why-card" &&
    "cardName" in value &&
    typeof value.cardName === "string" &&
    cardNames.includes(value.cardName)
  ) {
    return { type: "why-card", cardName: value.cardName };
  }
  return undefined;
}

/** Formats one constrained copilot question as a JSON-only task. */
export function formatDeckQuestionTask(question: DeckQuestion): string {
  if (question.type === "why-card") {
    return `Explain why ${question.cardName} belongs in this specific deck. Use the commander, archetype, deck brief, current cards and identified gaps as evidence. Mention a limitation or replacement condition when relevant. Do not propose unrelated deck changes.

Respond ONLY in this JSON format (no markdown):
{
  "analysis": "A concise, evidence-based answer in 2-4 sentences",
  "suggestions": [],
  "removals": []
}`;
  }
  return `Identify the single weakest card in the supplied deck for its stated commander, archetype, brief, target bracket and budget. Choose only a card present in ALL CURRENT CARDS and explain the concrete mismatch.

Respond ONLY in this JSON format (no markdown):
{
  "analysis": "A concise explanation of the most important weakness in 1-2 sentences",
  "suggestions": [],
  "removals": [{ "name": "Exact Card Name From Deck", "reason": "Why this is the single weakest card" }]
}`;
}
