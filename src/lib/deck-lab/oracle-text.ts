/**
 * Reads the mana facts Deck Lab needs from a card's English Oracle text, as Scryfall prints it:
 * its mana ability, whether it enters tapped, the lands it searches for and the cards it draws.
 *
 * Context: deck analysis, Deck Lab (I-31 requirement 2.1). These are heuristics on the stored
 * text, because Scryfall's `produced_mana` is not stored (see `lib/deck/mana-alignment.ts`). A
 * card they misread falls back to a spell or gets a wrong field, and the player can override it
 * (requirement 2.2). They read sentence templates, never card names.
 *
 * Not responsible for: choosing the card's kind (`classify-card.ts`).
 *
 * @module deck-lab/oracle-text
 */
import { PIP_COLORS, type PipColor } from "@/lib/deck/mana-alignment";

import type { BasicLandType, FetchTarget, ManaProduced } from "./types";

/** The basic land types (CR 305.6), in WUBRG order, with the colour each one taps for. */
const BASIC_LAND_TYPES: ReadonlyMap<BasicLandType, PipColor> = new Map([
  ["Plains", "W"],
  ["Island", "U"],
  ["Swamp", "B"],
  ["Mountain", "R"],
  ["Forest", "G"],
]);

/** Number words as Oracle text spells them, for amounts of mana, lands and cards. */
const NUMBER_WORDS: ReadonlyMap<string, number> = new Map([
  ["a", 1],
  ["an", 1],
  ["one", 1],
  ["two", 2],
  ["three", 3],
  ["four", 4],
  ["five", 5],
  ["six", 6],
  ["seven", 7],
]);

/** What a mana ability makes, before the card's kind is known. */
export interface ManaAbility {
  readonly produces: ManaProduced;
  readonly dependsOnOpponents: boolean;
  /** Mana added per activation, net of the generic mana the activation costs. */
  readonly out: number;
  /** True when the activation pays generic mana, as a Signet's "{1}, {T}" does: a filter. */
  readonly filters: boolean;
}

/** How a land enters the battlefield. */
export type EntryRule = "untapped" | "tapped" | "conditionally-tapped";

/** The lands a fetch or a land-ramp spell searches for. */
export interface LandSearch {
  readonly targets: readonly FetchTarget[];
  /** How many lands it finds: "up to two basic land cards" finds two. */
  readonly count: number;
  /** True when the lands found enter tapped. */
  readonly foundTapped: boolean;
}

const MANA_ABILITY_SEPARATOR = ": Add ";

/**
 * The text's lines without reminder text. Reminder text has no rules meaning (CR 207.2), and it
 * can quote another object's ability, as Treasure Map's "(They're artifacts with "{T}, Sacrifice
 * this token: Add one mana of any color.")" does. A basic land's "({T}: Add {G}.)" is read from
 * its land type instead (CR 305.6, in `land-rules.ts`).
 */
function oracleLines(oracleText: string): readonly string[] {
  return oracleText.replaceAll(/\([^)]*\)/g, "").split("\n");
}

/** A number word or numeral, or `undefined` when the word is neither. */
function numberOf(word: string): number | undefined {
  if (/^\d+$/.test(word)) return Number(word);
  return NUMBER_WORDS.get(word.toLowerCase());
}

/** The mana symbols of a text, such as `{W}` and `{1}`, without their braces. */
function manaSymbols(text: string): readonly string[] {
  return text
    .split("{")
    .slice(1)
    .map((part) => part.slice(0, part.indexOf("}")));
}

/**
 * Colours made by a mana ability whose colours are named by a rule rather than by symbols.
 * "Any color in your commander's color identity" is the identity (CR 903.4). A card that makes
 * "any color that a land an opponent controls could produce" defaults to the identity with the
 * "depends on opponents" flag (I-31 requirement 2.4).
 *
 * @param text - the card's Oracle text, or the effect of one mana ability
 * @returns what it makes, or `undefined` when its colours are written as symbols
 */
export function namedColourRule(
  text: string
): Pick<ManaAbility, "produces" | "dependsOnOpponents"> | undefined {
  const lower = text.toLowerCase();
  if (lower.includes("commander's color identity"))
    return { produces: { kind: "identity" }, dependsOnOpponents: false };
  if (lower.includes("an opponent controls could produce"))
    return { produces: { kind: "identity" }, dependsOnOpponents: true };
  if (lower.includes("any color"))
    return { produces: { kind: "any" }, dependsOnOpponents: false };
  return undefined;
}

/** The colours whose symbols an effect names, in WUBRG order. */
function symbolColours(effect: string): readonly PipColor[] {
  const symbols = new Set(manaSymbols(effect));
  return PIP_COLORS.filter((colour) => symbols.has(colour));
}

/** Mana one activation adds: "one mana", "{W} or {U}" and "{C}{C}" add 1, 1 and 2. */
function grossOut(effect: string): number {
  const [first = ""] = effect.split(" ", 1);
  const amount = numberOf(first);
  if (amount !== undefined && effect.includes(" mana")) return amount;
  if (effect.includes(" or ")) return 1;
  return manaSymbols(effect).length;
}

/** Generic mana an activation cost pays, such as the `{1}` of a Signet's "{1}, {T}". */
function genericPaid(cost: string): number {
  return manaSymbols(cost).reduce(
    (sum, symbol) => sum + (numberOf(symbol) ?? 0),
    0
  );
}

/**
 * The card's first tap mana ability ("{T}: Add …", or "{1}, {T}: Add …" for a filter such as a
 * Signet). Its net output subtracts the generic mana the activation pays, so a Signet nets one
 * mana for two, as the research model counts it.
 *
 * @param oracleText - the card's (or face's) Oracle text
 * @returns its mana ability, or `undefined` when it has no tap mana ability
 */
export function manaAbilityOf(oracleText: string): ManaAbility | undefined {
  for (const line of oracleLines(oracleText)) {
    const separator = line.indexOf(MANA_ABILITY_SEPARATOR);
    const cost = line.slice(0, Math.max(separator, 0));
    const isActivationCost = cost.includes("{T}") && !/[.:]/.test(cost);
    if (separator === -1 || !isActivationCost) continue;
    const effect =
      line.slice(separator + MANA_ABILITY_SEPARATOR.length).split(".", 1)[0] ??
      "";
    const named = namedColourRule(effect);
    const paid = genericPaid(cost);
    return {
      produces: named?.produces ?? {
        kind: "colours",
        colours: symbolColours(effect),
      },
      dependsOnOpponents: named?.dependsOnOpponents ?? false,
      out: Math.max(grossOut(effect) - paid, 0),
      filters: paid > 0,
    };
  }
  return undefined;
}

/**
 * How a land enters. "This land enters tapped." always taps it. A tapped entry the player can
 * avoid, "unless you control …" (a check land) or "you may pay 2 life. If you don't, it enters
 * tapped" (a shock land), is conditional: the goldfish meets the condition.
 *
 * @param oracleText - the land's (or land face's) Oracle text
 * @returns its entry rule
 */
export function entryRuleOf(oracleText: string): EntryRule {
  const sentences = oracleText.toLowerCase().split(/[.\n]/);
  const tappedEntry = sentences.find(
    (sentence) =>
      sentence.includes("enters tapped") ||
      sentence.includes("enters the battlefield tapped")
  );
  if (tappedEntry === undefined) return "untapped";
  const conditional =
    tappedEntry.includes("unless") || tappedEntry.trim().startsWith("if ");
  return conditional ? "conditionally-tapped" : "tapped";
}

/** The searched-for phrase: "a Plains or Island" in "Search your library for a Plains or Island card". */
function searchedPhrase(oracleText: string): string | undefined {
  const marker = "search your library for ";
  const start = oracleText.toLowerCase().indexOf(marker);
  if (start === -1) return undefined;
  const rest = oracleText.slice(start + marker.length);
  const end = rest.indexOf(" card");
  return end === -1 ? undefined : rest.slice(0, end);
}

/** The count a searched phrase opens with: "up to two basic land" finds two, "a Forest" one. */
function searchedCount(phrase: string): number {
  const words = phrase.split(" ");
  const countWord = words[0] === "up" ? (words[2] ?? "") : (words[0] ?? "");
  return numberOf(countWord) ?? 1;
}

/**
 * The lands a card searches its library for and puts onto the battlefield: a fetch land
 * ("Search your library for a Plains or Island card, put it onto the battlefield") or a
 * land-ramp spell (Cultivate). "A basic land card" is any basic; a named land type is a land
 * with that type, basic or not.
 *
 * @param oracleText - the card's Oracle text
 * @returns what it searches for, or `undefined` when it puts no land from the library onto the
 *   battlefield
 */
export function landSearchOf(oracleText: string): LandSearch | undefined {
  const phrase = searchedPhrase(oracleText);
  const lower = oracleText.toLowerCase();
  if (phrase === undefined || !lower.includes("onto the battlefield"))
    return undefined;
  const namedTypes = [...BASIC_LAND_TYPES.keys()].filter((type) =>
    phrase.includes(type)
  );
  const isBasic = phrase.toLowerCase().includes("basic land");
  if (!isBasic && namedTypes.length === 0) return undefined;
  return {
    targets: isBasic ? ["basic"] : namedTypes,
    count: searchedCount(phrase),
    foundTapped: lower.includes("onto the battlefield tapped"),
  };
}

/**
 * The colours of the lands a search can find: each named land type's colour, or the identity
 * for "a basic land", since a Commander deck's basics are of its identity (CR 903.5c).
 *
 * @param targets - what the search finds
 * @returns the colours it can bring
 */
export function searchedColours(targets: readonly FetchTarget[]): ManaProduced {
  const colours = new Set<PipColor | undefined>();
  for (const target of targets) {
    if (target === "basic") return { kind: "identity" };
    colours.add(BASIC_LAND_TYPES.get(target));
  }
  return {
    kind: "colours",
    colours: PIP_COLORS.filter((colour) => colours.has(colour)),
  };
}

/**
 * Cards drawn by the first "draw N cards" or "draw a card" in the text.
 *
 * @param oracleText - the card's Oracle text
 * @returns the number of cards, or `undefined` when it draws none
 */
export function cardsDrawnBy(oracleText: string): number | undefined {
  const match = /\bdraws? (\w+) cards?\b/i.exec(oracleText);
  return match?.[1] === undefined ? undefined : numberOf(match[1]);
}
