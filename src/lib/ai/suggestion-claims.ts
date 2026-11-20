/**
 * Typed claims on an AI suggestion: a model's sentence is reasoned, and a
 * fact read from card data is checked.
 *
 * AI copilot, pure. I-02 slice 1 types every statement at the API boundary
 * before any panel renders it. A checked claim names the list that verified
 * it and the instant that list was read; a reasoned claim is the model's
 * text and carries neither. No network or database call happens here.
 * Not responsible for: drawing the tags (I-02 slice 2) or the verdict panel
 * (I-02 slice 3).
 *
 * @module ai/suggestion-claims
 */
import {
  commanderNameExceptions,
  isOutsideDeckIdentity,
} from "@/lib/deck/color-identity";
import { priceUsdOf } from "@/lib/scryfall/price";
import { isBasicLand } from "@/lib/scryfall/type-line";
import type { ScryfallCard } from "@/lib/scryfall/types";

/**
 * What verified a checked claim (I-02 requirement 1.2).
 *
 * Scryfall card data covers mana value, price and a legality that is not a
 * ban. The format banlist covers a ban. The colour-identity rule is CR
 * 903.5c, with a rulebreaker's exceptions (CR 903.5e). The Game Changers
 * list is Scryfall's `game_changer` flag. The singleton rule is CR 903.5b.
 */
export const CLAIM_SOURCES = [
  "scryfall-card-data",
  "format-banlist",
  "colour-identity-rule",
  "game-changers-list",
  "singleton-rule",
] as const;

/** One source from {@link CLAIM_SOURCES}. */
export type ClaimSource = (typeof CLAIM_SOURCES)[number];

/** A fact a list verified, with the instant that list was read. */
export interface CheckedClaim {
  readonly kind: "checked";
  readonly text: string;
  readonly source: ClaimSource;
  readonly observedAt: string;
}

/** The model's own sentence. It names no source and no observation time. */
export interface ReasonedClaim {
  readonly kind: "reasoned";
  readonly text: string;
}

/** One statement attached to a suggestion. */
export type CopilotClaim = CheckedClaim | ReasonedClaim;

/** The model's sentence on a suggestion or an alternative. */
export interface SuggestionClaimInput {
  readonly reason: string;
}

/**
 * The deck a suggestion is checked against, and when the card data was read.
 *
 * `observedAt` is UTC, `YYYY-MM-DDTHH:mm:ss.sssZ`. A missing or other value
 * yields no checked claim: a check with no observation time is not a check.
 */
export interface SuggestionClaimContext {
  readonly observedAt: string;
  readonly deckColors: readonly string[];
  readonly commandZoneNames: readonly string[];
  readonly deckCardNames: readonly string[];
}

const CLAIM_SOURCE_SET: ReadonlySet<string> = new Set(CLAIM_SOURCES);

/** UTC instant with a seconds field and a trailing `Z`. */
const OBSERVED_AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

/** Whether `value` is one of {@link CLAIM_SOURCES}. */
export function isClaimSource(value: string): value is ClaimSource {
  return CLAIM_SOURCE_SET.has(value);
}

/**
 * Whether `value` is a UTC instant the claim contract accepts.
 *
 * Seconds are required and the zone is `Z`, so a date-only string or a
 * local offset cannot stand in for an observation time.
 *
 * @param value - a candidate observation time
 * @returns true for `2026-11-20T11:00:00.000Z` and the same instant without milliseconds
 */
export function isObservationInstant(value: string): boolean {
  return OBSERVED_AT.test(value);
}

function checked(
  text: string,
  source: ClaimSource,
  observedAt: string
): CheckedClaim {
  return { kind: "checked", text, source, observedAt };
}

/**
 * The statements on one suggestion.
 *
 * The model's reason, when it has text, is one reasoned claim, kept whole
 * even if it cites a rule number. Checked claims are added only for a card
 * that was found and only when `observedAt` is a UTC instant. An unknown
 * price, legality or Game Changer flag is left out rather than stated as a
 * fact. A singleton claim is made only when the deck already contains the
 * card (CR 903.5b).
 *
 * @param suggestion - the model's reason for the card
 * @param card - the Scryfall card, absent when the lookup did not find it
 * @param context - the deck and the instant the card data was read
 * @returns reasoned claims first, then checked claims, in a stable order
 */
export function suggestionClaims(
  suggestion: SuggestionClaimInput,
  card: ScryfallCard | undefined,
  context: SuggestionClaimContext
): readonly CopilotClaim[] {
  const reasoned = reasonedClaim(suggestion.reason);
  if (!card || !isObservationInstant(context.observedAt)) {
    return reasoned === undefined ? [] : [reasoned];
  }
  const checkedClaims = checkedClaimsFor(card, context);
  return reasoned === undefined ? checkedClaims : [reasoned, ...checkedClaims];
}

function reasonedClaim(reason: string): ReasonedClaim | undefined {
  if (reason.trim().length === 0) return undefined;
  return { kind: "reasoned", text: reason };
}

function checkedClaimsFor(
  card: ScryfallCard,
  context: SuggestionClaimContext
): readonly CheckedClaim[] {
  const { observedAt } = context;
  const claims: CheckedClaim[] = [
    checked(`Mana value ${card.cmc}`, "scryfall-card-data", observedAt),
  ];
  const price = priceUsdOf(card);
  if (price !== null) {
    claims.push(
      checked(`Price ${price} USD`, "scryfall-card-data", observedAt)
    );
  }
  const legality = legalityClaim(card, observedAt);
  if (legality) claims.push(legality);
  claims.push(colourClaim(card, context));
  const gameChanger = gameChangerClaim(card, observedAt);
  if (gameChanger) claims.push(gameChanger);
  const singleton = singletonClaim(card, context);
  if (singleton) claims.push(singleton);
  return claims;
}

function legalityClaim(
  card: ScryfallCard,
  observedAt: string
): CheckedClaim | undefined {
  const legality = card.legalities?.commander;
  if (legality === undefined) return undefined;
  if (legality === "banned") {
    return checked("Banned in Commander", "format-banlist", observedAt);
  }
  if (legality === "legal") {
    return checked("Legal in Commander", "scryfall-card-data", observedAt);
  }
  return checked("Not legal in Commander", "scryfall-card-data", observedAt);
}

function colourClaim(
  card: ScryfallCard,
  context: SuggestionClaimContext
): CheckedClaim {
  const outside = isOutsideDeckIdentity(
    {
      colors: new Set(context.deckColors),
      exceptions: commanderNameExceptions(context.commandZoneNames),
    },
    {
      colorIdentity: card.color_identity,
      typeLine: card.type_line,
      cmc: card.cmc,
    }
  );
  return checked(
    outside
      ? "Outside the commander's colour identity"
      : "Inside the commander's colour identity",
    "colour-identity-rule",
    context.observedAt
  );
}

function gameChangerClaim(
  card: ScryfallCard,
  observedAt: string
): CheckedClaim | undefined {
  if (card.game_changer === undefined) return undefined;
  return checked(
    card.game_changer
      ? "On the Game Changers list"
      : "Not on the Game Changers list",
    "game-changers-list",
    observedAt
  );
}

/**
 * A copy the deck already holds, judged by CR 903.5b.
 *
 * Names are compared without regard to letter case. A card the deck does not
 * already contain gets no claim: there is no copy to count.
 */
function singletonClaim(
  card: ScryfallCard,
  context: SuggestionClaimContext
): CheckedClaim | undefined {
  const names = new Set(
    context.deckCardNames.map((name) => name.toLowerCase())
  );
  if (!names.has(card.name.toLowerCase())) return undefined;
  const text = isBasicLand(card.type_line)
    ? "Already in the deck; a basic land may be repeated"
    : "Already in the deck; Commander allows one copy of a card that is not a basic land";
  return checked(text, "singleton-rule", context.observedAt);
}

/**
 * Attaches claims to every suggestion and to each of its alternatives.
 *
 * A card is matched by its name without regard to letter case, as the
 * evidence lookup is. An alternative is checked on its own reason. Every
 * other field is kept.
 *
 * @param suggestions - suggestions that already carry their evidence
 * @param cards - the Scryfall cards found for those names; empty when the lookup failed
 * @param context - the deck and the instant the card data was read
 * @returns the same suggestions, each with a `claims` list
 */
export function withSuggestionClaims<
  A extends SuggestionClaimInput & { readonly name: string },
  S extends SuggestionClaimInput & {
    readonly name: string;
    readonly alternatives?: readonly A[];
  },
>(
  suggestions: readonly S[],
  cards: readonly ScryfallCard[],
  context: SuggestionClaimContext
): (Omit<S, "alternatives"> & {
  readonly claims: readonly CopilotClaim[];
  readonly alternatives?: (A & { readonly claims: readonly CopilotClaim[] })[];
})[] {
  const cardsByName = new Map(
    cards.map((card) => [card.name.toLowerCase(), card])
  );
  const cardNamed = (name: string) => cardsByName.get(name.toLowerCase());

  return suggestions.map((suggestion) => ({
    ...suggestion,
    claims: suggestionClaims(suggestion, cardNamed(suggestion.name), context),
    alternatives: suggestion.alternatives?.map((alternative) => ({
      ...alternative,
      claims: suggestionClaims(
        alternative,
        cardNamed(alternative.name),
        context
      ),
    })),
  }));
}
