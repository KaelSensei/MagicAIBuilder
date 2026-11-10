/**
 * Deterministic rules check: main-deck cards whose rules text cannot work with
 * this deck's commander.
 *
 * Reads only stored Oracle text and color identity, never a model. A finding is
 * a rules fact, so each pattern is narrow: a missed card is preferable to a
 * false alarm in a check players are asked to trust.
 */
import type { DeckFormat } from "./formats";
import { PIP_COLORS } from "./mana-alignment";
import type { Deck, DeckCard } from "./types";

/** One kind of finding; each maps to its citation and a localized reason. */
export type CommanderRuleId = "colorless-identity-mana";

/** A main-deck card that cannot work with the deck's commander. */
export interface CommanderRuleIssue {
  readonly cardId: string;
  readonly cardName: string;
  readonly rule: CommanderRuleId;
}

/**
 * Comprehensive Rules sections behind each finding.
 *
 * `colorless-identity-mana`: a commander's color identity holds only the colors
 * of its mana symbols, color indicator and characteristic-defining abilities
 * (CR 903.4), so a colorless commander's identity has no color to choose. An
 * ability that would add mana of an undefined type adds none (CR 106.5). The
 * Gatherer rulings of 2020-11-10 on Arcane Signet, Command Tower and Path of
 * Ancestry say so directly: "It doesn't produce {C}."
 */
export const COMMANDER_RULE_CITATIONS: Readonly<
  Record<CommanderRuleId, readonly string[]>
> = {
  "colorless-identity-mana": ["903.4", "106.5"],
};

/**
 * Formats played under CR 903: Commander and its Brawl option (CR 903.12).
 * Oathbreaker is not in the Comprehensive Rules, so it is not checked.
 */
const CR_903_FORMATS: ReadonlySet<DeckFormat> = new Set<DeckFormat>([
  "commander",
  "brawl",
]);

const COLORS: ReadonlySet<string> = new Set<string>(PIP_COLORS);

/**
 * CR 903.4b: a commander that has its color chosen before the game (The
 * Prismatic Piper, Clara Oswald, Faceless One) has an identity that the stored
 * card data cannot show, so the deck's identity is unknown.
 */
const PREGAME_COLOR_CHOICE = /choose a color before the game begins/i;

/** A mana symbol with a color in it: `{W}`, `{U/B}`, `{2/R}`, `{G/P}` (CR 903.4). */
const COLORED_MANA_SYMBOL = /\{[^}WUBRG]*[WUBRG]/;

/**
 * The commander-identity mana ability, optionally followed by a rider that
 * only happens when that mana is spent (Path of Ancestry's scry).
 */
const IDENTITY_MANA_ABILITY =
  /^\{T\}: Add one mana of any color in your commander's color identity\.(?: When that mana is spent to [^.]+\.)?$/;

/** Reminder text has no game function (CR 207.2a). */
const REMINDER_TEXT = /\([^()]*\)/g;

/** Splits stored text into lines, and stored `Front // Back` text into faces. */
const LINE_OR_FACE_BREAK = /\n| \/\/ /;

/**
 * Every rules-text line of a card, across both faces, without reminder text.
 *
 * @param card - deck card as stored
 * @returns non-empty lines with typographic apostrophes made plain
 */
function rulesTextLines(card: DeckCard): readonly string[] {
  const texts = [
    card.oracleText,
    ...(card.cardFaces?.map((face) => face.oracleText) ?? []),
  ];
  return texts
    .flatMap((text) => text.split(LINE_OR_FACE_BREAK))
    .map((line) => line.replaceAll("’", "'").replace(REMINDER_TEXT, "").trim())
    .filter((line) => line.length > 0);
}

/**
 * The "enters tapped" lines a land may carry, in current and pre-2024 Oracle wording.
 *
 * @param card - deck card as stored
 * @returns the exact lines accepted
 */
function entersTappedLines(card: DeckCard): ReadonlySet<string> {
  const names = [
    card.name,
    ...(card.cardFaces?.map((face) => face.name) ?? []),
  ];
  return new Set([
    "This land enters tapped.",
    ...names.flatMap((name) => [
      `${name} enters tapped.`,
      `${name} enters the battlefield tapped.`,
    ]),
  ]);
}

/**
 * Whether the card's only ability is the commander-identity mana ability,
 * apart from entering tapped.
 *
 * @param card - deck card as stored
 * @returns true for Arcane Signet, Command Tower and Path of Ancestry
 */
function onlyAddsCommanderIdentityMana(card: DeckCard): boolean {
  const tappedLines = entersTappedLines(card);
  let addsIdentityMana = false;
  for (const line of rulesTextLines(card)) {
    if (IDENTITY_MANA_ABILITY.test(line)) addsIdentityMana = true;
    else if (!tappedLines.has(line)) return false;
  }
  return addsIdentityMana;
}

/**
 * Whether a commander may contribute a color to the deck's identity.
 *
 * Besides the stored identity, a colored mana symbol in the cost or rules text
 * counts, so a card saved without its identity is never taken as colorless.
 *
 * @param commander - the commander or second commander
 * @returns true when a color is stored, printed, or chosen before the game
 */
function mayHaveColor(commander: DeckCard): boolean {
  const costs = [
    commander.manaCost,
    ...(commander.cardFaces?.map((face) => face.manaCost) ?? []),
  ];
  return (
    commander.colorIdentity.some((color) => COLORS.has(color)) ||
    costs.some((cost) => COLORED_MANA_SYMBOL.test(cost)) ||
    rulesTextLines(commander).some(
      (line) =>
        COLORED_MANA_SYMBOL.test(line) || PREGAME_COLOR_CHOICE.test(line)
    )
  );
}

/**
 * Find main-deck cards that cannot work with this deck's commander.
 *
 * @param deck - deck with its commander, optional second commander and cards
 * @returns one issue per affected card row, ordered by card name then id
 */
export function getCommanderRuleIssues(
  deck: Deck
): readonly CommanderRuleIssue[] {
  if (!CR_903_FORMATS.has(deck.format) || !deck.commander) return [];
  const commanders = deck.partner
    ? [deck.commander, deck.partner]
    : [deck.commander];
  // CR 702.124c: two commanders share one combined identity.
  if (commanders.some(mayHaveColor)) return [];

  return deck.cards
    .filter(
      (card) => card.zone === "main" && onlyAddsCommanderIdentityMana(card)
    )
    .map((card): CommanderRuleIssue => ({
      cardId: card.id,
      cardName: card.name,
      rule: "colorless-identity-mana",
    }))
    .toSorted(
      (left, right) =>
        left.cardName.localeCompare(right.cardName, "en") ||
        left.cardId.localeCompare(right.cardId, "en")
    );
}
