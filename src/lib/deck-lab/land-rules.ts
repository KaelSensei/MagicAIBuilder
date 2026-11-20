/**
 * Deck Lab's land rules: basic land, fetch land, tapped, conditionally tapped and untapped land,
 * and the land back of a modal double-faced card (I-31 requirement 2.1).
 *
 * Context: deck analysis, Deck Lab. The research model plays a land untapped (`land`) or tapped
 * (`tland`); a land the player can make enter untapped, such as a shock land, plays untapped.
 *
 * @module deck-lab/land-rules
 */
import { colorsProducedBy, PIP_COLORS } from "@/lib/deck/mana-alignment";
import { isBasicLand } from "@/lib/scryfall/type-line";

import {
  hasCardType,
  type CardFaces,
  type FaceText,
  type LabFacts,
} from "./card-faces";
import {
  entryRuleOf,
  landSearchOf,
  manaAbilityOf,
  namedColourRule,
  searchedColours,
} from "./oracle-text";
import type { LabCard } from "./types";

/**
 * The colours a land makes. A rule-named colour ("any color in your commander's color identity",
 * "any color that a land an opponent controls could produce") comes first; otherwise
 * `colorsProducedBy` reads the land's basic land types and its "Add" clauses.
 */
function landProduction(
  face: FaceText
): Pick<LabCard, "produces" | "dependsOnOpponents"> {
  const named = namedColourRule(face.oracleText);
  if (named) return named;
  const colours = colorsProducedBy(face);
  return {
    produces: {
      kind: "colours",
      colours: PIP_COLORS.filter((colour) => colours.has(colour)),
    },
    dependsOnOpponents: false,
  };
}

/**
 * Mana a land adds: its tap mana ability's, or one for a land whose only mana ability comes from
 * a basic land type (CR 305.6), such as Dryad Arbor; none for a land that makes no mana.
 */
function landOut(
  face: FaceText,
  production: Pick<LabCard, "produces">
): number {
  const ability = manaAbilityOf(face.oracleText);
  if (ability) return ability.out;
  const { produces } = production;
  return produces.kind === "colours" && produces.colours.length === 0 ? 0 : 1;
}

/**
 * Classifies a land face.
 *
 * @param face - a face whose card types include Land
 * @returns its kind, rule and mana facts
 */
export function classifyLandFace(face: FaceText): LabFacts {
  const search = landSearchOf(face.oracleText);
  if (search) {
    return {
      kind: "fetch",
      ruleId: "fetch-land",
      out: 1,
      fetchTypes: search.targets,
      produces: searchedColours(search.targets),
      entersTapped: search.foundTapped,
    };
  }
  const production = landProduction(face);
  const out = landOut(face, production);
  if (isBasicLand(face.typeLine))
    return { kind: "land", ruleId: "basic-land", out, ...production };
  switch (entryRuleOf(face.oracleText)) {
    case "tapped":
      return {
        kind: "tland",
        ruleId: "tapped-land",
        out,
        entersTapped: true,
        ...production,
      };
    case "conditionally-tapped":
      return {
        kind: "land",
        ruleId: "conditionally-tapped-land",
        out,
        ...production,
      };
    case "untapped":
      return { kind: "land", ruleId: "untapped-land", out, ...production };
  }
}

/**
 * Classifies a modal double-faced card (CR 712.3) whose front is a spell and whose back is a
 * land. It is cast as its spell or played as its land face (CR 712.12), so it keeps its land
 * back's mana facts. A card
 * Scryfall lays out otherwise, such as a transforming card with a land back (Treasure Map), is
 * not one: it cannot be played as a land.
 *
 * @param faces - the card's faces
 * @param layout - Scryfall's layout, when the deck row kept it
 * @returns its facts, or `undefined` when it is not such a card
 */
export function classifyModalLand(
  faces: CardFaces,
  layout: string | undefined
): LabFacts | undefined {
  const { front, back } = faces;
  if (back === undefined || (layout !== undefined && layout !== "modal_dfc"))
    return undefined;
  if (hasCardType(front, "Land") || !hasCardType(back, "Land"))
    return undefined;
  const land = classifyLandFace(back);
  return { ...land, kind: "mdfc", ruleId: "mdfc-land-back" };
}
