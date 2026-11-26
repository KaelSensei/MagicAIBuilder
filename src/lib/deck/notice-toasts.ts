/**
 * The toasts the deck store raises that are not a failed save or load, as catalogue keys with
 * their values: the Game Changer warnings, the undo notices, the forced save's confirmation and
 * the command-zone refusals.
 *
 * The store has no locale of its own, so it raises each message by its key and the toast
 * container translates it in the player's locale (I-04). Card names and counts travel as values,
 * never inside English words. The English catalogue keeps the words the store used to hard-code.
 * Every key lives in each locale's `deck.json`; the toast store accepts them through its
 * `LocalizedToastKey` (`hooks/useToast.ts`). The failures are in `failure-toasts.ts`.
 *
 * @module deck/notice-toasts
 */
import { BRACKET_DEFINITIONS } from "@/lib/constants/brackets";

/** The catalogue key of each notice the deck store raises. */
export type DeckNoticeToastKey =
  | "deck.sync.saved"
  | "deck.undo.applied"
  | "deck.undo.ambiguousPrinting"
  | "deck.commandZoneRefusal.companionNeedsCommander"
  | "deck.commandZoneRefusal.notCompanion"
  | "deck.commandZoneRefusal.bannedCompanion"
  | "deck.commandZoneRefusal.unpairable"
  | "deck.gameChangerAdded.first"
  | "deck.gameChangerAdded.withinBracket3"
  | "deck.gameChangerAdded.beyondBracket3"
  | "deck.gameChangerAdded.commander";

/** The values a notice's message is formatted with: card names and counts. */
export type DeckNoticeValues = Readonly<Record<string, string | number>>;

/** A notice, raised by its catalogue key with the values its message needs. */
export interface DeckNoticeToast {
  readonly key: DeckNoticeToastKey;
  readonly values?: DeckNoticeValues;
}

/** The notices whose message needs no value. */
export const DECK_NOTICE_TOASTS = {
  saved: { key: "deck.sync.saved" },
  undoApplied: { key: "deck.undo.applied" },
  undoAmbiguousPrinting: { key: "deck.undo.ambiguousPrinting" },
  companionNeedsCommander: {
    key: "deck.commandZoneRefusal.companionNeedsCommander",
  },
  notCompanion: { key: "deck.commandZoneRefusal.notCompanion" },
  bannedCompanion: { key: "deck.commandZoneRefusal.bannedCompanion" },
} satisfies Readonly<Record<string, DeckNoticeToast>>;

/**
 * The most Game Changers a Bracket 3 deck may run; one more puts the deck in Bracket 4. Brackets
 * 1 and 2 allow none, so the first one already makes the deck Bracket 3 at least (official
 * bracket table, `constants/brackets.ts`).
 */
const BRACKET_3_GAME_CHANGERS = BRACKET_DEFINITIONS[3].maxGameChangers;

/**
 * The warning for a Game Changer joining the deck list, by the deck's Game Changer total once it
 * has joined: the first one, one within Bracket 3's allowance (shown as `total/limit`), or one
 * past it.
 *
 * @param card - the name of the card being added
 * @param total - the deck's Game Changers with this one, commander included; 1 or more
 * @returns the warning toast, with the card name and the counts as values
 */
export function gameChangerAddedToast(
  card: string,
  total: number
): DeckNoticeToast {
  if (total === 1) {
    return { key: "deck.gameChangerAdded.first", values: { card } };
  }
  if (total <= BRACKET_3_GAME_CHANGERS) {
    return {
      key: "deck.gameChangerAdded.withinBracket3",
      values: { card, total, limit: BRACKET_3_GAME_CHANGERS },
    };
  }
  return {
    key: "deck.gameChangerAdded.beyondBracket3",
    values: { card, total },
  };
}

/**
 * The warning for a Game Changer chosen as commander: a commander is in the deck, so the deck is
 * Bracket 3 at least.
 *
 * @param card - the commander's name
 * @returns the warning toast, with the card name as a value
 */
export function commanderGameChangerToast(card: string): DeckNoticeToast {
  return { key: "deck.gameChangerAdded.commander", values: { card } };
}

/**
 * The refusal of a second commander whose partner ability does not pair with the commander's
 * (CR 702.124a).
 *
 * @param partner - the name of the card refused as partner
 * @param commander - the commander's name
 * @returns the warning toast, with both names as values
 */
export function unpairableToast(
  partner: string,
  commander: string
): DeckNoticeToast {
  return {
    key: "deck.commandZoneRefusal.unpairable",
    values: { partner, commander },
  };
}
