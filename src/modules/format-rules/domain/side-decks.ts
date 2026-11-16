/**
 * The construction checks of a side deck: the planar, scheme or Attraction
 * deck a player brings beside a Commander deck (I-103 requirement 3).
 *
 * Format-rules context, domain layer: pure functions shared by the server and
 * the browser, which report and never refuse (ADR 0009).
 * Rules: CR 901.3 and 901.15a (planar deck), 904.3, 904.12 and 904.13 (scheme
 * deck), 717.2a (Attraction deck), and 100.7 for the Attractions that are not
 * legal in Commander, from the bundled Comprehensive Rules effective 2026-08-07.
 * Not responsible for: the Commander deck's own legality, which a side deck
 * never changes (CR 717.2), the side zones themselves (I-103 slice 1), or the
 * wording a screen shows for a failed rule.
 *
 * @module format-rules/side-decks
 */
import {
  isAttractionType,
  isPhenomenonType,
  isPlanarCardType,
  isSchemeType,
} from "@/modules/format-rules/domain/side-card-types";

/** The three side decks a Commander deck may hold (I-103 requirement 1.1). */
export type SideDeckKind = "planar" | "scheme" | "attraction";

/** The player counts a single communal planar deck is checked for (I-103). */
export type CommunalPlayerCount = 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * How a planar deck is played: one deck per player (CR 901.3), or a single
 * communal deck for the whole table (CR 901.15a), which changes its size.
 */
export type PlanarDeckOption =
  | { readonly kind: "none" }
  | { readonly kind: "singleCommunal"; readonly players: CommunalPlayerCount };

/**
 * How a scheme deck is played: plain Archenemy, Supervillain Rumble
 * (CR 904.12) or the Archenemy Commander option (CR 904.13). All three use the
 * construction rule of CR 904.3; the report repeats the declared option.
 */
export type SchemeDeckOption =
  | { readonly kind: "none" }
  | { readonly kind: "supervillainRumble" }
  | { readonly kind: "archenemyCommander" };

/** Any option a side deck may declare; an Attraction deck has none. */
export type SideDeckOption = PlanarDeckOption | SchemeDeckOption;

/** A card's Commander status, as Scryfall reports it. */
export type SideCardLegality = "legal" | "not_legal" | "restricted" | "banned";

/** One card line of a side deck. */
export interface SideDeckCard {
  /** The card's English name; CR 901.3, 904.3 and 717.2a count by it. */
  readonly name: string;
  /** Scryfall's type line, such as "Plane — Dominaria" or "Ongoing Scheme". */
  readonly typeLine: string;
  /** Copies of the card on this line, a positive integer. */
  readonly quantity: number;
  /**
   * The card's Commander status; only the Attraction deck reads it. Absent
   * when it was not stored, which makes that rule `unknown`, never `pass`.
   */
  readonly commanderLegality?: SideCardLegality;
}

/**
 * A side deck to check. Each kind carries only the options that belong to it,
 * so a scheme deck cannot declare a communal planar deck.
 */
export type SideDeck =
  | {
      readonly kind: "planar";
      readonly option: PlanarDeckOption;
      readonly cards: readonly SideDeckCard[];
    }
  | {
      readonly kind: "scheme";
      readonly option: SchemeDeckOption;
      readonly cards: readonly SideDeckCard[];
    }
  | { readonly kind: "attraction"; readonly cards: readonly SideDeckCard[] };

/**
 * Every rule a side deck is checked against. `attractionTypeOnly` is not in
 * the I-103 data model; it is the type gate of requirement 1.2 for the
 * Attraction deck, as `planarTypeOnly` and `schemeTypeOnly` are for theirs.
 */
export type SideRuleId =
  | "planarTypeOnly"
  | "planarMinTen"
  | "planarPhenomenaMaxTwo"
  | "planarDistinctNames"
  | "communalMinSize"
  | "communalPhenomenaMax"
  | "schemeTypeOnly"
  | "schemeMinTwenty"
  | "schemeMaxTwoCopies"
  | "attractionTypeOnly"
  | "attractionMinTen"
  | "attractionDistinctNames"
  | "attractionCommanderLegal";

/** A rule's outcome. `unknown` means the stored data cannot settle it. */
export type SideRuleVerdict = "pass" | "fail" | "unknown";

/**
 * The counts a rule compared: `actual` against a lower (`atLeast`) or upper
 * (`atMost`) `limit`, so a screen can say "8 of at least 10 cards". For a
 * name rule, `actual` is the most copies of any one name.
 */
export interface SideRuleDetail {
  readonly bound: "atLeast" | "atMost";
  readonly actual: number;
  readonly limit: number;
}

/** One rule of a side deck's report, with the CR rule it applies. */
export interface SideRuleResult {
  readonly ruleId: SideRuleId;
  /** The Comprehensive Rules number, such as "901.3". */
  readonly crRule: string;
  readonly verdict: SideRuleVerdict;
  /**
   * The names of the cards that broke the rule, or that left it `unknown`,
   * each once, in deck order; empty when the rule passed.
   */
  readonly cards: readonly string[];
  readonly detail: SideRuleDetail;
}

/** The report on one side deck: which deck and option, and every rule. */
export interface SideDeckReport {
  readonly kind: SideDeckKind;
  /** The declared option; `none` for an Attraction deck, which has none. */
  readonly option: SideDeckOption["kind"];
  readonly results: readonly SideRuleResult[];
}

/** CR 901.3: at least ten plane and/or phenomenon cards. */
const PLANAR_MIN_CARDS = 10;
/** CR 901.3: no more than two phenomenon cards. */
const PLANAR_MAX_PHENOMENA = 2;
/** CR 901.15a: at least forty cards, or ten per player if that is smaller. */
const COMMUNAL_MAX_MIN_CARDS = 40;
const COMMUNAL_CARDS_PER_PLAYER = 10;
/** CR 901.15a: no more phenomena than twice the number of players. */
const COMMUNAL_PHENOMENA_PER_PLAYER = 2;
/** CR 904.3: at least twenty scheme cards. */
const SCHEME_MIN_CARDS = 20;
/** CR 904.3: no more than two of any card with a particular English name. */
const SCHEME_MAX_COPIES = 2;
/** CR 717.2a: at least ten Attraction cards. */
const ATTRACTION_MIN_CARDS = 10;
/** CR 901.3, 901.15a and 717.2a: each card has a different English name. */
const DISTINCT_NAME_MAX_COPIES = 1;

/** The rule a result is for. */
interface RuleRef {
  readonly ruleId: SideRuleId;
  readonly crRule: string;
}

/** The total copies across card lines. */
function quantityOf(cards: readonly SideDeckCard[]): number {
  return cards.reduce((total, card) => total + card.quantity, 0);
}

/** Each name once, in deck order. */
function namesOf(cards: readonly SideDeckCard[]): readonly string[] {
  return [...new Set(cards.map((card) => card.name))];
}

/** A rule met when `actual` reaches `limit`. */
function minimumRule(
  rule: RuleRef,
  actual: number,
  limit: number
): SideRuleResult {
  return {
    ...rule,
    verdict: actual >= limit ? "pass" : "fail",
    cards: [],
    detail: { bound: "atLeast", actual, limit },
  };
}

/** A rule met while `actual` stays within `limit`; `concerned` names a failure. */
function maximumRule(
  rule: RuleRef,
  counts: { readonly actual: number; readonly limit: number },
  concerned: readonly string[]
): SideRuleResult {
  const fails = counts.actual > counts.limit;
  return {
    ...rule,
    verdict: fails ? "fail" : "pass",
    cards: fails ? concerned : [],
    detail: { bound: "atMost", ...counts },
  };
}

/** Fails every card that does not fit the deck; such cards count toward nothing. */
function typeOnlyRule(
  rule: RuleRef,
  offType: readonly SideDeckCard[]
): SideRuleResult {
  return maximumRule(
    rule,
    { actual: quantityOf(offType), limit: 0 },
    namesOf(offType)
  );
}

/** Fails any English name held more than `limit` times, across every line. */
function copiesRule(
  rule: RuleRef,
  cards: readonly SideDeckCard[],
  limit: number
): SideRuleResult {
  const copies = new Map<string, number>();
  for (const card of cards) {
    copies.set(card.name, (copies.get(card.name) ?? 0) + card.quantity);
  }
  const over = [...copies].filter(([, count]) => count > limit);
  return maximumRule(
    rule,
    { actual: Math.max(0, ...copies.values()), limit },
    over.map(([name]) => name)
  );
}

/**
 * Fails an Attraction Scryfall marks not legal or banned in Commander: the
 * acorn-stamped Unfinity cards CR 100.7 sets aside for casual play. A card
 * with no stored status makes the rule `unknown`.
 */
function commanderLegalRule(cards: readonly SideDeckCard[]): SideRuleResult {
  const rule: RuleRef = {
    ruleId: "attractionCommanderLegal",
    crRule: "100.7",
  };
  const illegal = cards.filter(
    (card) =>
      card.commanderLegality === "not_legal" ||
      card.commanderLegality === "banned"
  );
  const result = maximumRule(
    rule,
    { actual: quantityOf(illegal), limit: 0 },
    namesOf(illegal)
  );
  const unstored = cards.filter((card) => card.commanderLegality === undefined);
  if (result.verdict === "fail" || unstored.length === 0) {
    return result;
  }
  return { ...result, verdict: "unknown", cards: namesOf(unstored) };
}

/** Splits a deck into the cards whose type line fits its kind and the rest. */
function partition(
  cards: readonly SideDeckCard[],
  fits: (typeLine: string) => boolean
): {
  readonly fitting: readonly SideDeckCard[];
  readonly offType: readonly SideDeckCard[];
} {
  const fitting: SideDeckCard[] = [];
  const offType: SideDeckCard[] = [];
  for (const card of cards) {
    (fits(card.typeLine) ? fitting : offType).push(card);
  }
  return { fitting, offType };
}

/** CR 901.3, or CR 901.15a for a single communal planar deck. */
function planarRules(
  cards: readonly SideDeckCard[],
  option: PlanarDeckOption
): readonly SideRuleResult[] {
  const { fitting, offType } = partition(cards, isPlanarCardType);
  const phenomena = fitting.filter((card) => isPhenomenonType(card.typeLine));
  const size = quantityOf(fitting);
  const typeOnly = typeOnlyRule(
    { ruleId: "planarTypeOnly", crRule: "901.3" },
    offType
  );
  switch (option.kind) {
    case "none":
      return [
        typeOnly,
        minimumRule(
          { ruleId: "planarMinTen", crRule: "901.3" },
          size,
          PLANAR_MIN_CARDS
        ),
        maximumRule(
          { ruleId: "planarPhenomenaMaxTwo", crRule: "901.3" },
          { actual: quantityOf(phenomena), limit: PLANAR_MAX_PHENOMENA },
          namesOf(phenomena)
        ),
        copiesRule(
          { ruleId: "planarDistinctNames", crRule: "901.3" },
          cards,
          DISTINCT_NAME_MAX_COPIES
        ),
      ];
    case "singleCommunal":
      return [
        typeOnly,
        minimumRule(
          { ruleId: "communalMinSize", crRule: "901.15a" },
          size,
          Math.min(
            COMMUNAL_MAX_MIN_CARDS,
            COMMUNAL_CARDS_PER_PLAYER * option.players
          )
        ),
        maximumRule(
          { ruleId: "communalPhenomenaMax", crRule: "901.15a" },
          {
            actual: quantityOf(phenomena),
            limit: COMMUNAL_PHENOMENA_PER_PLAYER * option.players,
          },
          namesOf(phenomena)
        ),
        copiesRule(
          { ruleId: "planarDistinctNames", crRule: "901.15a" },
          cards,
          DISTINCT_NAME_MAX_COPIES
        ),
      ];
  }
  const unhandled: never = option;
  return unhandled;
}

/** CR 904.3, whichever option of CR 904.12 or 904.13 was declared. */
function schemeRules(
  cards: readonly SideDeckCard[]
): readonly SideRuleResult[] {
  const { fitting, offType } = partition(cards, isSchemeType);
  return [
    typeOnlyRule({ ruleId: "schemeTypeOnly", crRule: "904.3" }, offType),
    minimumRule(
      { ruleId: "schemeMinTwenty", crRule: "904.3" },
      quantityOf(fitting),
      SCHEME_MIN_CARDS
    ),
    copiesRule(
      { ruleId: "schemeMaxTwoCopies", crRule: "904.3" },
      cards,
      SCHEME_MAX_COPIES
    ),
  ];
}

/** CR 717.2a, and each card's Commander status (CR 100.7). */
function attractionRules(
  cards: readonly SideDeckCard[]
): readonly SideRuleResult[] {
  const { fitting, offType } = partition(cards, isAttractionType);
  return [
    typeOnlyRule({ ruleId: "attractionTypeOnly", crRule: "717.2a" }, offType),
    minimumRule(
      { ruleId: "attractionMinTen", crRule: "717.2a" },
      quantityOf(fitting),
      ATTRACTION_MIN_CARDS
    ),
    copiesRule(
      { ruleId: "attractionDistinctNames", crRule: "717.2a" },
      cards,
      DISTINCT_NAME_MAX_COPIES
    ),
    commanderLegalRule(cards),
  ];
}

/**
 * Checks a side deck against every construction rule of its kind and option.
 *
 * Pure and total: an empty deck gets a report, never an exception. A failed
 * rule is a report line, not a refusal, and it never touches the Commander
 * deck's legality badge (ADR 0009, I-103 requirement 3.5). Only the cards that
 * fit the kind count toward its minimum; the others fail the type rule.
 */
export function checkSideDeck(deck: SideDeck): SideDeckReport {
  switch (deck.kind) {
    case "planar":
      return {
        kind: deck.kind,
        option: deck.option.kind,
        results: planarRules(deck.cards, deck.option),
      };
    case "scheme":
      return {
        kind: deck.kind,
        option: deck.option.kind,
        results: schemeRules(deck.cards),
      };
    case "attraction":
      return {
        kind: deck.kind,
        option: "none",
        results: attractionRules(deck.cards),
      };
  }
  const unhandled: never = deck;
  return unhandled;
}
