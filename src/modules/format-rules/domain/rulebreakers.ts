/**
 * The rulebreaker table: the commanders whose ability changes how their deck
 * is built, and the exceptions each one grants.
 *
 * Format-rules context, domain layer: pure data and functions shared by the
 * server and the browser, which report and never refuse (ADR 0009).
 * Rules (Comprehensive Rules effective 2026-11-06):
 * - CR 903.5e: "Some cards have abilities that modify the rules for deck
 *   construction and apply only if that card is designated as a deck's
 *   commander. These abilities function before the game begins." A
 *   rulebreaker in the 99, or anywhere but the command zone, grants nothing.
 * - CR 113.6n: such an ability "can't affect the format legality of a card";
 *   nothing here reads or changes legality or banned status.
 * Not responsible for: the colours a deck may hold (`color-identity.ts` in
 * `lib/deck` applies these exceptions) or which size a format sets.
 *
 * Each entry is derived from the card's Oracle text, recorded from Scryfall on
 * 2026-11-16 in `fixtures/rulebreaker-cards-v1.ts`; that test file checks
 * every entry against its text. A new rulebreaker card is a new entry and a
 * new table version.
 *
 * @module format-rules/rulebreakers
 */

/** The version of {@link RULEBREAKERS}; raise it with every entry added or changed. */
export const RULEBREAKERS_VERSION = 1;

/** Where the table's rules and Oracle texts were read. */
export const RULEBREAKERS_SOURCE = {
  /** Wizards' bulletin that added CR 903.5e and 113.6n */
  bulletin:
    "https://magic.wizards.com/en/news/announcements/mystery-booster-commander-edition-update-bulletin",
  /** The Scryfall query every entry's Oracle text was read from */
  oracleQuery: "https://api.scryfall.com/cards/search?q=o%3Arulebreaker",
  /** The day both were read */
  readOn: "2026-11-16",
} as const;

/**
 * A test on a card's front face (CR 712.8a: outside the game a double-faced
 * card has only its front face's characteristics).
 *
 * - `subtype`: the card has this subtype, such as "Angel" or "Aura" (CR 205.3).
 * - `card-types`: the card has every one of these card types, such as
 *   artifact and creature (CR 205.2a).
 * - `creature-mana-value-at-least`: a creature card whose mana value is at
 *   least `manaValue` (CR 202.3).
 */
export type RulebreakerCardTest =
  | { readonly kind: "subtype"; readonly subtype: string }
  | { readonly kind: "card-types"; readonly allOf: readonly string[] }
  | {
      readonly kind: "creature-mana-value-at-least";
      readonly manaValue: number;
    };

/**
 * One exception a rulebreaker grants to its deck's construction.
 *
 * - `ignore-identity-for`: a card that passes any of the tests may be of any
 *   colour identity (CR 903.5c lifted for it).
 * - `chosen-colour-for`: a card that passes any of the tests may add one colour
 *   of the player's choice. The deck stores no such choice, so this exception
 *   is recorded but never applied: those cards are reported as before.
 * - `any-land`: any land card, whatever its identity.
 * - `any-basic-land`: any basic land card, whatever its identity.
 * - `no-maximum-deck-size`: the deck has a minimum size but no maximum.
 */
export type RulebreakerException =
  | {
      readonly kind: "ignore-identity-for";
      readonly anyOf: readonly RulebreakerCardTest[];
    }
  | {
      readonly kind: "chosen-colour-for";
      readonly anyOf: readonly RulebreakerCardTest[];
    }
  | { readonly kind: "any-land" }
  | { readonly kind: "any-basic-land" }
  | { readonly kind: "no-maximum-deck-size" };

/** One rulebreaker commander and the exceptions its Oracle text grants. */
export interface Rulebreaker {
  /** Scryfall's Oracle id: the table's key */
  readonly oracleId: string;
  /** The card's Oracle name, exact */
  readonly name: string;
  /** The rule that makes the ability work before the game */
  readonly rule: "CR 903.5e";
  readonly exceptions: readonly RulebreakerException[];
}

const ANY_BASIC_LAND: RulebreakerException = { kind: "any-basic-land" };

/**
 * Every rulebreaker commander, from Mystery Booster Commander Edition (`mbc`,
 * 2026-10-19): Scryfall's `o:rulebreaker` returned these eight on 2026-11-16.
 */
export const RULEBREAKERS: readonly Rulebreaker[] = [
  {
    // "A deck with this commander can have any land cards."
    oracleId: "3f5db55a-8bae-4e97-86bd-f2a2dacf07a4",
    name: "Grizzlegom, Hurloon Hero",
    rule: "CR 903.5e",
    exceptions: [{ kind: "any-land" }],
  },
  {
    // "…can have creature cards with mana value 7 or greater of any color
    // identity and any basic land cards."
    oracleId: "214f4e0a-eba7-4a08-86b2-d490d6ae1048",
    name: "Maular, the Next Evolution",
    rule: "CR 903.5e",
    exceptions: [
      {
        kind: "ignore-identity-for",
        anyOf: [{ kind: "creature-mana-value-at-least", manaValue: 7 }],
      },
      ANY_BASIC_LAND,
    ],
  },
  {
    // "…can have Angel cards of any color identity and any basic land cards."
    oracleId: "dbbf6379-01b4-400d-a277-5887e6be1d0f",
    name: "Seluma, Light of Aysen",
    rule: "CR 903.5e",
    exceptions: [
      {
        kind: "ignore-identity-for",
        anyOf: [{ kind: "subtype", subtype: "Angel" }],
      },
      ANY_BASIC_LAND,
    ],
  },
  {
    // "…can have artifact creature and Equipment cards of any color identity
    // and any basic land cards."
    oracleId: "b8354ac6-5285-43dd-9ba5-93064def2e96",
    name: "The Everforger",
    rule: "CR 903.5e",
    exceptions: [
      {
        kind: "ignore-identity-for",
        anyOf: [
          { kind: "card-types", allOf: ["Artifact", "Creature"] },
          { kind: "subtype", subtype: "Equipment" },
        ],
      },
      ANY_BASIC_LAND,
    ],
  },
  {
    // "…can have Aura cards of any color identity and any basic land cards."
    oracleId: "c7ea2ce7-f684-44a2-94b2-d4aa7353f6fc",
    name: "The Unluckiest Planeswalker",
    rule: "CR 903.5e",
    exceptions: [
      {
        kind: "ignore-identity-for",
        anyOf: [{ kind: "subtype", subtype: "Aura" }],
      },
      ANY_BASIC_LAND,
    ],
  },
  {
    // "…the color identity of instant and sorcery cards in your deck can
    // include one color of your choice not in your commander's color identity,
    // and your deck can have any basic land cards."
    oracleId: "56d71eda-4037-45fb-9e98-1725147af6fc",
    name: "Tolabow, Loch Rascal",
    rule: "CR 903.5e",
    exceptions: [
      {
        kind: "chosen-colour-for",
        anyOf: [
          { kind: "card-types", allOf: ["Instant"] },
          { kind: "card-types", allOf: ["Sorcery"] },
        ],
      },
      ANY_BASIC_LAND,
    ],
  },
  {
    // "…can have Phyrexian cards of any color identity and any basic land cards."
    oracleId: "8023d419-8fd2-4b92-b6ea-f25fd67e6410",
    name: "Valko Indorian",
    rule: "CR 903.5e",
    exceptions: [
      {
        kind: "ignore-identity-for",
        anyOf: [{ kind: "subtype", subtype: "Phyrexian" }],
      },
      ANY_BASIC_LAND,
    ],
  },
  {
    // "A deck with this commander has no maximum deck size."
    oracleId: "73ba7ed0-0f08-4ba4-9f51-42c48f1b62ea",
    name: "Whtz, the Bibliophile",
    rule: "CR 903.5e",
    exceptions: [{ kind: "no-maximum-deck-size" }],
  },
];

const RULEBREAKERS_BY_ORACLE_ID: ReadonlyMap<string, Rulebreaker> = new Map(
  RULEBREAKERS.map((entry) => [entry.oracleId, entry])
);

const RULEBREAKERS_BY_NAME: ReadonlyMap<string, Rulebreaker> = new Map(
  RULEBREAKERS.map((entry) => [entry.name, entry])
);

/**
 * A card in a deck's command zone. A stored deck card has no Oracle id yet, so
 * it gives `null` and is found by its exact Oracle name instead.
 */
export interface CommandZoneCard {
  readonly oracleId: string | null;
  readonly name: string;
}

/** The characteristics of a card the exceptions test, read from its front face. */
export interface ConstructionCard {
  /** The type line; a double-faced card's "front // back" is read up to "//" */
  readonly typeLine: string;
  readonly manaValue: number;
}

/**
 * The table's entry for a command-zone card, or null when it is no
 * rulebreaker: by Oracle id when the card has one, else by its exact name.
 */
function rulebreakerFor(card: CommandZoneCard): Rulebreaker | null {
  if (card.oracleId !== null) {
    return RULEBREAKERS_BY_ORACLE_ID.get(card.oracleId) ?? null;
  }
  return RULEBREAKERS_BY_NAME.get(card.name) ?? null;
}

/**
 * Every exception the deck's commanders grant (CR 903.5e). Only the command
 * zone counts: a rulebreaker in the 99 grants nothing.
 *
 * @param commandZone - The commander and, with a partner ability, the second
 *   commander; never the companion or a card of the 99
 * @returns The exceptions, empty when no commander is a rulebreaker
 */
export function deckConstructionExceptions(
  commandZone: readonly CommandZoneCard[]
): readonly RulebreakerException[] {
  return commandZone.flatMap((card) => rulebreakerFor(card)?.exceptions ?? []);
}

/** A type line's words: card types and supertypes, then subtypes (CR 205.1a). */
interface TypeWords {
  readonly types: ReadonlySet<string>;
  readonly subtypes: ReadonlySet<string>;
}

function wordsOf(part: string): ReadonlySet<string> {
  return new Set(part.split(/\s+/).filter((word) => word.length > 0));
}

/** The front face's type words, split at the long dash (CR 205.1a, 712.8a). */
function frontTypeWordsOf(typeLine: string): TypeWords {
  const [front = ""] = typeLine.split("//");
  const [left = "", right = ""] = front.split("—");
  return { types: wordsOf(left), subtypes: wordsOf(right) };
}

function passes(
  test: RulebreakerCardTest,
  words: TypeWords,
  manaValue: number
): boolean {
  switch (test.kind) {
    case "subtype":
      return words.subtypes.has(test.subtype);
    case "card-types":
      return test.allOf.every((type) => words.types.has(type));
    case "creature-mana-value-at-least":
      return words.types.has("Creature") && manaValue >= test.manaValue;
    default: {
      const unreachable: never = test;
      return unreachable;
    }
  }
}

function allows(
  exception: RulebreakerException,
  words: TypeWords,
  manaValue: number
): boolean {
  switch (exception.kind) {
    case "ignore-identity-for":
      return exception.anyOf.some((test) => passes(test, words, manaValue));
    case "any-land":
      return words.types.has("Land");
    case "any-basic-land":
      return words.types.has("Basic") && words.types.has("Land");
    // Tolabow: the deck stores no chosen colour, so its instants and sorceries
    // are reported as before (follow-up: a deck field and an owner decision).
    case "chosen-colour-for":
    case "no-maximum-deck-size":
      return false;
    default: {
      const unreachable: never = exception;
      return unreachable;
    }
  }
}

/**
 * Whether one of `exceptions` lets `card` into the deck whatever its colour
 * identity (CR 903.5e). Legality and banned status are not read (CR 113.6n).
 *
 * @param card - The card's front-face type line and mana value
 * @param exceptions - From {@link deckConstructionExceptions}
 * @returns True when an exception admits the card regardless of identity
 */
export function isIdentityExempt(
  card: ConstructionCard,
  exceptions: readonly RulebreakerException[]
): boolean {
  if (exceptions.length === 0) return false;
  const words = frontTypeWordsOf(card.typeLine);
  return exceptions.some((exception) =>
    allows(exception, words, card.manaValue)
  );
}

/**
 * Whether `exceptions` lift the deck's maximum size (CR 903.5e; Whtz, the
 * Bibliophile). The minimum stays the format's.
 *
 * @param exceptions - From {@link deckConstructionExceptions}
 * @returns True when the deck has no maximum size
 */
export function liftsMaximumDeckSize(
  exceptions: readonly RulebreakerException[]
): boolean {
  return exceptions.some(({ kind }) => kind === "no-maximum-deck-size");
}
