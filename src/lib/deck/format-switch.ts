/**
 * What a deck would break under another format, read before a format switch
 * is saved (I-42 requirement 4.2: switching re-validates at once, lists what
 * breaks and removes no card).
 *
 * Format-rules context (still under `lib/deck`, see architecture.md); read by
 * the deck settings' format picker. Each check is the one the editor already
 * runs on the deck's own format, run on the target format instead: the size
 * rule (`deck-size.ts`), the copy limit (`multiples.ts`), the colour identity
 * (`color-identity.ts`) and the ban list the builder loads for a format. It
 * reports and never refuses (ADR 0009).
 *
 * Not responsible for: card-pool legality (a card never printed in a format's
 * sets), which the server's legality check owns (I-42 slice 2).
 *
 * @module deck/format-switch
 */
import {
  deckSizeStatus,
  type DeckSizeRule,
  type DeckSizeStatus,
} from "@/modules/format-rules";
import {
  commandZoneExceptions,
  getColorIdentityViolations,
} from "./color-identity";
import { countDeckCards, deckSizeRuleOf, formatDeckSize } from "./deck-size";
import { getFormatConfig, type DeckFormat } from "./formats";
import { deckCopyLimit } from "./multiples";
import type { Deck, DeckCard } from "./types";

/** The deck's size against the target format's size rule. */
export interface FormatSwitchSize {
  /** The cards the deck holds, its command zone included (`countDeckCards`) */
  readonly cardCount: number;
  /** The target format's size rule, with the commander's exceptions applied */
  readonly rule: DeckSizeRule;
  readonly status: DeckSizeStatus;
}

/** A card the deck holds more copies of than the target format allows. */
export interface CopyLimitBreach {
  readonly name: string;
  /** Copies across the main deck and the sideboard */
  readonly copies: number;
  readonly limit: number;
}

/** Everything the editor would report once the deck is in the target format. */
export interface FormatSwitchReport {
  readonly size: FormatSwitchSize;
  readonly overCopyLimit: readonly CopyLimitBreach[];
  /** Main-deck cards outside the commander's identity; empty where identity does not apply */
  readonly outsideColorIdentity: readonly string[];
  /** Command-zone and main-deck cards on the target format's ban list */
  readonly banned: readonly string[];
}

/**
 * Checks `deck` against `target` without changing it.
 *
 * @param deck - The deck as the store holds it
 * @param target - The format the player is about to switch to
 * @param bannedNames - The target format's ban list, by card name; an empty
 *   set while the list is not known
 * @returns The problems the editor would report under `target`
 */
export function formatSwitchReport(
  deck: Deck,
  target: DeckFormat,
  bannedNames: ReadonlySet<string>
): FormatSwitchReport {
  return {
    size: sizeUnder(deck, target),
    overCopyLimit: copyLimitBreaches(deck, target),
    outsideColorIdentity: outsideColorIdentity(deck, target),
    banned: bannedCards(deck, bannedNames),
  };
}

/** The size rule every deck counter reads, taken from the target format. */
function sizeUnder(deck: Deck, target: DeckFormat): FormatSwitchSize {
  const cardCount = countDeckCards(deck);
  const rule = deckSizeRuleOf(deck, formatDeckSize(target));
  return { cardCount, rule, status: deckSizeStatus(cardCount, rule) };
}

/**
 * The cards over the target's copy limit. CR 100.2a counts the copies of a
 * card across the deck and its sideboard together, so rows that share a name
 * (two printings) add up; the maybeboard is not part of the deck.
 */
function copyLimitBreaches(
  deck: Deck,
  target: DeckFormat
): readonly CopyLimitBreach[] {
  const exceptions = commandZoneExceptions(deck);
  return [...copiesByName(deck.cards).values()].flatMap(({ card, copies }) => {
    const limit = deckCopyLimit(card, { format: target, exceptions });
    return copies > limit ? [{ name: card.name, copies, limit }] : [];
  });
}

/** The copies of each card name in the main deck and the sideboard, in deck order. */
function copiesByName(
  cards: readonly DeckCard[]
): ReadonlyMap<string, { readonly card: DeckCard; readonly copies: number }> {
  const byName = new Map<string, { card: DeckCard; copies: number }>();
  for (const card of cards) {
    if (card.zone === "maybeboard") continue;
    const held = byName.get(card.name);
    byName.set(card.name, {
      card: held?.card ?? card,
      copies: (held?.copies ?? 0) + card.quantity,
    });
  }
  return byName;
}

/**
 * The identity violations, where the target format has a colour identity rule
 * (CR 903.5c; Brawl, CR 903.12, keeps Commander's deck rules, and so does
 * Oathbreaker); the constructed formats have none.
 */
function outsideColorIdentity(
  deck: Deck,
  target: DeckFormat
): readonly string[] {
  if (!getFormatConfig(target).hasColorIdentity) return [];
  const names = getColorIdentityViolations(deck).map(
    ({ cardName }) => cardName
  );
  return [...new Set(names)];
}

/** The cards the editor's banned count reads: the command zone and the main deck. */
function bannedCards(
  deck: Deck,
  bannedNames: ReadonlySet<string>
): readonly string[] {
  const read = [
    deck.commander,
    deck.partner,
    ...deck.cards.filter((card) => card.zone === "main"),
  ];
  const names = read.flatMap((card) =>
    card && bannedNames.has(card.name) ? [card.name] : []
  );
  return [...new Set(names)];
}
