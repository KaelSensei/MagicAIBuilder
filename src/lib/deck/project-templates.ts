/**
 * The slot grids a project starts from, as data (I-113 slice 1, requirement 2.1,
 * `docs/product/specs/i113-a-project-across-my-own-decks-the-32-colour-identities-and-other-slot-grids.md`).
 *
 * Deck analysis, pure. Every identity is written in WUBRG order, as I-60's
 * counting module writes it, and is also the slot's key ("C" for colourless).
 * Not responsible for: an identity's name in words ("Azorius, white and
 * blue"), which the project page takes from the message catalogues (slice 2).
 *
 * @module deck/project-templates
 */

import type { IdentityColor } from "./player-stats";
import type { ProjectSlot } from "./project-fill";

/** The key of the colourless slot; an empty key would read as no slot at all. */
const COLOURLESS_KEY = "C";

const COLOURLESS: readonly (readonly IdentityColor[])[] = [[]];

const MONO: readonly (readonly IdentityColor[])[] = [
  ["W"],
  ["U"],
  ["B"],
  ["R"],
  ["G"],
];

/** Allied pairs, then enemy pairs. */
const PAIRS: readonly (readonly IdentityColor[])[] = [
  ["W", "U"],
  ["U", "B"],
  ["B", "R"],
  ["R", "G"],
  ["W", "G"],
  ["W", "B"],
  ["U", "R"],
  ["B", "G"],
  ["W", "R"],
  ["U", "G"],
];

/** Bant, Esper, Grixis, Jund, Naya. */
const SHARDS: readonly (readonly IdentityColor[])[] = [
  ["W", "U", "G"],
  ["W", "U", "B"],
  ["U", "B", "R"],
  ["B", "R", "G"],
  ["W", "R", "G"],
];

/** Abzan, Jeskai, Sultai, Mardu, Temur. */
const WEDGES: readonly (readonly IdentityColor[])[] = [
  ["W", "B", "G"],
  ["W", "U", "R"],
  ["U", "B", "G"],
  ["W", "B", "R"],
  ["U", "R", "G"],
];

/** Each four-colour identity, named by the colour it leaves out: W, U, B, R, then G. */
const FOUR_COLOUR: readonly (readonly IdentityColor[])[] = [
  ["U", "B", "R", "G"],
  ["W", "B", "R", "G"],
  ["W", "U", "R", "G"],
  ["W", "U", "B", "G"],
  ["W", "U", "B", "R"],
];

const FIVE_COLOUR: readonly (readonly IdentityColor[])[] = [
  ["W", "U", "B", "R", "G"],
];

/** The templates a project can start from. */
export type ProjectTemplate =
  "identities32" | "pairs10" | "shards5" | "wedges5" | "fourColour5";

/** The identities of each template, in the order its slots are listed. */
const TEMPLATE_IDENTITIES: Readonly<
  Record<ProjectTemplate, readonly (readonly IdentityColor[])[]>
> = {
  identities32: [
    ...COLOURLESS,
    ...MONO,
    ...PAIRS,
    ...SHARDS,
    ...WEDGES,
    ...FOUR_COLOUR,
    ...FIVE_COLOUR,
  ],
  pairs10: PAIRS,
  shards5: SHARDS,
  wedges5: WEDGES,
  fourColour5: FOUR_COLOUR,
};

/**
 * The slots a new project from a template starts with, none of them skipped.
 *
 * @param template - the grid the owner chose
 * @returns one slot per identity, keyed by the identity in WUBRG order
 */
export function templateSlots(
  template: ProjectTemplate
): readonly ProjectSlot[] {
  return TEMPLATE_IDENTITIES[template].map((identity) => ({
    key: identity.join("") || COLOURLESS_KEY,
    identity,
    skipped: false,
  }));
}
