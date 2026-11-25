/**
 * The game pieces a deck needs on the table beside its tokens, each with the deck's cards that
 * need it: designations, dungeons and the counters a player gets.
 *
 * Context: deck, a pure policy. `TokenLibraryPanel` lists the result beside the token library
 * and adds it to the copied and downloaded checklist. The playtest's `designations.ts` names the
 * same pieces; this module reads them from Oracle text, the playtest never does.
 * Rules (MagicCompRules-20260807.txt): a card needs a piece when its Oracle text, reminder text
 * removed, names it. A card that only hands the piece to an opponent still needs it, since the
 * piece must be on the table either way.
 * Not responsible for: tokens and emblems (`token-library.ts`) and the counters put on permanents,
 * such as +1/+1, shield or stun (I-19, the next scope line).
 *
 * @module deck/game-pieces
 */

import type { DeckCard } from "./types";

/** One kind of game piece, in the order the list shows them. */
export type GamePieceKind =
  | "monarch"
  | "initiative"
  | "dungeon"
  | "ring"
  | "dayNight"
  | "citysBlessing"
  | "energy"
  | "experience"
  | "poison";

/** A game piece and the deck's cards that need it, in name order and each named once. */
export interface GamePieceEntry {
  readonly kind: GamePieceKind;
  readonly cardNames: readonly string[];
}

/** Each piece with the Oracle-text pattern that names it, in display order. */
const PIECE_PATTERNS: readonly (readonly [GamePieceKind, RegExp])[] = [
  // CR 725.1: the monarch is a player designation; "there is no monarch in a game until an
  // effect instructs a player to become the monarch".
  ["monarch", /\bthe monarch\b/i],
  // CR 726.1, 726.2: the initiative is a player designation; taking it ventures into Undercity,
  // a dungeon card (CR 309), so the deck needs both.
  ["initiative", /\bthe initiative\b/i],
  // CR 309.2, 701.49: "venture into the dungeon" brings a dungeon card in from outside the game;
  // a card that asks whether "you've completed a dungeon" needs one on the table too.
  ["dungeon", /\bventures? into the dungeon\b|\bcompleted? a dungeon\b/i],
  // CR 701.54a, 701.54c: the first time "the Ring tempts you", the player gets an emblem named
  // The Ring, and a creature becomes their Ring-bearer.
  ["ring", /\bthe ring tempts you\b/i],
  // CR 731.1: "it becomes day" and "it becomes night" give the game a designation; a daybound or
  // nightbound permanent sets it when it is neither (CR 702.145d, 702.145g).
  ["dayNight", /\bit becomes (?:day|night)\b|\b(?:day|night)bound\b/i],
  // CR 702.131a-c: ascend gives "the city's blessing for the rest of the game", a marker.
  ["citysBlessing", /\bascend\b|\bthe city['’]s blessing\b/i],
  // CR 107.14: "{E}" is one energy counter on a player.
  ["energy", /\{E\}/],
  // CR 122.1: experience and poison counters are markers placed on a player. Infect, toxic and
  // poisonous deal them (CR 702.90, 702.164, 702.70), and their reminder text is removed.
  ["experience", /\bexperience counters?\b/i],
  ["poison", /\bpoison counters?\b|\binfect\b|\btoxic \d+|\bpoisonous \d+/i],
];

/**
 * Reminder text sits in parentheses and only summarizes a rule (CR 207.2a). Flavour text never
 * reaches here: Scryfall serves it apart from the Oracle text (CR 207.2b).
 *
 * A reminder runs from an opening parenthesis to the first closing one after it, and an opening
 * parenthesis that never closes keeps the rest of the text: the matches of `/\([^)]*\)/g`. A scan
 * replaces that expression, which re-read the rest of the text from every unclosed parenthesis
 * (quadratic time, SonarCloud S8786).
 */
function withoutReminderText(text: string): string {
  let kept = "";
  let cursor = 0;
  let open = text.indexOf("(");
  while (open !== -1) {
    const close = text.indexOf(")", open);
    if (close === -1) break;
    kept += text.slice(cursor, open);
    cursor = close + 1;
    open = text.indexOf("(", cursor);
  }
  return kept + text.slice(cursor);
}

function rulesTextOf(card: DeckCard): string {
  return withoutReminderText(card.oracleText);
}

/**
 * Lists the game pieces the deck's cards need, each once, with every card that needs it.
 *
 * @param cards - the deck's rows, the command zone included; a card named on several rows is
 *   listed once
 * @returns the pieces in a fixed order, each with its card names sorted; an empty list when no
 *   card needs a piece
 */
export function gamePiecesOf(
  cards: readonly DeckCard[]
): readonly GamePieceEntry[] {
  const rulesTexts = cards.map((card) => ({
    name: card.name,
    text: rulesTextOf(card),
  }));
  return PIECE_PATTERNS.flatMap(([kind, pattern]) => {
    const names = new Set(
      rulesTexts
        .filter(({ text }) => pattern.test(text))
        .map(({ name }) => name)
    );
    if (names.size === 0) return [];
    return [
      {
        kind,
        cardNames: [...names].sort((left, right) => left.localeCompare(right)),
      },
    ];
  });
}
