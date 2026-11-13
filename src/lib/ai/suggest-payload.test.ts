/**
 * Contract between the builder and `POST /api/ai/suggest`: the body
 * `buildSuggestPayload` writes for a deck the builder scored must pass the
 * route's `suggestSchema`, or the AI panel would be refused with a 400.
 */
import { describe, expect, it } from "vitest";
import { scoreBracket } from "@/lib/deck/bracket";
import { computeDeckStats } from "@/lib/deck/stats";
import type { Deck } from "@/lib/deck/types";
import { suggestSchema } from "@/lib/validation/ai";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { buildSuggestPayload } from "./suggest-payload";

const TALRAND = aDeckCard({
  id: "talrand",
  name: "Talrand, Sky Summoner",
  typeLine: "Legendary Creature — Merfolk Wizard",
  colorIdentity: ["U"],
  category: "commander",
});

/**
 * The body the builder posts for `deck`, through JSON as `fetch` sends it.
 *
 * @param deck - the deck the AI panel analyses
 * @returns the parsed JSON body
 */
function postedBody(deck: Deck): unknown {
  const stats = computeDeckStats(deck);
  const score = scoreBracket(deck, stats);
  const payload = buildSuggestPayload(
    deck,
    stats,
    score,
    score?.overall ?? deck.targetBracket,
    { budgetPerCard: 2.5, question: { type: "weakest-card" } }
  );
  return JSON.parse(JSON.stringify(payload));
}

describe("buildSuggestPayload", () => {
  it("writes a body the suggest route accepts for a scored deck", () => {
    const deck = aDeck({
      commander: TALRAND,
      cards: [
        aDeckCard({ id: "sol-ring", name: "Sol Ring", category: "ramp" }),
        aDeckCard({
          id: "rhystic",
          name: "Rhystic Study",
          colorIdentity: ["U"],
          isGameChanger: true,
          category: "draw",
        }),
      ],
    });

    expect(suggestSchema.safeParse(postedBody(deck)).error).toBeUndefined();
  });

  it("writes a body the suggest route accepts when every card breaks the commander's colour identity", () => {
    const deck = aDeck({
      commander: TALRAND,
      cards: Array.from({ length: 99 }, (_, index) =>
        aDeckCard({
          id: `red-${index}`,
          name: `Goblin Bushwhacker Variant ${String(index).padStart(2, "0")}`,
          colorIdentity: ["R"],
        })
      ),
    });

    const parsed = suggestSchema.safeParse(postedBody(deck));

    expect(parsed.error).toBeUndefined();
    expect(parsed.data?.bracketWarnings).toContainEqual(
      expect.stringMatching(/^Color identity violations: Goblin Bushwhacker/)
    );
  });
});
