/**
 * The cards of a list that fall under two official bracket restrictions, mass
 * land denial and extra turns, found by our Oracle-text rules (I-77 slice 3,
 * `docs/product/specs/i77-a-bracket-estimate-players-can-audit.md`).
 *
 * Wizards defines mass land denial as cards that "regularly destroy, exile,
 * and bounce other lands, keep lands tapped, or change what mana is produced
 * by four or more lands per player without replacing them" (Commander
 * Brackets beta, read 2026-11-24 from
 * https://magic.wizards.com/en/news/announcements/commander-brackets-beta-update-october-21-2025).
 * The rules below match the printed wordings of those effects, so a count is
 * an estimate (I-77 3.1): a card worded otherwise is missed, and the rules
 * name no card.
 *
 * Pure: reads Oracle text only. Not responsible for the floor a count sets
 * (`restrictionFloor`) or for whether extra turns are chained, which no list
 * shows.
 *
 * @module deck/bracket-restriction-cards
 */
import { sortedUniqueNames } from "./sorted-unique-names";
import type { DeckCard } from "./types";

/**
 * Mass land denial wordings, matched on lower-cased Oracle text, one
 * sentence at a time where the effect is a sentence:
 * - every land, or every nonbasic land, destroyed, exiled or bounced
 *   (Armageddon, Ruination, Jokulhaups, Sunder);
 * - each player sacrificing several lands, a count Oracle text spells as a
 *   word or X (Wildfire, Tectonic Break), or all but one land (Cataclysm,
 *   Global Ruin);
 * - lands kept tapped (Hokori, Back to Basics, Winter Orb);
 * - nonbasic lands turned into one basic type (Blood Moon).
 */
const MASS_LAND_DENIAL_PATTERNS: readonly RegExp[] = [
  /\b(?:destroy|exile) all [^.]*\blands\b/,
  /\breturn all lands\b/,
  /\beach player sacrifices (?:x|two|three|four|five|six|seven) lands\b/,
  /\ba land\b[^.]*\bthen sacrifices the rest\b/,
  /\blands don't untap during their controllers' untap steps\b/,
  /\bcan't untap more than (?:one|two) lands?\b/,
  /\bnonbasic lands are (?:plains|islands|swamps|mountains|forests)\b/,
];

/**
 * Extra-turn wordings: a player taking one or more extra turns (Time Warp,
 * Time Stretch). An effect that stops extra turns (Stranglehold: "would
 * begin an extra turn") does not match.
 */
const EXTRA_TURN_PATTERNS: readonly RegExp[] = [
  /\btakes? (?:an|two|three) extra turns?\b/,
];

function cardsMatching(
  cards: readonly DeckCard[],
  patterns: readonly RegExp[]
): string[] {
  return sortedUniqueNames(
    cards
      .filter((card) => {
        const text = card.oracleText.toLowerCase();
        return patterns.some((pattern) => pattern.test(text));
      })
      .map((card) => card.name)
  );
}

/**
 * Names the mass land denial cards among these rows.
 *
 * @param cards - the rows to read; the caller picks the zones
 * @returns each matching card name once, in name order
 */
export function massLandDenialCards(cards: readonly DeckCard[]): string[] {
  return cardsMatching(cards, MASS_LAND_DENIAL_PATTERNS);
}

/**
 * Names the cards among these rows that give a player extra turns.
 *
 * @param cards - the rows to read; the caller picks the zones
 * @returns each matching card name once, in name order
 */
export function extraTurnCards(cards: readonly DeckCard[]): string[] {
  return cardsMatching(cards, EXTRA_TURN_PATTERNS);
}
