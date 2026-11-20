/**
 * The dated land-cycle table: how each land cycle enters the battlefield, keyed by Scryfall's
 * land-cycle search keywords (I-58 requirement 4.2).
 *
 * Context: deck analysis, mana base (I-58 slice 2). A land's entry class says whether it can be
 * a source the turn it is played: Karsten counts a tapped land from turn 2 only [I-58 ref. 3].
 * Entering tapped is a replacement effect (CR 614.1c); paying life to avoid it is CR 119.4.
 * The table is reviewed in a pull request and dated, like I-57's set lists: a new cycle, or a
 * cycle Scryfall regroups, is a reviewed change to this file.
 * Source: Scryfall's search keywords, each of which returned cards on 2026-11-10, for example
 * https://scryfall.com/search?q=is%3Afastland (I-58 ref. 18).
 * Not responsible for: telling which cycle a card belongs to (the land catalogue, I-58 slice 5),
 * or reading a land's Oracle text (`land-classifier.ts`).
 *
 * @module deck/land-cycles
 */

/** Scryfall's land-cycle keywords (`is:<keyword>`), as they answered on 2026-11-10. */
export const LAND_CYCLES = [
  "dual",
  "fetchland",
  "shockland",
  "fastland",
  "checkland",
  "slowland",
  "painland",
  "bounceland",
  "gainland",
  "pathway",
  "triland",
  "bikeland",
  "filterland",
  "battleland",
  "scryland",
  "bondland",
  "canopyland",
  "creatureland",
  "surveilland",
  "shadowland",
  "snarl",
] as const;

/** One of {@link LAND_CYCLES}. */
export type LandCycle = (typeof LAND_CYCLES)[number];

/**
 * How a land enters the battlefield, one of four classes stated in words (I-58 requirement 4.2):
 * - `untapped`: it can be tapped for mana the turn it is played;
 * - `tapped`: it always enters tapped;
 * - `conditional`: it enters untapped when `condition` holds, and tapped otherwise;
 * - `paid`: it is usable the turn it is played for `cost` (life, damage, or a fixed colour).
 */
export type LandEntry =
  | { readonly class: "untapped" }
  | { readonly class: "tapped" }
  | { readonly class: "conditional"; readonly condition: string }
  | { readonly class: "paid"; readonly cost: string };

/**
 * What the table says about one cycle: its entry class, or `per-card` for a cycle whose lands
 * enter differently (creature lands: Mishra's Factory enters untapped, Raging Ravine tapped), so
 * each land's own Oracle text decides.
 */
export type CycleEntry =
  | { readonly kind: "fixed"; readonly entry: LandEntry }
  | { readonly kind: "per-card" };

const UNTAPPED: CycleEntry = { kind: "fixed", entry: { class: "untapped" } };
const TAPPED: CycleEntry = { kind: "fixed", entry: { class: "tapped" } };

/** A cycle that enters untapped when `condition` holds. */
function conditional(condition: string): CycleEntry {
  return { kind: "fixed", entry: { class: "conditional", condition } };
}

/** A cycle usable the turn it is played for `cost`. */
function paid(cost: string): CycleEntry {
  return { kind: "fixed", entry: { class: "paid", cost } };
}

/** Shadow lands and snarls: untapped when the player reveals a matching card from hand. */
const REVEAL_LAND = conditional(
  "you reveal a card of one of its basic land types from your hand"
);

/** The table, with the dates it was checked against Scryfall and last reviewed. */
export const LAND_CYCLE_TABLE: {
  readonly keywordsCheckedOn: string;
  readonly reviewedOn: string;
  readonly cycles: Readonly<Record<LandCycle, CycleEntry>>;
} = {
  keywordsCheckedOn: "2026-11-10",
  reviewedOn: "2026-11-20",
  cycles: {
    dual: UNTAPPED,
    fetchland: UNTAPPED,
    shockland: paid("pay 2 life"),
    fastland: conditional("you control two or fewer other lands"),
    checkland: conditional(
      "you control a land with one of its basic land types"
    ),
    slowland: conditional("you control two or more other lands"),
    painland: paid("1 damage when it taps for coloured mana"),
    bounceland: TAPPED,
    gainland: TAPPED,
    pathway: paid("one colour, chosen by the face played"),
    triland: TAPPED,
    bikeland: TAPPED,
    filterland: UNTAPPED,
    battleland: conditional("you control two or more basic lands"),
    scryland: TAPPED,
    bondland: conditional("you have two or more opponents"),
    canopyland: paid("1 life when it taps for coloured mana"),
    creatureland: { kind: "per-card" },
    surveilland: TAPPED,
    shadowland: REVEAL_LAND,
    snarl: REVEAL_LAND,
  },
};
