/**
 * A deck's place in its owner's roster and what each place counts for.
 *
 * Deck building context (I-114 slice 1): the stage vocabulary and its counting
 * rules, kept as data so the readers changed in slice 2 (the commitment index,
 * the acquisition plan, deck pickers, the active-deck count) ask one table.
 * Not responsible for: storing a deck's stage (slice 2, `Deck.stage`), the
 * acquisition plan's "include resting decks" option, or the dialogs.
 *
 * @module deck/deck-stage
 */

/** Every stage a deck can be in. */
export const DECK_STAGES = ["inRotation", "resting", "retired"] as const;

/**
 * A deck's place in the roster, set by its owner (I-114 2.1): in rotation
 * (played), resting (built, not played for now) or retired (on the shelf,
 * its list kept so it can be rebuilt).
 */
export type DeckStage = (typeof DECK_STAGES)[number];

/** Every deck starts in rotation, so a deck without a stage counts as it did before I-114. */
export const DEFAULT_DECK_STAGE: DeckStage = "inRotation";

/** What a deck in one stage counts for in the rest of the product. */
export interface StageRules {
  /** Its main and command-zone copies are committed in I-16's commitment index. */
  readonly commitsCopies: boolean;
  /** Its missing cards appear in I-06's acquisition plan by default. */
  readonly feedsPlan: boolean;
  /** It is offered where the player picks one of their decks to add a card to. */
  readonly inPickers: boolean;
  /** It counts toward the decks "in rotation" (I-60 3.1's active decks, I-114 4.2's roster target). */
  readonly countsAsActive: boolean;
}

/**
 * The counting rules of each stage. The `Record<DeckStage, …>` type makes a
 * stage without rules a compile error.
 *
 * Resting stays in pickers: the deck is still built and may still be tuned.
 * It leaves the plan only by default; the plan's "include resting decks"
 * option (I-114 open question 2, D-107) belongs to the plan, not to this table.
 */
const STAGE_RULES: Readonly<Record<DeckStage, StageRules>> = {
  inRotation: {
    commitsCopies: true,
    feedsPlan: true,
    inPickers: true,
    countsAsActive: true,
  },
  resting: {
    commitsCopies: true,
    feedsPlan: false,
    inPickers: true,
    countsAsActive: false,
  },
  retired: {
    commitsCopies: false,
    feedsPlan: false,
    inPickers: false,
    countsAsActive: false,
  },
};

/**
 * What a deck in `stage` counts for (I-114 2.2): a retired deck commits no
 * copy and leaves the acquisition plan; a resting deck keeps its copies and
 * leaves the plan by default; a deck in rotation counts everywhere.
 *
 * @example stageRules("retired").commitsCopies // false: its copies are free for other decks
 */
export function stageRules(stage: DeckStage): StageRules {
  return STAGE_RULES[stage];
}

const STAGE_SET: ReadonlySet<unknown> = new Set<unknown>(DECK_STAGES);

/**
 * Whether `value` is one of the stage names, exactly as stored (case matters).
 * For parsing a stage that comes from a request or from storage.
 */
export function isDeckStage(value: unknown): value is DeckStage {
  return STAGE_SET.has(value);
}
