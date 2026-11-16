/**
 * The Scryfall clause that scopes a search to what a Commander deck may hold:
 * its commander's colour identity, widened by the commander's rulebreaker
 * exceptions.
 *
 * Search context; read by the described search's deck context
 * (`natural-language-context.ts`). Rules: CR 903.5c (a card's identity must sit
 * inside the commander's), CR 903.5e (a rulebreaker commander admits some cards
 * whatever their identity; the format-rules rulebreaker table lists them).
 * Scryfall syntax (https://scryfall.com/docs/syntax, read 2026-11-16): `id<=`
 * for identity, `t:` for any word of the type line, `mv>=` for mana value,
 * `OR` between alternatives and parentheses to group them. Recorded on
 * 2026-11-16: `t:angel c:g (id<=WB OR t:angel OR t:basic) legal:commander`
 * returned 14 green Angels, the same query with a bare `id<=WB` returned none
 * (`fixtures/rulebreaker-search-v1.ts`).
 *
 * Not responsible for: the player's own colour filter, which stays exactly as
 * chosen.
 *
 * @module search/rulebreaker-scope
 */
import type {
  RulebreakerCardTest,
  RulebreakerException,
} from "@/modules/format-rules";

/** A conjunction of terms, grouped so it binds as one alternative of an `OR`. */
function allOf(terms: readonly string[]): string {
  return terms.length === 1 ? terms[0] : `(${terms.join(" ")})`;
}

/**
 * The Scryfall term for one card test. Scryfall's `t:` reads every face of a
 * double-faced card where the table reads the front face (CR 712.8a), so a card
 * whose back face alone passes may show and then be reported by the deck.
 */
function cardTestTerm(test: RulebreakerCardTest): string {
  switch (test.kind) {
    case "subtype":
      return `t:${test.subtype.toLowerCase()}`;
    case "card-types":
      return allOf(test.allOf.map((type) => `t:${type.toLowerCase()}`));
    case "creature-mana-value-at-least":
      return allOf(["t:creature", `mv>=${test.manaValue}`]);
    default: {
      const unreachable: never = test;
      return unreachable;
    }
  }
}

/** The cards one exception admits whatever their identity, as Scryfall terms. */
function admittedTerms(exception: RulebreakerException): readonly string[] {
  switch (exception.kind) {
    case "ignore-identity-for":
      return exception.anyOf.map(cardTestTerm);
    case "any-land":
      return ["t:land"];
    // CR 205.4a: "basic" is a supertype; Scryfall's `t:basic` finds it.
    case "any-basic-land":
      return ["t:basic"];
    // Tolabow: the deck stores no chosen colour, so nothing is widened for it.
    case "chosen-colour-for":
    case "no-maximum-deck-size":
      return [];
    default: {
      const unreachable: never = exception;
      return unreachable;
    }
  }
}

/**
 * The deck's identity clause: `id<=` its colours, or, under a rulebreaker
 * commander, that clause `OR` each kind of card its exceptions admit
 * (CR 903.5e). Legality is not touched (CR 113.6n); the caller adds it.
 *
 * @param colors - The command zone's colour letters in WUBRG order, or "c" for
 *   a colourless commander
 * @param exceptions - From the rulebreaker table; empty for any other commander
 * @returns `id<=WB`, or `(id<=WB OR t:angel OR t:basic)` under Seluma
 */
export function identityScopeClause(
  colors: string,
  exceptions: readonly RulebreakerException[]
): string {
  const identity = `id<=${colors}`;
  const admitted = [...new Set(exceptions.flatMap(admittedTerms))];
  if (admitted.length === 0) return identity;
  return `(${[identity, ...admitted].join(" OR ")})`;
}
