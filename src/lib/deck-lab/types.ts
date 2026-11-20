/**
 * Deck Lab's card model: what the goldfish model needs to know about one card (I-31 requirement 2
 * and its `LabCard` data model).
 *
 * Context: deck analysis, Deck Lab (I-31). The kinds are the research model's
 * (`scripts/research/commander-opening-hands/model.mjs`), plus the fetch land and the modal
 * double-faced card the colour model (slice 4) needs. Colours are parsed here but no slice reads
 * them yet. I-58 slice 2 (the land classifier) reads the mana facts from this model.
 *
 * Not responsible for: the deck's single `category` (`lib/deck/categories.ts`), which the norms
 * use, or storing the player's overrides (a later slice and a migration).
 *
 * @module deck-lab/types
 */
import type { PipColor } from "@/lib/deck/mana-alignment";

/**
 * Every kind of card the model plays, as the research model names them:
 * - `land`: a land usable the turn it is played; `tland`: a land that enters tapped;
 * - `fetch`: a land that sacrifices itself to put a land from the library onto the battlefield;
 * - `mdfc`: a modal double-faced card with a spell front and a land back (CR 712.3), played as
 *   one or the other;
 * - `rock`: artifact mana, usable the turn it lands; `dork`: creature mana, usable from the next
 *   turn (CR 302.6, summoning sickness);
 * - `lramp`: a spell that puts lands from the library onto the battlefield or into the hand;
 * - `draw`: draws cards once; `engine`: draws one extra card on each of the player's later turns;
 * - `spell`: everything else.
 */
export const LAB_KINDS = [
  "land",
  "tland",
  "fetch",
  "mdfc",
  "rock",
  "dork",
  "lramp",
  "draw",
  "engine",
  "spell",
] as const;

/** One of {@link LAB_KINDS}. */
export type LabKind = (typeof LAB_KINDS)[number];

/**
 * The rule that classified a card, shown to the player next to its kind (I-31 requirement 2.2).
 * A run key will hash the classification version, so renaming one is a version change.
 */
export type LabRuleId =
  | "basic-land"
  | "fetch-land"
  | "mdfc-land-back"
  | "tapped-land"
  | "conditionally-tapped-land"
  | "untapped-land"
  | "mana-creature"
  | "mana-rock"
  | "filter-rock"
  | "land-search-ramp"
  | "burst-draw"
  | "draw-engine"
  | "spell-fallback";

/**
 * What colours of mana a card makes:
 * - `colours`: the listed colours, empty for a source of colourless mana only (or no mana);
 * - `identity`: any colour of the commander's colour identity (CR 903.4), as Command Tower and
 *   Arcane Signet say, and as Deck Lab assumes for a card whose colours depend on the opponents
 *   (requirement 2.4);
 * - `any`: any of the five colours.
 */
export type ManaProduced =
  | { readonly kind: "colours"; readonly colours: readonly PipColor[] }
  | { readonly kind: "identity" }
  | { readonly kind: "any" };

/** A basic land type (CR 305.6): the land types a fetch land can name. */
export type BasicLandType =
  "Plains" | "Island" | "Swamp" | "Mountain" | "Forest";

/** What a fetch or a land-ramp spell can find: a land with a basic land type, or a basic land. */
export type FetchTarget = BasicLandType | "basic";

/** The coloured pips of a card's mana cost, hybrid symbols counted as halves. */
export type LabPips = Readonly<Record<PipColor, number>>;

/**
 * One copy of a card as Deck Lab plays it. A deck row with three copies gives three lab cards,
 * so the spec's `quantity` field is always one and is left out.
 */
export interface LabCard {
  /** The card's name as the deck lists it: the key of its overrides. */
  readonly name: string;
  readonly kind: LabKind;
  /** Mana value to cast it (CR 202.3); 0 for a land, the front face's for an MDFC. */
  readonly cost: number;
  readonly pips: LabPips;
  /** Colours of the mana it makes; for a fetch, of the lands it can find. */
  readonly produces: ManaProduced;
  /** True when its colours depend on the opponents' lands (requirement 2.4). */
  readonly dependsOnOpponents: boolean;
  /** Mana it adds each turn, net of what its ability costs; a land-ramp spell's lands. */
  readonly out: number;
  /** For a land, whether it enters tapped; for a fetch or land ramp, whether the land found does. */
  readonly entersTapped: boolean;
  readonly fetchTypes: readonly FetchTarget[];
  /** Cards a draw spell draws, or an engine draws each turn. */
  readonly drawN: number;
  /** Lands a land-ramp spell puts into the hand. */
  readonly toHand: number;
  /** A key card the player wants in the opening hand; only an override sets it. */
  readonly key: boolean;
  /** The rule that classified it, kept when an override changes the result. */
  readonly ruleId: LabRuleId;
  /** True when a player's override changed a field. */
  readonly overridden: boolean;
}

/** The fields of a lab card a player can override per deck (requirement 2.2). */
export type LabCardOverride = Partial<
  Pick<
    LabCard,
    | "kind"
    | "cost"
    | "produces"
    | "dependsOnOpponents"
    | "out"
    | "entersTapped"
    | "fetchTypes"
    | "drawN"
    | "toHand"
    | "key"
  >
>;

/** A deck classified for the lab. */
export interface DeckClassification {
  /** One lab card per main-deck copy, ordered by name so the order of the rows does not matter. */
  readonly library: readonly LabCard[];
  /** The commander, then the partner (CR 903.6): they start in the command zone. */
  readonly commandZone: readonly LabCard[];
  /** Lab cards, in both zones, that no rule matched and no override changed (requirement 2.3). */
  readonly fallbackCount: number;
}
